import type { Game, GamePage } from '../types';
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

/**
 * Draft copy for /games/minecraft-rlcraft.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftRLCraftPage: GamePage = {
    slug: "minecraft-rlcraft",
    draft: true,
    tagline: "Hardcore survival on 1.12.2, where extra cores stop helping early.",
    summary:
        "Host an RLCraft server. Single-threaded 1.12.2 Forge makes processor speed the ceiling rather than memory, so this pack stops at four vCPU on purpose.",

    intro: [
        "RLCraft is Shivaxi's hardcore survival pack: about 170 mods on Minecraft 1.12.2 and Forge.",
        "1.12.2 has no threaded chunk generation, so worldgen and the tick loop are effectively single-threaded. That caps what extra cores can do for you, and these tiers say so rather than selling you more of them.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "A solo hardcore run.",
        "Small · 3-5 Players":
            "A small survival group.",
        "Medium · 6-10 Players":
            "An active group. The extra cores absorb Lycanites entity spikes and worldgen.",
        "Large · 10+ Players":
            "A large group — about as far as 1.12.2 comfortably scales.",
    },

    sizing: [
        "There is no threaded chunk generation on 1.12.2 Forge, so single-thread speed is the bottleneck. Adding cores past four does very little for one world, which is why there is no eight vCPU tier here at all.",
        "The dominant load is entity ticking. Lycanites mobs and aggressive spawns mean huge entity counts, and that drives processor use and tick drops far more than memory pressure does.",
        "Memory needs are modest for a modded pack. 1.12.2 is lighter than modern packs, so containers stay in the 4–10 GB band with about 30% headroom over the heap.",
        "RLCraft servers are small by nature, so the player tiers top out lower than the modern packs. That is the game, not the hosting.",
    ],
};

const MinecraftRLCraft: Game = {
    name:     'Minecraft RLCraft',
    category: 'Minecraft',
    profiles: MinecraftRLCraftProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftRLCraftPage,
};

export default MinecraftRLCraft;
