import type { Game, GamePage } from '../types';
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

/**
 * Draft copy for /games/minecraft-cursed-walking.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftCursedWalkingPage: GamePage = {
    slug: "minecraft-cursed-walking",
    draft: true,
    tagline: "The hordes are the workload.",
    summary:
        "Host a Cursed Walking server. A zombie-apocalypse pack that is entity-bound rather than memory-bound, so it reaches four vCPU earlier than most.",

    intro: [
        "The Cursed Walking is a horror survival pack built around constant zombie hordes and special-infected spawns.",
        "That makes entity count, not player count, the thing that decides how it runs. Entity ticking is largely single-threaded, so raw per-core speed matters more here than a large heap does.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "Solo or duo survival.",
        "Small · 3-5 Players":
            "A small group. Cores go to horde entity ticking early on this pack.",
        "Medium · 6-10 Players":
            "An active group with several horde zones loaded at once.",
        "Large · 10-18 Players":
            "A large group carrying heavy concurrent entity load.",
        "Community · 18+ Players":
            "A community server with many horde zones ticking simultaneously.",
    },

    sizing: [
        "Entity simulation is the defining load. Constant hordes mean very high entity counts, and that is the biggest cause of tick drops — bigger than anything to do with memory.",
        "Because entity ticking is largely single-threaded, raw single-thread speed matters most. This pack reaches four vCPU at the small tier rather than scaling memory first.",
        "More players spread out means more chunks loaded and more hordes ticking at once, so processor demand climbs faster with headcount here than on a tech or quest pack.",
        "Memory sits in a moderate 6–12 GB band for a modded pack, with about 30% container headroom over the heap.",
    ],
};

const MinecraftCursedWalking: Game = {
    name:     'Minecraft Cursed Walking',
    category: 'Minecraft',
    profiles: MinecraftCursedWalkingProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftCursedWalkingPage,
};

export default MinecraftCursedWalking;
