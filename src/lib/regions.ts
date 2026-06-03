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

const CACHE_KEY = "bestRegion";
const TTL_MS = 60 * 60 * 1000; // 1 hour — region latencies are stable on this timescale
let memoryCache: { value: Ranked; expires: number } | null = null;

async function pingRegion(region: string) {
  const url = `https://dynamodb.${region}.amazonaws.com/ping`;
  const start = performance.now();
  try {
    await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" });
    return performance.now() - start;
  } catch {
    return Infinity; // unreachable
  }
}

async function rankRegions(): Promise<Ranked> {
  const results = await Promise.all(
    Object.keys(regions).map(async (region: string) => ({
      region,
      latency: await pingRegion(region),
    }))
  );
  results.sort((a, b) => a.latency - b.latency);
  return results; // results[0] is the best region
}

export async function getBestRegion(): Promise<Ranked> {
  const now = Date.now();

  // 1. In-memory cache — instant for in-tab navigations.
  if (memoryCache && memoryCache.expires > now) return memoryCache.value;

  // 2. sessionStorage — survives a page refresh inside the same tab.
  if (typeof sessionStorage !== "undefined") {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { value: Ranked; expires: number };
        if (parsed.expires > now) {
          memoryCache = parsed;
          return parsed.value;
        }
      } catch { /* corrupt entry — ignore and re-ping */ }
    }
  }

  // 3. Fresh ping.
  const value = await rankRegions();
  const entry = { value, expires: now + TTL_MS };
  memoryCache = entry;
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry)); }
    catch { /* quota or private-mode — proceed without persistence */ }
  }
  return value;
}
