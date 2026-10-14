import type { SetupNote } from "./types";

/**
 * Roughly how long a new instance takes to become playable, in minutes:
 * building its infrastructure plus installing the game. Only for games that
 * take longer than the "few minutes" the FAQ promises — it's for the ones
 * where the wait would otherwise surprise someone.
 */
export const setupTime = (minutes: number): SetupNote => ({
    title: `Setup takes about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    body: "We install the game and build its server, and your dashboard will show you the moment it's ready.",
});
