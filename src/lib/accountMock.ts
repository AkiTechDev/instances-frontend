import { sleep } from "./utils";

/**
 * Fixtures for `PUBLIC_STANDING_MOCK=<scenario>`, which answers account
 * standing from here instead of `/user/standing`.
 *
 * Worth keeping after the real endpoint exists: it is the only practical way to
 * see a SUSPENDED account without failing a real payment, or an 80% banner
 * without burning 48 minutes of trial. Only built into the bundle when the
 * variable is set; leave it unset in production.
 */

const HOUR = 3600;

const trial = (used: number, granted = HOUR) => ({
    granted_seconds: granted,
    used_seconds: used,
    remaining_seconds: Math.max(0, granted - used),
    percent_used: Math.floor((used / granted) * 100),
});

const SCENARIOS: Record<string, () => Record<string, unknown>> = {
    "trial-80": () => ({
        status: "TRIALING", blocked: false, entered_via: "trial",
        trial: trial(2880),
        prompts: [{ id: "trial-80-2026q4", kind: "payment", surface: "banner", priority: 20, dismissible: true, snooze_hours: 48 }],
        ttl_seconds: 300,
    }),
    "trial-95": () => ({
        status: "TRIALING", blocked: false, entered_via: "trial",
        trial: trial(3420),
        prompts: [{ id: "trial-95-2026q4", kind: "payment", surface: "banner", priority: 40, dismissible: true, snooze_hours: 12 }],
        ttl_seconds: 300,
    }),
    // The live test account, verbatim: EXHAUSTED at 97% with 100s "remaining",
    // because the tracker stopped counting when the status left TRIALING.
    exhausted: () => ({
        status: "EXHAUSTED", reason: "trial_exhausted", blocked: true, entered_via: "trial",
        trial: trial(3500),
        prompts: [{ id: "trial-exhausted-2026q4", kind: "payment", surface: "modal", priority: 100, dismissible: false }],
        ttl_seconds: 60,
    }),
    suspended: () => ({
        status: "SUSPENDED", reason: "payment_failed", blocked: true, entered_via: "card",
        prompts: [{ id: "payment-failed-2026q4", kind: "update_card", surface: "modal", priority: 100, dismissible: false }],
        ttl_seconds: 60,
    }),
    active: () => ({
        status: "ACTIVE", blocked: false, entered_via: "card",
        prompts: [],
    }),
    review: () => ({
        status: "ACTIVE", blocked: false, entered_via: "card",
        prompts: [{ id: "review-2026q4", kind: "review", surface: "modal", priority: 10, dismissible: true, snooze_hours: 2160 }],
    }),
    // A status this build has never heard of, carrying a payment demand. Must
    // render nothing at all: an unknown status fails open.
    unknown: () => ({
        status: "SOMETHING_NEW", blocked: true,
        prompts: [{ id: "mystery-2026q4", kind: "payment", surface: "modal", priority: 100, dismissible: false }],
    }),
};

export const mockStanding = async (scenario: string): Promise<unknown> => {
    if (!Object.hasOwn(SCENARIOS, scenario)) {
        throw new Error(
            `PUBLIC_STANDING_MOCK="${scenario}" isn't a scenario — expected one of: ${Object.keys(SCENARIOS).join(", ")}`,
        );
    }

    // Long enough to see that the app paints without waiting for it.
    await sleep(400);
    return { ...SCENARIOS[scenario](), as_of: new Date().toISOString() };
};
