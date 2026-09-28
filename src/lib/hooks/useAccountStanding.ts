import { createEffect, createMemo, createSignal, on, onCleanup, onMount, type Accessor } from "solid-js";

import { onPaymentRequired } from "../apis";
import {
    fetchStanding,
    parseStanding,
    readCachedStanding,
    writeCachedStanding,
    type AccountStanding,
    type AccountStatus,
    type StandingSnapshot,
} from "../account";
import { pollUntilSettled } from "../polling";

/**
 * How long an answer may be reused when the server doesn't say. `null` means
 * for the rest of this document load: an ACTIVE account is only ever moved by
 * a payment webhook, and the one move that matters (to SUSPENDED) is reported
 * by the gate's 402 the moment they try to start something. Re-reading on a
 * timer would pay for news the 402 delivers sooner.
 */
const FALLBACK_TTL_SECONDS: Record<AccountStatus, number | null> = {
    TRIALING: 300,  // credit is burning
    EXHAUSTED: 60,  // they are trying to fix it; catch the recovery fast
    SUSPENDED: 60,
    ACTIVE: null,
    UNKNOWN: null,
};

/** Floor between re-reads triggered by the trial countdown reaching zero. */
const ZERO_RECHECK_MS = 60_000;

const expiryFor = (standing: AccountStanding, receivedAt: number): number => {
    const ttl = standing.ttl_seconds ?? FALLBACK_TTL_SECONDS[standing.status];
    return ttl === null ? Infinity : receivedAt + ttl * 1000;
};

// ---------------------------------------------------------------------------
// Reach-in points for the rest of the app
// ---------------------------------------------------------------------------

/* How many mounted views are showing a running server. Module-level because
   the views that know (dashboard cards, the management page) and the store
   that needs to know live in different subtrees. Nothing reports from /explore
   or /extra, so the countdown holds still there rather than guessing. */
const [runningViews, setRunningViews] = createSignal(0);

/** Lets the trial countdown tick while this view's server is running. */
export function useReportRunning(isRunning: Accessor<boolean>): void {
    let counted = false;
    const report = (running: boolean) => {
        if (running === counted) return;
        counted = running;
        setRunningViews((n) => n + (running ? 1 : -1));
    };
    createEffect(() => report(isRunning()));
    onCleanup(() => report(false));
}

let requestRefresh: ((force: boolean) => void) | null = null;

/**
 * Ask the store to re-read. Soft by default: it only goes to the network once
 * the cached answer has expired. `force` is for when something authoritative
 * has happened. A no-op outside the app shell.
 */
export const refreshStanding = (opts?: { force?: boolean }): void => requestRefresh?.(opts?.force ?? false);

/** True if any prompt is about money — the ones a finished checkout resolves. */
const wantsPayment = (standing: AccountStanding | undefined) =>
    !!standing?.prompts.some((p) => p.kind === "payment" || p.kind === "update_card");

/**
 * Read `?billing=done` and take it off the URL, before the router is built so
 * it never sees it. Stripe returns the browser there; a reload afterwards must
 * not replay the "confirming" state.
 */
const consumeCheckoutReturn = (): boolean => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("billing") !== "done") return false;

    url.searchParams.delete("billing");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    return true;
};

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

export interface AccountStandingStore {
    /** Undefined until the first answer, and after a failed first read — which
     *  shows nothing rather than guessing. */
    standing: Accessor<AccountStanding | undefined>,
    /** Free seconds left, ticking down locally while a server runs. Undefined
     *  unless TRIALING with a trial block; see `AccountStanding.trial`. */
    trialRemaining: Accessor<number | undefined>,
    /** True while a return from checkout waits for the payment webhook. */
    confirmingPayment: Accessor<boolean>,
    refresh: (opts?: { force?: boolean }) => Promise<void>,
}

/**
 * The account's standing, kept fresh by events rather than a timer.
 *
 * Re-reads on: first render (soft), tab focus (soft), instance create / delete
 * / stop (soft, via `refreshStanding`), any 402 (forced), the dashboard's
 * refresh button (forced), a return from checkout (forced), and the trial
 * countdown reaching zero (forced). Steady state is one read per document load.
 *
 * Never gates first paint: this is chrome, and the page renders on its own
 * schedule while it loads.
 */
