import type { Game, GamePage } from '../types';
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

/**
 * Draft copy for /games/minecraft-better-mc-4.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftBetterMC4Page: GamePage = {
    slug: "minecraft-better-mc-4",
    draft: true,
    tagline: "Three hundred and fifty mods, all pointed at the horizon.",
    summary:
        "Host a Better Minecraft 4 server. An exploration pack whose real cost is chunk generation, sized so terrain bursts have somewhere to go.",

    intro: [
        "Better Minecraft 4 stacks a great many biome, structure and dungeon mods on top of Minecraft 1.21 and Forge — around 350 in total.",
        "That makes exploring the expensive part. Walking into new terrain produces heavy worldgen bursts, and the sizes here are picked so those bursts do not land on the tick.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "Solo or duo exploration.",
        "Small · 3-6 Players":
            "A small group. The extra cores absorb structure generation while you are out in new terrain.",
        "Medium · 6-12 Players":
            "An active group ranging across several biomes and dimensions.",
        "Large · 12-20 Players":
            "A large group with a lot of loaded terrain and structures.",
        "Community · 20+ Players":
            "A community server where many people are generating chunks at the same time.",
    },

    sizing: [
        "The dominant cost is chunk generation. Modern Forge threads that work, so extra cores genuinely help here — which is not true of the older packs on this site.",
        "There is less round-the-clock tech automation than a kitchen-sink pack, so memory ramps more gently. It is still a 350-mod pack: 6 GB of heap is the floor, and containers carry about 30% headroom over it.",
        "Eight vCPU appears only at the top, where many players generate terrain simultaneously. Fargate requires at least 16 GB alongside it.",
    ],
};

const MinecraftBetterMC4: Game = {
    name:     'Minecraft BetterMC 4',
    category: 'Minecraft',
    profiles: MinecraftBetterMC4Profiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftBetterMC4Page,
};

export default MinecraftBetterMC4;
