import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftBetterMC4/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for Better Minecraft 4 (BMC4) — large exploration/adventure pack
 * (~350 mods, modern MC 1.21 / Forge).
 *
 * Sizing rationale — worldgen/structure heavy:
 *  - BMC4's dominant cost is chunk generation: it stacks many biome, structure and dungeon
 *    mods, so exploring new terrain produces heavy worldgen bursts. Modern Forge threads chunk
 *    gen, so extra vCPUs genuinely help — 4 vCPU floor for groups, 8 vCPU for many players
 *    generating terrain at once.
 *  - Less 24/7 tech automation than ATM10, so RAM ramps a touch more gently, but it's still a
 *    350-mod pack: 6 GB heap floor, containers carry ~30% headroom over heap.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions
 *    (note: 8 vCPU requires >=16 GB).
 */
export const MinecraftBetterMC4Profiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 6 GB — solo / duo exploration.
    "Solo · 1-2 Players":      { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — small group; cores absorb structure-gen bursts while exploring.
    "Small · 3-6 Players":     { cpu: 4096, memory: 8192 },

    // 4 vCPU · 10 GB — active group across multiple biomes/dimensions.
    "Medium · 6-12 Players":   { cpu: 4096, memory: 10240 },

    // 4 vCPU · 14 GB — large group, lots of loaded terrain and structures.
    "Large · 12-20 Players":   { cpu: 4096, memory: 14336 },

    // 8 vCPU · 16 GB — community server: many players generating chunks simultaneously.
    "Community · 20+ Players":  { cpu: 8192, memory: 16384 },
};

const MinecraftBetterMC4: Game = {
    name:     'Minecraft BetterMC 4',
    category: 'Minecraft',
    profiles: MinecraftBetterMC4Profiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftBetterMC4;
