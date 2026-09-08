import type { ImageData } from "@responsive-image/core";
import type * as v from "valibot";

export interface InstanceProfile {
    cpu: number;
    memory: number;
}

/**
 * One configurable server setting, as presented on /games/<slug>.
 *
 * `key` must name a field in the game's valibot schema. The page reads the
 * constraint (lengths, ranges) off the schema itself rather than repeating it
 * here, so the published limits can't drift from the ones actually enforced —
 * and a dev-only check warns when the schema and this list disagree.
 */
export interface ConfigField {
    key: string;
    label: string;
    description: string;
}

export interface GameFaq {
    q: string;
    a: string;
}

/**
 * Marketing copy for a game's own page.
 *
 * Deliberately not generated. Ten pages spun out of one template with only the
 * numbers swapped is the doorway-page pattern search engines discount, and it
 * wouldn't help a reader either. A game gets a page when someone has written
 * this — `getStaticPaths` builds a route only for games that have it, so
 * adding the next game is a content change, not a code change.
 */
export interface GamePage {
    /** URL segment: /games/<slug>. */
    slug: string;
    /** One line under the title. */
    tagline: string;
    /**
     * Short status shown on the /games card — "Unreleased" and the like. This
     * is about the game's availability, not the copy's review state; a draft
     * page is still a game you can run today.
     */
    badge?: string;
    /** Meta description and hero lead — keep it under ~160 characters. */
    summary: string;
    /** Opening paragraphs: what running this game actually demands. */
    intro: string[];
    /** Keyed by profile id from `Game.profiles` — who each size suits. */
    tierNotes: { [profileId: string]: string };
    /** Why the sizes are what they are. */
    sizing: string[];
    /**
     * Settings the player can change, in reading order. Omit it and the page
     * lists the schema's own fields with humanised labels and no prose —
     * accurate, visibly less finished, and impossible to get wrong.
     */
    config?: ConfigField[];
    /** Omit while drafting; the section is dropped rather than padded. */
    faqs?: GameFaq[];
    /**
     * Copy still under review. Draft pages are `noindex` and say so on the
     * page: the sizes and limits are generated and correct, but the words
     * around them haven't been signed off, and thin near-duplicate pages are
     * exactly what search engines discount.
     */
    draft?: boolean;
}

export interface Game {
    name: string;
    category: string;
    profiles: { [id: string]: InstanceProfile };
    // Lazy loaders — nothing is imported until called
    getBanner: () => Promise<ImageData>;
    getSchema: () => Promise<v.ObjectSchema<any, undefined>>;
    /** Present once this game has a written page; absent means no route. */
    page?: GamePage;
}