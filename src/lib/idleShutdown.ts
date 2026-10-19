import * as v from "valibot";

/**
 * Premium's idle shutdown: the watchdog stops a server nobody is playing on.
 * Whether it does, and after how many minutes, are instance settings, sent as
 * `idle_shutdown` and `idle_timeout_minutes` on POST /config/instance.
 *
 * The range is the CDK's (`MinIdleTimeoutMinutes`/`MaxIdleTimeoutMinutes` in
 * instances-cdk's infra/events.go) and the control plane's `IdleTimeout`. The
 * API refuses anything outside it with only its generic message, so this is
 * the one place a customer is told why.
 */
export const IDLE_TIMEOUT_DEFAULT_MINUTES = 20;
export const IDLE_TIMEOUT_MIN_MINUTES = 5;
export const IDLE_TIMEOUT_MAX_MINUTES = 240;

export const idleTimeoutMinutesSchema = v.pipe(
    v.number("Enter a number of minutes"),
    // The number input takes decimals; the API takes whole minutes.
    v.integer("Whole minutes only"),
    v.minValue(IDLE_TIMEOUT_MIN_MINUTES, `At least ${IDLE_TIMEOUT_MIN_MINUTES} minutes`),
    v.maxValue(IDLE_TIMEOUT_MAX_MINUTES, `At most ${IDLE_TIMEOUT_MAX_MINUTES} minutes`)
);
