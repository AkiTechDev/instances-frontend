import { API_BASE, authHeaders } from "./apis";

/**
 * Account standing: what the backend says about this account's entitlement,
 * and which nudge, if any, to show for it.
 *
 * The browser never re-derives standing. The backend computes one status for
 * the start gate and, in the same place, a ranked list of prompts; this module
 * parses that answer defensively and caches it. There are no billing rules in
 * here, and there shouldn't ever be — thresholds, timing and escalation all
 * change server-side without a frontend release.
 */

export type AccountStatus = "TRIALING" | "ACTIVE" | "EXHAUSTED" | "SUSPENDED" | "UNKNOWN";
export type PromptKind = "payment" | "review" | "update_card";
export type PromptSurface = "banner" | "modal";

export interface StandingPrompt {
    /** Versioned (`trial-80-2026q4`), so a new campaign never arrives pre-dismissed. */
    id: string,
    kind: PromptKind,
    surface: PromptSurface,
    priority: number,
    /** Whether a dismissal may be remembered. Blocked states never are. */
    dismissible: boolean,
    /** How long a dismissal lasts. Absent: until the id changes. */
    snooze_hours?: number,
    /** Server-side override of the local copy — for something urgent that
     *  can't wait for a frontend release. Normally unset. */
    message?: string,
}

export interface TrialUsage {
    granted_seconds: number,
    used_seconds: number,
    remaining_seconds: number,
    percent_used: number,
}

export interface AccountStanding {
    status: AccountStatus,
    reason?: string,
    /** Precomputed server-side, so the blocked set is defined in one place. */
    blocked: boolean,
    /**
     * Absent for accounts that signed up with a card — which means "no trial
     * UI", never a trial at zero.
     *
     * The usage is only live while TRIALING. The session tracker stops adding
     * playtime once the status moves on, so an EXHAUSTED account routinely
     * reports time "remaining" (the test account sits at 97% with 100s left).
     * The status is the truth; outside TRIALING, used, remaining and percent
     * must not be shown. `granted_seconds` is the exception — it is what the
     * trial was, not a count of it — and the trial-over modal names it.
     */
    trial?: TrialUsage,
    prompts: StandingPrompt[],
    /** Server clock, ISO 8601. */
    as_of?: string,
    /** The server's own cache policy for this answer, when it sends one. */
    ttl_seconds?: number,
}

/** An answer plus when this browser got it and how long it may be reused. */
export interface StandingSnapshot {
    standing: AccountStanding,
    /** Epoch ms on this browser's clock. */
    receivedAt: number,
    /** Epoch ms after which a soft refresh re-reads. Infinity: only a forced one does. */
    expires: number,
}

// ---------------------------------------------------------------------------
// Normaliser
// ---------------------------------------------------------------------------

/* The schema may have drifted — values quoted in conversation (TRIAL_EXHAUSTED)
   differ from the design doc's (EXHAUSTED + reason) — so both are accepted.
   UNKNOWN is listed because the endpoint sends it on purpose for an account
   with no standing record yet; that is not contract drift. */
const ALIASES: Record<string, AccountStatus> = {
    TRIALING: "TRIALING", TRIAL: "TRIALING", TRIAL_ACTIVE: "TRIALING",
    ACTIVE: "ACTIVE",
    EXHAUSTED: "EXHAUSTED", TRIAL_EXHAUSTED: "EXHAUSTED",
    SUSPENDED: "SUSPENDED", DELINQUENT: "SUSPENDED",
    UNKNOWN: "UNKNOWN",
};

const KINDS: readonly string[] = ["payment", "review", "update_card"] satisfies PromptKind[];
const SURFACES: readonly string[] = ["banner", "modal"] satisfies PromptSurface[];

/* Once per distinct problem, not once per read — a contract change would
   otherwise log on every tab focus. */
