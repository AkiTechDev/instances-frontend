import { sleep } from "./utils";

/**
 * Resolves once the tab is visible. Already-visible tabs resolve immediately.
 */
const whenVisible = (): Promise<void> => {
    if (typeof document === "undefined" || !document.hidden) return Promise.resolve();

    return new Promise((resolve) => {
        const onChange = () => {
            if (document.hidden) return;
            document.removeEventListener("visibilitychange", onChange);
            resolve();
        };
        document.addEventListener("visibilitychange", onChange);
    });
};

/**
 * `sleep`, but it parks while the tab is hidden rather than letting a poll loop
 * keep firing at a screen nobody is looking at. A backgrounded dashboard used
 * to run its full multi-minute deadline against the API; now it stops at the
 * next wait and resumes when the tab comes back.
 */
export const sleepVisible = async (ms: number): Promise<void> => {
    await sleep(ms);
    await whenVisible();
};

export interface PollOptions {
    /** Gap between ticks. */
    intervalMs: number;
    /** Give up after this long, regardless of outcome. */
    timeoutMs: number;
    /**
     * Wait before the first tick. Use it where the backend lags the action —
     * polling instantly just echoes the pre-action state back.
     */
    initialDelayMs?: number;
}

/**
 * Run `tick` on an interval until it reports settled, or the deadline passes.
 * `tick` returns true when whatever it is watching has reached a final state.
 *
 * Callers are responsible for guarding against overlapping loops (see the
 * `running` flag in the instance hooks) — this primitive deliberately does not
 * own that, so a caller can key it however it needs to.
 */
export const pollUntilSettled = async (
    tick: () => Promise<boolean>,
    opts: PollOptions,
): Promise<void> => {
    if (opts.initialDelayMs) await sleepVisible(opts.initialDelayMs);

    const deadline = Date.now() + opts.timeoutMs;
    while (Date.now() < deadline) {
        if (await tick()) return;
        await sleepVisible(opts.intervalMs);
    }
};
