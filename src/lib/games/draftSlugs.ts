/**
 * Game pages whose copy is still a draft.
 *
 * Kept in its own module with no imports because `astro.config.mjs` reads it to
 * filter the sitemap, and it cannot pull in the game modules themselves — those
 * import banners and SVGs that only resolve inside Vite's asset pipeline.
 *
 * This duplicates the `draft` flag on each game's `page`. That duplication is
 * checked rather than trusted: `pages/games/[slug].astro` compares the two on
 * every build and warns if they disagree, so a page can't end up `noindex` and
 * in the sitemap at the same time.
 */
export const draftSlugs: string[] = [
    "minecraft-java",
    "minecraft-all-the-mods-10",
    "minecraft-better-mc-4",
    "minecraft-cursed-walking",
    "minecraft-prominence-2",
    "minecraft-rlcraft",
    "minecraft-bedrock",
    "hytale",
    "project-zomboid",
];
