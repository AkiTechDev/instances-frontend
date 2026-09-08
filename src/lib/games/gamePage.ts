/**
 * Build-time helpers for /games/<slug>.
 *
 * The point of all of this is that the page never restates a number that lives
 * somewhere else. Sizes come from `Game.profiles`, prices from the same
 * `fgCalc` the create-instance modal uses, and field limits are read off the
 * game's own valibot schema. The copy in `Game.page` supplies the words and
 * nothing else, so it can't quietly go stale.
 */

import type { ConfigField, Game, InstanceProfile } from "./types";
import { fgCalc } from "../pricing";
import { regions } from "../regions";

/**
 * Region the published prices are quoted in.
 *
 * A single named region rather than a range: "from $0.14" invites the reader to
 * assume that's what they'll pay, and Fargate rates vary by roughly 25% across
 * regions. Naming it lets the number be checkable.
 */
export const PRICE_REGION = "eu-west-2";
export const PRICE_REGION_NAME = regions[PRICE_REGION] ?? PRICE_REGION;

/** The tier `fgCalc` prices against; "Premium" carries a higher commission. */
const PRICE_TIER = "Default";

export interface TierView {
    id: string;
    /** Fargate CPU units are meaningless to a player; vCPU isn't. */
    vcpu: number;
    memoryGb: number;
    /** null when we hold no price table for the region — render "—", not "0.00". */
    hourly: string | null;
    note: string | undefined;
}

export const tierViews = (game: Game): TierView[] =>
    Object.entries(game.profiles).map(([id, profile]: [string, InstanceProfile]) => ({
        id,
        vcpu: profile.cpu / 1024,
        memoryGb: profile.memory / 1024,
        hourly: fgCalc(PRICE_REGION, profile.memory, profile.cpu, PRICE_TIER),
        note: game.page?.tierNotes[id],
    }));

/**
 * Lowest hourly price across a game's tiers, or null if none could be priced.
 *
 * Compared numerically rather than as strings: "0.07" and "0.30" happen to
 * sort correctly as text, but "0.9" and "0.10" would not, and the tiers are
 * generated so that pairing will eventually happen.
 */
export const cheapestHourly = (game: Game): string | null => {
    const priced = tierViews(game)
        .map((tier) => tier.hourly)
        .filter((hourly): hourly is string => hourly !== null);
    if (!priced.length) return null;
    return priced.reduce((low, next) => (parseFloat(next) < parseFloat(low) ? next : low));
};

/** vCPU and memory span across a game's tiers, for the index card. */
export const specSpan = (game: Game): { vcpu: [number, number]; memoryGb: [number, number] } => {
    const tiers = tierViews(game);
    const vcpus = tiers.map((t) => t.vcpu);
    const mems = tiers.map((t) => t.memoryGb);
    return {
        vcpu: [Math.min(...vcpus), Math.max(...vcpus)],
        memoryGb: [Math.min(...mems), Math.max(...mems)],
    };
};

/**
 * A one-line, human reading of what a schema field accepts.
 *
 * Valibot keeps its validations in `.pipe`, each with a `type` and a
 * `requirement`, so the published limit is always the enforced one. Anything
 * we don't recognise returns "", and the page simply shows no constraint
 * rather than inventing a wrong one.
 */
export const describeConstraint = (entry: unknown): string => {
    const schema = entry as { type?: string; pipe?: { type: string; requirement?: unknown }[] };
    const rules = new Map<string, unknown>();
    for (const step of schema?.pipe ?? []) rules.set(step.type, step.requirement);

    const min = rules.get("min_length") ?? rules.get("min_value");
    const max = rules.get("max_length") ?? rules.get("max_value");

    if (schema?.type === "picklist") {
        const options = (entry as { options?: unknown[] }).options ?? [];
        return options.join(" or ");
    }
    if (schema?.type === "boolean") return "On or off";
    if (schema?.type === "string") {
        if (min !== undefined && max !== undefined) return `${min}–${max} characters`;
        if (max !== undefined) return `Up to ${max} characters`;
        if (min !== undefined) return `At least ${min} characters`;
        return "Text";
    }
    if (schema?.type === "number") {
        if (min !== undefined && max !== undefined) return `${min}–${max}`;
        return "Number";
    }
    return "";
};

/**
 * SERVER_NAME -> "Server name". Only used for games whose page has no written
 * config list yet, so a draft still shows real settings rather than nothing.
 */
export const humaniseKey = (key: string): string => {
    const words = key.toLowerCase().split("_");
    return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
};

export interface ConfigRow {
    label: string;
    description: string;
    constraint: string;
}

/**
 * The rows for the settings table: the written list where one exists, and the
 * schema's own fields where it doesn't. Either way the constraint comes from
 * the schema, so a draft page is never wrong — only less explained.
 */
export const configRows = (game: Game, entries: Record<string, unknown>): ConfigRow[] => {
    const written = game.page?.config;
    if (written?.length) {
        return written.map((field) => ({
            label: field.label,
            description: field.description,
            constraint: describeConstraint(entries[field.key]),
        }));
    }
    return Object.keys(entries).map((key) => ({
        label: humaniseKey(key),
        description: "",
        constraint: describeConstraint(entries[key]),
    }));
};

/**
 * Warn when the written config list and the schema have drifted apart.
 *
 * Dev only, and it runs at build time. A field in the schema with no entry
 * here is a setting we've quietly stopped documenting; an entry naming a field
 * the schema no longer has is a setting we're advertising and won't accept.
 */
export const warnOnConfigDrift = (
    gameId: string,
    schemaKeys: string[],
    config: ConfigField[] | undefined,
): void => {
    // A page with no written list is deliberately falling back to the schema,
    // which cannot drift from itself.
    if (!config?.length) return;

    const documented = new Set(config.map((field) => field.key));
    const undocumented = schemaKeys.filter((key) => !documented.has(key));
    const missingFromSchema = config.map((f) => f.key).filter((key) => !schemaKeys.includes(key));

    if (undocumented.length || missingFromSchema.length) {
        console.warn(
            `[games/${gameId}] config list is out of step with the schema.`,
            { undocumented, missingFromSchema },
        );
    }
};

/** Same idea for the tier notes, which are keyed by profile id. */
export const warnOnTierDrift = (gameId: string, game: Game): void => {
    const profileIds = Object.keys(game.profiles);
    const noted = Object.keys(game.page?.tierNotes ?? {});
    const unnoted = profileIds.filter((id) => !noted.includes(id));
    const orphaned = noted.filter((id) => !profileIds.includes(id));

    if (unnoted.length || orphaned.length) {
        console.warn(`[games/${gameId}] tier notes don't match the profiles.`, { unnoted, orphaned });
    }
};

/**
 * "Three sizes, and why" reads better than "3 sizes", and a sentence should not
 * open with a numeral. Covers one to twelve, which spans both uses: a game's
 * tier count (three to six) and the size of the catalogue. Past twelve the
 * numeral is the conventional choice anyway, so the fallback is correct rather
 * than merely safe.
 */
const NUMBER_WORDS: Record<number, string> = {
    1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six",
    7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve",
};

export const numberWord = (n: number): string => NUMBER_WORDS[n] ?? String(n);
