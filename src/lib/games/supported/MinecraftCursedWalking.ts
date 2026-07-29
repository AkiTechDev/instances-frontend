import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftCursedWalking/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for The Cursed Walking — zombie-apocalypse / horror survival pack (MC Forge).
 *
 * Sizing rationale — entity-bound above all:
 *  - The defining load is entity simulation: constant zombie hordes and special-infected
 *    spawns mean very high entity counts, which is the biggest driver of TPS drops. Entity
 *    ticking is largely single-threaded, so raw single-thread CPU matters most and the pack
 *    reaches 4 vCPU early (Small tier) rather than scaling RAM first.
 *  - With more players spread out, more chunks stay loaded and more hordes tick concurrently,
 *    so CPU demand climbs faster with player count than for a tech/quest pack.
 *  - RAM is moderate for modded (6-12 GB heap band); containers carry ~30% headroom over heap.
 *  - 8 vCPU top tier for large servers with many simultaneous horde zones (requires >=16 GB).
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const MinecraftCursedWalkingProfiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 6 GB — solo / duo survival.
    "Solo · 1-2 Players":     { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — small group; cores go to horde entity ticking early.
    "Small · 3-5 Players":    { cpu: 4096, memory: 8192 },

    // 4 vCPU · 10 GB — active group, multiple horde zones loaded.
    "Medium · 6-10 Players":  { cpu: 4096, memory: 10240 },

    // 4 vCPU · 12 GB — large group, heavy concurrent entity load.
    "Large · 10-18 Players":  { cpu: 4096, memory: 12288 },

    // 8 vCPU · 16 GB — community server: many simultaneous horde zones ticking at once.
    "Community · 18+ Players": { cpu: 8192, memory: 16384 },
};

const MinecraftCursedWalking: Game = {
    name:     'Minecraft Cursed Walking',
    category: 'Minecraft',
    profiles: MinecraftCursedWalkingProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftCursedWalking;
