/**
 * Caps how many calls run at once. Anything over the cap queues in arrival
 * order and starts as slots free up.
 *
 * Used to keep a dashboard full of instance cards from opening one request per
 * card the moment it mounts — the work still all happens, it just stops
 * arriving as a single burst.
 */
export function createLimiter(max: number) {
    let active = 0;
    const queue: (() => void)[] = [];

    const acquire = (): Promise<void> => {
        if (active < max) {
            active++;
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => queue.push(resolve));
    };

    const release = () => {
        // Hand the slot straight to the next waiter rather than decrementing
        // and re-acquiring — otherwise a caller arriving in between could jump
        // the queue and briefly push concurrency over the cap.
        const next = queue.shift();
        if (next) next();
        else active--;
    };

    return async function limit<T>(fn: () => Promise<T>): Promise<T> {
        await acquire();
        try {
            return await fn();
        } finally {
            release();
        }
    };
}
