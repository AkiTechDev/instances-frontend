import type { Game } from '../../types';
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

const MinecraftJava: Game = {
    name:     'Minecraft Java',
    category: 'Minecraft',
    profiles: MinecraftJavaProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};


export default MinecraftJava;
