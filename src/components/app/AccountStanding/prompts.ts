import type { AccountStanding, StandingPrompt } from "../../../lib/account";

/* Copy lives here, decisions live on the server. The backend says *which*
   prompt and *when*; the words, tone and actions stay in the repo where they
   can be reviewed. Placeholder wording throughout — the pop-ups are a test
   surface until design lands. */

export interface PromptCopy {
    title: string,
    body: string,
    action: string,
}

/** "42m 05s", "1h 12m", "37s". */
export const formatDuration = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
    return `${sec}s`;
};

/**
 * A trial's length as it reads before a noun: "7-day", "24-hour", "30-minute".
 * Hours up to two days, so a 36-hour trial isn't rounded to "2-day"; days from
 * there. Whole units, to the nearest.
 */
export const formatTrialLength = (seconds: number): string => {
    // To the minute first, so a grant a second shy of an hour is an hour.
    const minutes = Math.max(1, Math.round(seconds / 60));

    if (minutes >= 2 * 24 * 60) return `${Math.round(minutes / (24 * 60))}-day`;
    if (minutes >= 60) return `${Math.round(minutes / 60)}-hour`;
    return `${minutes}-minute`;
};

const paymentCopy = (standing: AccountStanding, remaining: number | undefined): Omit<PromptCopy, "action"> => {
    // The status decides, never the numbers: an EXHAUSTED account still
    // reports time "remaining", because the tracker stopped counting.
    if (standing.status === "EXHAUSTED") {
        return {
            title: "Your free trial is used up",
            body: "Add a payment method to keep playing.",
        };
    }

    if (standing.status === "TRIALING" && standing.trial) {
        return {
            title: `You've used ${standing.trial.percent_used}% of your free hours`,
            body: remaining === undefined
                ? "Add a payment method so your servers aren't interrupted."
                : `${formatDuration(remaining)} of free time left. Add a payment method so your servers aren't interrupted.`,
        };
    }

    return {
        title: "Add a payment method",
        body: "Add a payment method to keep your servers running.",
    };
};

export const copyFor = (prompt: StandingPrompt, standing: AccountStanding, remaining: number | undefined): PromptCopy => {
    const copy = (() => {
        switch (prompt.kind) {
            case "payment":
                return { ...paymentCopy(standing, remaining), action: "Add payment method" };
            case "update_card":
                return {
                    title: "We couldn't process your payment",
                    body: "Update your card to keep your servers running.",
                    action: "Update card",
                };
            case "review":
                return {
                    title: "How are we doing?",
                    body: "Tell us what's working and what's broken — it takes about a minute.",
                    action: "Give feedback",
                };
        }
    })();

    // The escape hatch for urgent wording ahead of a release.
    return prompt.message ? { ...copy, body: prompt.message } : copy;
};

// ---------------------------------------------------------------------------
// Dismissal
// ---------------------------------------------------------------------------

/* Per browser, by design: namespaced by `sub` so a shared browser doesn't carry
   one account's dismissal to another, matching `dashboard:hasInstances:<sub>`.
   The value is the ISO time of the dismissal. */
const dismissedKey = (sub: string, id: string) => `standing:dismissed:${sub}:${id}`;

/* Backs up storage for this document, so Dismiss still works in a browser that
   refuses to store anything — the prompt just comes back on the next load. */
const dismissedThisLoad = new Set<string>();

export const isDismissed = (sub: string, prompt: StandingPrompt): boolean => {
    // First, and without touching storage: a leftover key must never be able
    // to hide a prompt the server says can't be hidden.
    if (!prompt.dismissible) return false;
    if (dismissedThisLoad.has(dismissedKey(sub, prompt.id))) return true;

    try {
        const at = Date.parse(localStorage.getItem(dismissedKey(sub, prompt.id)) ?? "");
        if (Number.isNaN(at)) return false;
        if (prompt.snooze_hours === undefined) return true;
        return Date.now() - at < prompt.snooze_hours * 3_600_000;
    } catch {
        return false;
    }
};

export const dismiss = (sub: string, prompt: StandingPrompt): void => {
    if (!prompt.dismissible) return;

    dismissedThisLoad.add(dismissedKey(sub, prompt.id));
    try {
        localStorage.setItem(dismissedKey(sub, prompt.id), new Date().toISOString());
    } catch { /* private mode or quota — dismissed until the next load */ }
};

// ---------------------------------------------------------------------------
// Modal: once per document load
// ---------------------------------------------------------------------------

/* Module state lives exactly as long as the document, which is the rule: an
   in-app navigation mustn't re-interrupt, and the next full load may. */
const modalsSeen = new Set<string>();

export const modalSeen = (id: string): boolean => modalsSeen.has(id);
export const markModalSeen = (id: string): void => { modalsSeen.add(id); };
