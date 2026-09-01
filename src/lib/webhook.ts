import * as v from "valibot";

/**
 * Optional outbound webhook target sent as `webhook_url` on instance create /
 * config update. An empty string means "no webhook" — the field is surfaced
 * behind the advanced-settings disclosure, so most users never fill it in.
 */
export const webhookUrlSchema = v.pipe(
    v.string(),
    v.maxLength(2048),
    v.check(
        (value) => value === "" || /^https?:\/\/\S+$/.test(value),
        "Enter a full http(s):// URL, or leave blank"
    )
);

export const webhookUrlPlaceholder = "https://example.com/hooks/instance";