export function useAccountStanding(sub: Accessor<string>): AccountStandingStore {
    // Before anything else, so the URL is clean by the time the router reads it.
    const returnedFromCheckout = consumeCheckoutReturn();

    // Memoised so a silent token renew — a new account object, same subject —
    // doesn't count as a different account.
    const subject = createMemo(sub);

    const [snapshot, setSnapshot] = createSignal<StandingSnapshot | null>(readCachedStanding(subject()));
    const [confirmingPayment, setConfirmingPayment] = createSignal(returnedFromCheckout);

    let inFlight: Promise<void> | null = null;

    const load = async (): Promise<void> => {
        const forSubject = subject();
        try {
            const raw = await fetchStanding();
            const receivedAt = Date.now();
            const standing = parseStanding(raw);
            const expires = expiryFor(standing, receivedAt);

            writeCachedStanding(forSubject, raw, receivedAt, expires);
            if (subject() === forSubject) setSnapshot({ standing, receivedAt, expires });
        } catch (err) {
            // Fail open: keep what we last knew, or nothing, rather than
            // inventing a state. The next trigger tries again.
            console.error("account standing: read failed", err);
        }
    };

    /* Single-flight. A forced call during a read shares it rather than
       queueing another: that read left after whatever prompted the force. */
    const refresh = (opts?: { force?: boolean }): Promise<void> => {
        if (inFlight) return inFlight;

        const current = snapshot();
        if (!opts?.force && current && current.expires > Date.now()) return Promise.resolve();

        inFlight = load().finally(() => { inFlight = null; });
        return inFlight;
    };

    // A different account in this tab: drop the old one's answer first.
    createEffect(on(subject, (s) => {
        setSnapshot(readCachedStanding(s));
        void refresh();
    }, { defer: true }));

    onMount(() => {
        void refresh();

        const onVisible = () => { if (!document.hidden) void refresh(); };
        document.addEventListener("visibilitychange", onVisible);

        const stopListening = onPaymentRequired(() => void refresh({ force: true }));

        const request = (force: boolean) => void refresh({ force });
        requestRefresh = request;

        onCleanup(() => {
            document.removeEventListener("visibilitychange", onVisible);
            stopListening();
            if (requestRefresh === request) requestRefresh = null;
        });

        if (returnedFromCheckout) {
            // Stripe sends the browser back before its webhook has necessarily
            // landed, so the first read can still ask for a card. Hold the
            // optimistic state and re-read on a tight deadline, then fall back
            // to whatever the server says.
            void pollUntilSettled(async () => {
                await refresh({ force: true });
                return !wantsPayment(snapshot()?.standing);
            }, { intervalMs: 3000, timeoutMs: 15_000, initialDelayMs: 2000 })
                .finally(() => setConfirmingPayment(false));
        }
    });

    /* The trial ticks down locally while a server runs: a live "time left" for
       zero requests, and the server is asked again only when it hits zero.

       Counted on this browser's clock from when the answer arrived — never by
       comparing `as_of` to this clock, which would carry any skew between the
       two into the figure. Time accrues only while a view reports a running
       server, so a stopped account's figure holds still. */
    const trialing = createMemo(() => {
        const s = snapshot()?.standing;
        return s?.status === "TRIALING" ? s.trial : undefined;
    });

    const running = () => runningViews() > 0;
    const [clock, setClock] = createSignal<{ bankedMs: number, since: number | null }>({ bankedMs: 0, since: null });
    const [now, setNow] = createSignal(Date.now());

    // A fresh answer already counts everything up to now.
    createEffect(on(snapshot, () => {
        setClock({ bankedMs: 0, since: running() ? Date.now() : null });
    }));

    createEffect(on(running, (isRunning) => {
        const t = Date.now();
        setClock((c) => {
            if (isRunning) return c.since === null ? { ...c, since: t } : c;
            return c.since === null ? c : { bankedMs: c.bankedMs + (t - c.since), since: null };
        });
    }, { defer: true }));

    createEffect(() => {
        if (!trialing() || clock().since === null) return;
        const tick = setInterval(() => setNow(Date.now()), 1000);
        onCleanup(() => clearInterval(tick));
    });

    const trialRemaining = createMemo(() => {
        const trial = trialing();
        if (!trial) return undefined;

        const { bankedMs, since } = clock();
        const elapsedMs = bankedMs + (since === null ? 0 : Math.max(0, now() - since));
        return Math.max(0, trial.remaining_seconds - Math.floor(elapsedMs / 1000));
    });

    /* Confirm with the server when the local figure reaches zero — on the way
       down only, never for an answer that arrives already at zero, and at most
       once a minute. A server whose usage figure lags play would otherwise
       hand back the same few seconds every time, and this would become a poll
       exactly as fast as those seconds. A fresh answer cancels a pending check.
       Not deferred: `on` only records `before` from runs it actually made. */
    let lastZeroCheck = -Infinity;
    createEffect(on(trialRemaining, (left, before) => {
        if (left !== 0 || before === undefined || before === 0) return;

        const check = () => {
            lastZeroCheck = Date.now();
            void refresh({ force: true });
        };
        const wait = lastZeroCheck + ZERO_RECHECK_MS - Date.now();
        if (wait <= 0) return check();

        const timer = setTimeout(check, wait);
        onCleanup(() => clearTimeout(timer));
    }));

    return {
        standing: () => snapshot()?.standing,
        trialRemaining,
        confirmingPayment,
        refresh,
    };
}
