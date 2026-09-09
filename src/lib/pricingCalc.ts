/**
 * The arithmetic behind /pricing, kept out of the page so the estimator and the
 * server-rendered fallback can't disagree about what a month costs.
 *
 * Everything here is derived. Hourly rates come from `fgCalc` — the same
 * function the create-instance modal charges against — and sizes come from each
 * game's own `profiles`. Nothing on the pricing page is a number somebody typed.
 *
 * Two things this module deliberately does NOT do:
 *
 *   - It does not price storage. There is no storage rate anywhere in the
 *     codebase, and Terms §9 is explicit that storage charges continue after an
 *     Instance stops. So every figure here is compute only, and the page has to
 *     say so rather than quietly presenting a partial bill as the total.
 *
 *   - It does not price the "Premium" tier. `pricing.ts` charges Premium at a
 *     1.3x commission against Default's 1.2x, but nothing anywhere describes
 *     what Premium buys. Quoting a price for it would be selling something we
 *     can't define, so the page quotes Default and names the tier it quoted.
 */

import { fgCalc } from "./pricing";
import { regions } from "./regions";

/**
 * Currency symbol for every published price.
 *
 * Terms §9 still marks the billing currency "GBP or USD — to be confirmed".
 * This matches what /games and /games/<slug> already render so the site is at
 * least self-consistent, and it is one constant so the decision is one edit.
 */
export const CURRENCY = "$";

/** Region prices are quoted in, matching /games/<slug>. */
export const PRICE_REGION = "eu-west-2";
export const PRICE_REGION_NAME = regions[PRICE_REGION] ?? PRICE_REGION;

/**
 * Tier the published prices are calculated at.
 *
 * Worth knowing: `CreateInstanceModal` currently defaults new instances to
 * "Premium", which carries the higher commission — so an untouched create form
 * bills above the rate published here. That is a product decision to make, not
 * something to paper over in the pricing copy.
 */
export const PRICE_TIER = "Default";

/**
 * Weeks in an average month (52 / 12).
 *
 * Not 4. Using 4 would understate every estimate by about 8%, which is exactly
 * the direction an estimate must never be wrong in.
 */
export const WEEKS_PER_MONTH = 52 / 12;

export interface CalcProfile {
    id: string;
    cpu: number;
    memory: number;
}

export interface CalcGame {
    id: string;
    name: string;
    slug?: string;
    profiles: CalcProfile[];
}

/** Fargate CPU units are meaningless to a player; vCPU is at least a unit. */
export const vcpuOf = (profile: CalcProfile): number => profile.cpu / 1024;
export const memoryGbOf = (profile: CalcProfile): number => profile.memory / 1024;

/**
 * Profile ids read "Small · 3-6 Players". The half before the separator is the
 * label, the half after is the audience — worth splitting so the picker can
 * lead with the thing people actually match themselves against.
 */
export const splitProfileId = (id: string): { label: string; players: string } => {
    const [label, players] = id.split("·").map((part) => part.trim());
    return { label: label ?? id, players: players ?? "" };
};

/** Hourly rate for a profile, or null where we hold no table for the region. */
export const hourlyFor = (profile: CalcProfile, region: string): number | null => {
    const rate = fgCalc(region, profile.memory, profile.cpu, PRICE_TIER);
    return rate === null ? null : parseFloat(rate);
};

/** What a month costs at a given weekly play rate. Compute only. */
export const monthlyFor = (hourly: number, hoursPerWeek: number): number =>
    hourly * hoursPerWeek * WEEKS_PER_MONTH;

/**
 * Play-rate presets, in the words someone would use themselves.
 *
 * Hours are per week and deliberately conservative — an estimate that comes in
 * under the real bill is the one that loses trust.
 */
export const playPresets: { id: string; label: string; detail: string; hours: number }[] = [
    { id: "occasional", label: "Now and then", detail: "A session at the weekend", hours: 4 },
    { id: "regular",    label: "A couple of evenings", detail: "The usual case", hours: 8 },
    { id: "most",       label: "Most evenings", detail: "Four or five nights a week", hours: 16 },
    { id: "daily",      label: "Every day", detail: "A few hours, most days", hours: 28 },
];

/** Bounds of the fine-adjustment slider, in hours per week. */
export const HOURS_MIN = 1;
export const HOURS_MAX = 40;

/**
 * A full month of never stopping the server, in hours. Deliberately absent from
 * the presets — it isn't a play habit, it's the answer to "what if I forget",
 * so it belongs in the comparison table rather than as something to aim at.
 */
export const HOURS_ALWAYS = 168;

/** Columns for the at-a-glance table, so the shape of the cost is visible. */
export const comparisonHours = [4, 8, 16, 28, HOURS_ALWAYS];

export const formatMoney = (value: number): string =>
    `${CURRENCY}${value.toFixed(2)}`;

export const formatHours = (hours: number): string =>
    hours === 168 ? "every hour of the month" : `${hours} hours a week`;
