import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftAllTheMods10/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for All the Mods 10 — a ~400+ mod "kitchen-sink" pack (MC 1.21 / NeoForge).
 *
 * ATM10 is one of the heaviest packs available; its own recommendation is 8-10 GB allocated.
 * Sizing rationale (server-side):
 *  - The dominant cost is world simulation, not players: many dimensions, dense worldgen, and
 *    chunk-loaded automation that ticks 24/7 whether or not anyone is online. RAM therefore
 *    scales with automation and world size at least as much as with player count.
 *  - With 400+ mods, metaspace (~1 GB) and off-heap buffers are large, so containers carry
 *    ~30% headroom above the JVM heap (heavier than vanilla). The 8 GB floor is the real
 *    minimum to boot and play comfortably — the generic modpack profiles' 4 GB solo tier
 *    cannot run this pack, which is why ATM10 gets its own list.
 *  - Chunk generation is threaded on NeoForge 1.21, so 4 vCPU is the practical floor and
 *    8 vCPU pays off once several players are exploring / generating chunks at once.
 *  - cpu is in Fargate units (1024 = 1 vCPU); memory is MiB. Every pair is a valid Fargate
 *    combination (see ProfileOptions in profiles.ts).
 */
export const MinecraftAllTheMods10Profiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 8 GB — minimum-spec solo world; expect hitches during heavy worldgen.
    "Solo · 1-2 Players":       { cpu: 2048, memory: 8192 },

    // 4 vCPU · 10 GB — recommended starting point for solo / a couple of friends.
    "Small · 2-4 Players":      { cpu: 4096, memory: 10240 },

    // 4 vCPU · 12 GB — active group with a few automation setups running.
    "Medium · 4-8 Players":     { cpu: 4096, memory: 12288 },

    // 4 vCPU · 16 GB — larger group, heavy automation and multiple loaded dimensions.
    "Large · 8-15 Players":     { cpu: 4096, memory: 16384 },

    // 8 vCPU · 20 GB — community server: many players exploring + sustained automation load.
    "Community · 15+ Players":  { cpu: 8192, memory: 20480 },
};

const MinecraftAllTheMods10: Game = {
    name:     'Minecraft ATM 10',
    category: 'Minecraft',
    profiles: MinecraftAllTheMods10Profiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema
};

export default MinecraftAllTheMods10;
