import type { Game, GamePage } from '../../types';
import type { InstanceProfile } from '../../types';

import banner from '../../../../assets/games/MinecraftJava/banner.png?format=avif;webp&responsive';

import { MinecraftJavaConfigurationSchema } from './schema';

/**
 * Compute profiles for vanilla / Paper / Spigot / Fabric (lightly-modded) Minecraft Java.
 *
 * Heavy modpacks (ATM, RLCraft, Prominence, etc.) have their own game entries that use
 * `HeavyModpackProfiles`, so this list intentionally targets the vanilla + plugin lane.
 *
 * Sizing rationale:
 *  - Minecraft Java's main tick loop is single-threaded, so single-thread CPU performance
 *    dominates. Extra vCPUs mainly help GC, chunk/worldgen, plugins and concurrent I/O
 *    rather than the tick itself — 2 vCPU is the sweet spot; 4 vCPU is for large plugin
 *    servers with high view distance and many concurrent players.
 *  - Container RAM carries ~25% headroom above the JVM heap (metaspace, off-heap, GC),
 *    so e.g. a 6 GB container comfortably runs a ~4.5 GB heap.
 *  - cpu is in Fargate units (1024 = 1 vCPU); memory is MiB. Every pair below is a valid
 *    Fargate combination (see ProfileOptions in profiles.ts).
 */
export const MinecraftJavaProfiles: { [id: string]: InstanceProfile } = {
    // 1 vCPU · 2 GB — solo or a couple of friends, near-vanilla, low view distance.
    "Solo · 1-2 Players":       { cpu: 1024, memory: 2048 },

    // 2 vCPU · 4 GB — small survival group, a handful of plugins.
    "Small · 3-6 Players":      { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — active friend group, moderate plugins / larger explored world.
    "Medium · 7-15 Players":    { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — busy public server, many plugins, higher view/simulation distance.
    "Large · 15-30 Players":    { cpu: 4096, memory: 8192 },

    // 4 vCPU · 12 GB — large community server with heavy plugin stacks (towny, economy, etc.).
    "Community · 30-60 Players": { cpu: 4096, memory: 12288 },

    // 4 vCPU · 16 GB — high-population Paper server / hub with big worlds and worldgen bursts.
    "High Population · 60+ Players": { cpu: 4096, memory: 16384 },
};

/**
 * Draft copy for /games/minecraft-java.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftJavaPage: GamePage = {
    slug: "minecraft-java",
    draft: true,
    tagline: "Vanilla, Paper, or a plugin stack — the lane most servers actually live in.",
    summary:
        "Host a Minecraft Java server sized around its single-threaded tick loop, from a two-player world to a sixty-plus community. Billed by the hour.",

    intro: [
        "This is the vanilla and plugin lane: Paper, Spigot, or Fabric with a light mod list. The heavy modpacks have their own pages, because they need their own floors.",
        "Minecraft Java's main tick loop runs on a single thread. That one fact shapes every tier here — memory buys you world and players, but cores mostly buy you everything happening around the tick rather than the tick itself.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "Near-vanilla, low view distance, one or two people. The smallest thing we run.",
        "Small · 3-6 Players":
            "A small survival group with a handful of plugins.",
        "Medium · 7-15 Players":
            "An active friend group, moderate plugins, a world explored a fair way out.",
        "Large · 15-30 Players":
            "A busy public server with many plugins and a higher view and simulation distance.",
        "Community · 30-60 Players":
            "A large community — towny, economy, the heavy plugin stacks.",
        "High Population · 60+ Players":
            "A high-population Paper server or hub, with big worlds and bursts of worldgen.",
    },

    sizing: [
        "The main tick loop is single-threaded, so single-thread speed dominates. Extra cores go to garbage collection, chunk generation, plugins and I/O rather than to the tick itself, which is why two vCPU is the sweet spot and four is reserved for large plugin servers.",
        "Container memory carries about 25% headroom above the JVM heap for metaspace, off-heap buffers and garbage collection. A 6 GB container comfortably runs a 4.5 GB heap.",
        "Heavy modpacks are deliberately not on this list. They have their own entries with their own floors, because a 2 GB tier cannot boot a 400-mod pack.",
    ],
};

const MinecraftJava: Game = {
    name:     'Minecraft Java',
    category: 'Minecraft',
    profiles: MinecraftJavaProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftJavaPage,
};


export default MinecraftJava;