const warned = new Set<string>();
const warnOnce = (problem: string, detail?: unknown) => {
    if (warned.has(problem)) return;
    warned.add(problem);
    console.warn(`account standing: ${problem}`, detail);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

const nonNegative = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;

const positive = (v: unknown): number | undefined => {
    const n = nonNegative(v);
    return n ? n : undefined;
};

const parseStatus = (raw: unknown): AccountStatus => {
    const status = typeof raw === "string" ? ALIASES[raw.toUpperCase()] : undefined;
    if (!status) warnOnce(`unrecognised status ${JSON.stringify(raw)}`);
    return status ?? "UNKNOWN";
};

const parseTrial = (raw: unknown): TrialUsage | undefined => {
    if (raw === undefined || raw === null) return undefined;

    const granted = isRecord(raw) ? positive(raw.granted_seconds) : undefined;
    const used = isRecord(raw) ? nonNegative(raw.used_seconds) : undefined;
    if (!isRecord(raw) || granted === undefined || used === undefined) {
        warnOnce("unreadable trial block", raw);
        return undefined;
    }

    return {
        granted_seconds: granted,
        used_seconds: used,
        remaining_seconds: nonNegative(raw.remaining_seconds) ?? Math.max(0, granted - used),
        percent_used: nonNegative(raw.percent_used) ?? Math.min(100, Math.floor((used / granted) * 100)),
    };
};

/** Drops anything it can't fully read. An unknown kind or surface is skipped,
 *  not guessed at — the frontend never invents a prompt the server didn't mean. */
const parsePrompt = (raw: unknown): StandingPrompt[] => {
    if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id) {
        warnOnce("prompt without an id", raw);
        return [];
    }
    if (typeof raw.kind !== "string" || !KINDS.includes(raw.kind)) {
        warnOnce(`unrecognised prompt kind ${JSON.stringify(raw.kind)}`);
        return [];
    }
    if (typeof raw.surface !== "string" || !SURFACES.includes(raw.surface)) {
        warnOnce(`unrecognised prompt surface ${JSON.stringify(raw.surface)}`);
        return [];
    }

    return [{
        id: raw.id,
        kind: raw.kind as PromptKind,
        surface: raw.surface as PromptSurface,
        priority: typeof raw.priority === "number" && Number.isFinite(raw.priority) ? raw.priority : 0,
        // Anything short of an explicit true: a remembered dismissal must never
        // hide a prompt the server didn't say could be hidden.
        dismissible: raw.dismissible === true,
        snooze_hours: positive(raw.snooze_hours),
        message: typeof raw.message === "string" && raw.message.trim() ? raw.message.trim() : undefined,
    }];
};

/**
 * Reads whatever `/user/standing` sent into a shape the UI can trust.
 *
 * An unreadable status fails *open*: UNKNOWN, nothing blocked, no prompts. The
 * gate is the enforcement; a frontend that can't parse a status has no
 * business telling someone they haven't paid.
 */
export const parseStanding = (raw: unknown): AccountStanding => {
    if (!isRecord(raw)) {
        warnOnce("unreadable standing payload", raw);
        return { status: "UNKNOWN", blocked: false, prompts: [] };
    }

    const status = parseStatus(raw.status);
    const as_of = typeof raw.as_of === "string" ? raw.as_of : undefined;
    const ttl_seconds = positive(raw.ttl_seconds);

    if (status === "UNKNOWN") return { status, blocked: false, prompts: [], as_of, ttl_seconds };

    return {
        status,
        reason: typeof raw.reason === "string" ? raw.reason : undefined,
        blocked: raw.blocked === true,
        trial: parseTrial(raw.trial),
        prompts: Array.isArray(raw.prompts) ? raw.prompts.flatMap(parsePrompt) : [],
        as_of,
        ttl_seconds,
    };
};

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const MOCK_SCENARIO = import.meta.env.PUBLIC_STANDING_MOCK?.trim() || undefined;

