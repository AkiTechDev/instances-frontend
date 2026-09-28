export const regions: {[id: string]: string} = {
  'sa-east-1': 'Sao Paulo',
  'us-east-1': 'N. Virginia',
  'us-east-2': 'Ohio',
  'us-west-1': 'N. California',
  'us-west-2': 'Oregon',
  'ap-south-1': 'Mumbai',
  'ap-northeast-1': 'Tokyo',
  'ap-northeast-2': 'Seoul',
  'ap-southeast-1': 'Singapore',
  'ap-southeast-2': 'Sydney',
  'ca-central-1': 'Canada',
  'eu-central-1': 'Frankfurt',
  'eu-west-1': 'Ireland',
  'eu-west-2': 'London',
};

type Ranked = { region: string; latency: number }[];

const CACHE_KEY = "regionRanking";
const TTL_MS = 60 * 60 * 1000; // 1 hour — region latencies are stable on this timescale
// Timed round trips per region once its connection is open. The fastest one
// counts: a slower sample is noise — a busy main thread delays when the
// response is noticed — never evidence that the region is further away.
const SAMPLES = 2;
// Ranking waits on every region, so without a cap one hung request meant a
// modal stuck on "Finding the closest region…". Past these, a region is ranked
// last instead.
const CONNECT_TIMEOUT_MS = 4000;
const SAMPLE_TIMEOUT_MS = 2000;

let memoryCache: { value: Ranked; expires: number } | null = null;
let inFlight: Promise<Ranked> | null = null;

/** Milliseconds for one GET of the region's health check; Infinity if it fails or times out. */
async function ping(region: string, timeoutMs: number): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    await fetch(`https://dynamodb.${region}.amazonaws.com/ping`, {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return performance.now() - start;
  } catch {
    return Infinity; // unreachable, blocked, or too slow
  } finally {
    clearTimeout(timer);
  }
}

/* A region's first request pays for DNS, TCP and a TLS handshake, and that
   cost swings by seconds for reasons unrelated to distance. Timing it is what
   ranked Frankfurt 11th for a first visit from London — 1.8s, behind Sydney —
   when its round trip is 18ms. So the first request only opens the
   connection, and the ranking comes from the ones that follow it down that
   connection, which are one round trip each. */
async function measureRegion(region: string): Promise<number> {
  if (await ping(region, CONNECT_TIMEOUT_MS) === Infinity) return Infinity;
  let best = Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    best = Math.min(best, await ping(region, SAMPLE_TIMEOUT_MS));
  }
  return best;
}

async function rankRegions(): Promise<Ranked> {
  const results = await Promise.all(
    Object.keys(regions).map(async (region: string) => ({
      region,
      latency: await measureRegion(region),
    }))
  );
  // `|| 0` because Infinity - Infinity is NaN; the sort is stable, so the
  // regions that didn't answer keep the table's order behind the rest.
  results.sort((a, b) => (a.latency - b.latency) || 0);
  return results; // results[0] is the best region
}

function readStored(now: number): { value: Ranked; expires: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: Ranked; expires: number };
    return parsed.expires > now ? parsed : null;
  } catch {
    return null; // storage blocked or a corrupt entry — re-ping
  }
}

export function getBestRegion(): Promise<Ranked> {
  const now = Date.now();

  // 1. In-memory cache — instant for in-tab navigations.
  if (memoryCache && memoryCache.expires > now) return Promise.resolve(memoryCache.value);

  // 2. localStorage — survives a refresh, a new tab, and a return visit.
  const stored = readStored(now);
  if (stored) {
    memoryCache = stored;
    return Promise.resolve(stored.value);
  }

  // 3. Fresh ping. One at a time: the idle preload and a user who clicks
  //    "Create" before it finishes share the same ranking.
  inFlight ??= rankRegions()
    .then((value) => {
      // Nothing answered — offline, or the pings are blocked. That order is
      // just the table's, so it isn't cached; the next open tries again.
      if (value.every(({ latency }) => latency === Infinity)) return value;
      const entry = { value, expires: Date.now() + TTL_MS };
      memoryCache = entry;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); }
      catch { /* quota or private mode — proceed without persistence */ }
      return value;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Region ids to display names, closest region first — the create modal's picker options. */
export async function getRegionsByLatency(): Promise<{ [id: string]: string }> {
  const ordered = await getBestRegion();
  return Object.fromEntries(ordered.map(({ region }) => [region, regions[region]]));
}

/**
 * Ranks the regions in the background once the page is idle, so the create
 * modal normally opens onto a finished list instead of waiting on 14 regions.
 * Idle rather than immediate so the handshakes don't compete with the page's
 * own first requests, and a busy main thread doesn't skew the timings. Cheap
 * to call on every visit: it's a no-op while the ranking is cached.
 */
export function preloadRegionRanking(): void {
  const run = () => { void getBestRegion(); };
  if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 1000);
}
