import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftRLCraft/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for RLCraft — Shivaxi's hardcore survival pack (~170 mods, MC 1.12.2 / Forge).
 *
 * Sizing rationale — RLCraft is CPU-bound, not RAM-hungry:
 *  - It runs on 1.12.2 Forge, which has NO threaded chunk generation, so worldgen and the
 *    tick loop are effectively single-threaded. Single-thread CPU is the bottleneck; adding
 *    vCPUs past 4 does little for one world, so this pack caps at 4 vCPU (no 8 vCPU tier).
 *  - The dominant load is entity ticking: Lycanites mobs + aggressive spawns mean huge entity
 *    counts, which drives CPU (and TPS drops) far more than heap pressure.
 *  - RAM needs are modest for modded (4-8 GB heap); 1.12.2 is memory-light vs modern packs, so
 *    containers stay in the 4-10 GB band with ~30% headroom over heap.
 *  - RLCraft servers are small by nature (hardcore survival groups); 1.12.2 doesn't scale to
 *    large populations, so player tiers top out lower than modern packs.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const MinecraftRLCraftProfiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 4 GB — solo hardcore run.
    "Solo · 1-2 Players":    { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — small survival group.
    "Small · 3-5 Players":   { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — active group; extra cores absorb Lycanites entity + worldgen spikes.
    "Medium · 6-10 Players": { cpu: 4096, memory: 8192 },

    // 4 vCPU · 10 GB — large group (about as far as 1.12.2 comfortably scales).
    "Large · 10+ Players":   { cpu: 4096, memory: 10240 },
};

const MinecraftRLCraft: Game = {
    name:     'Minecraft RLCraft',
    category: 'Minecraft',
    profiles: MinecraftRLCraftProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftRLCraft;