/** The raw answer — parse it with `parseStanding`. */
export const fetchStanding = async (): Promise<unknown> => {
    if (MOCK_SCENARIO) {
        // Loaded on demand so the fixtures stay out of a normal build's bundle.
        const { mockStanding } = await import("./accountMock");
        return mockStanding(MOCK_SCENARIO);
    }

    // Plain fetch rather than apiFetch: a 402 from this endpoint would
    // otherwise ask this very read to repeat itself.
    const resp = await fetch(`${API_BASE}/user/standing`, {
        method: "GET",
        // The sessionStorage TTL below is the only cache. An HTTP one would be
        // a second TTL that a forced re-read after checkout couldn't clear.
        cache: "no-store",
        headers: await authHeaders(),
    });

    if (!resp.ok) throw new Error(`Failed to fetch account standing (${resp.status})`);

    return await resp.json();
};

// ---------------------------------------------------------------------------
// sessionStorage cache
// ---------------------------------------------------------------------------

/* sessionStorage rather than memory alone because this is an Astro MPA:
   arriving on /dashboard from /pricing is a full document load, and in-memory
   state starts empty every time. Keyed by `sub` so a second account signing
   in on the same tab never reads the first one's answer. The raw payload is
   stored and re-parsed on the way out, so a normaliser fix applies to cached
   answers too. */
const cacheKey = (sub: string) => `standing:${sub}`;

interface CacheEntry {
    raw: unknown,
    receivedAt: number,
    expires: number,
}

export const readCachedStanding = (sub: string): StandingSnapshot | null => {
    try {
        const stored = sessionStorage.getItem(cacheKey(sub));
        if (!stored) return null;

        const entry = JSON.parse(stored) as Partial<CacheEntry>;
        if (typeof entry.receivedAt !== "number" || typeof entry.expires !== "number") return null;
        if (entry.expires <= Date.now()) return null;

        return { standing: parseStanding(entry.raw), receivedAt: entry.receivedAt, expires: entry.expires };
    } catch {
        return null; // blocked storage or a corrupt entry — just read again
    }
};

export const writeCachedStanding = (sub: string, raw: unknown, receivedAt: number, expires: number): void => {
    try {
        if (Number.isFinite(expires)) {
            sessionStorage.setItem(cacheKey(sub), JSON.stringify({ raw, receivedAt, expires } satisfies CacheEntry));
        } else {
            // Good for this document only. Clearing matters: an EXHAUSTED
            // answer cached a minute ago would otherwise greet the next page
            // load of an account that has since paid.
            sessionStorage.removeItem(cacheKey(sub));
        }
    } catch { /* quota or private mode — proceed without persistence */ }
};

export const forgetCachedStanding = (sub: string): void => {
    try {
        sessionStorage.removeItem(cacheKey(sub));
    } catch { /* storage blocked — nothing was cached to forget */ }
};

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

/* Only ever hand the browser to Stripe. The URL comes from our own API, but it
   is the one place a response turns into a navigation, and
   `location.assign("javascript:…")` runs script — so anything that isn't
   Stripe over https is refused. A custom Stripe checkout domain, if one is
   ever set up, needs adding here. */
const isStripeUrl = (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"));
    } catch {
        return false;
    }
};

/**
 * Hands off to Stripe to add a payment method — for an exhausted trial and a
 * failed card alike. The API creates the checkout session and answers
 * `{ customer_id, url }`; this navigates to the url.
 *
 * Resolves once the navigation has started, with the page on its way out.
 * Rejects without navigating on anything else.
 */
export const startCheckout = async (sub: string): Promise<void> => {
    const resp = await fetch(`${API_BASE}/user/setup-payment`, {
        method: "POST",
        headers: await authHeaders(),
    });

    if (!resp.ok) throw new Error(`Failed to start checkout (${resp.status})`);

    const data: unknown = await resp.json();
    const url = isRecord(data) ? data.url : undefined;
    if (!isStripeUrl(url)) throw new Error("Checkout answered without a Stripe https URL");

    // The trip to Stripe and back happens in this tab, and sessionStorage
    // survives it. Without this, someone who has just paid would come back to
    // the cached EXHAUSTED answer for up to a minute.
    forgetCachedStanding(sub);
    window.location.assign(url);
};
