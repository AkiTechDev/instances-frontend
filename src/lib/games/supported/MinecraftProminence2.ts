import type { Game, GamePage } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftProminence2/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for Prominence II (RPG / Hasturian Era) — large questing/RPG pack
 * (~450 mods, MC 1.20.1 / Fabric).
 *
 * Sizing rationale — Fabric-efficient, quest/adventure driven:
 *  - Despite a high mod count, Prominence 2 runs on Fabric, which is meaningfully lighter on
 *    memory and CPU overhead than an equivalent Forge pack — so RAM tiers sit a step below a
 *    comparable Forge modpack, and 2 vCPU carries small groups fine.
 *  - Load is dominated by exploration/worldgen and quest content rather than 24/7 tech
 *    automation, so heap grows with world size and player spread more than idle load.
 *  - 6 GB heap floor; containers carry ~30% headroom over heap. 8 vCPU only for large
 *    communities generating terrain concurrently.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions
 *    (note: 8 vCPU requires >=16 GB).
 */
export const MinecraftProminence2Profiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 6 GB — solo / duo questing (Fabric keeps this comfortable).
    "Solo · 1-2 Players":     { cpu: 2048, memory: 6144 },

    // 2 vCPU · 8 GB — small group; Fabric efficiency stretches 2 vCPU further than Forge.
    "Small · 3-6 Players":    { cpu: 2048, memory: 8192 },

    // 4 vCPU · 10 GB — active group exploring and progressing quests together.
    "Medium · 6-12 Players":  { cpu: 4096, memory: 10240 },

    // 4 vCPU · 12 GB — large group across many loaded areas.
    "Large · 12-20 Players":  { cpu: 4096, memory: 12288 },

    // 8 vCPU · 16 GB — community server: concurrent worldgen across many players.
    "Community · 20+ Players": { cpu: 8192, memory: 16384 },
};

/**
 * Draft copy for /games/minecraft-prominence-2.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftProminence2Page: GamePage = {
    slug: "minecraft-prominence-2",
    draft: true,
    tagline: "Four hundred and fifty mods, and Fabric keeping them honest.",
    summary:
        "Host a Prominence II server. A large questing pack on Fabric, which runs a step lighter than the equivalent Forge pack — and is sized that way.",

    intro: [
        "Prominence II (Hasturian Era) is a big RPG and questing pack: roughly 450 mods on Minecraft 1.20.1.",
        "It runs on Fabric, which is meaningfully lighter on memory and processor overhead than an equivalent Forge pack. That is why its tiers sit a step below where the mod count alone would put them.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "Solo or duo questing. Fabric keeps this comfortable at a size Forge would not.",
        "Small · 3-6 Players":
            "A small group. Fabric's efficiency stretches two cores further than Forge would.",
        "Medium · 6-12 Players":
            "An active group exploring and working through quests together.",
        "Large · 12-20 Players":
            "A large group spread across many loaded areas.",
        "Community · 20+ Players":
            "A community server generating terrain across many players at once.",
    },

    sizing: [
        "Despite the mod count, Fabric's lower overhead means the memory tiers sit a step below a comparable Forge pack, and two vCPU carries small groups without complaint.",
        "The load is dominated by exploration and quest content rather than round-the-clock automation, so the heap grows with world size and how far players spread rather than with idle time.",
        "6 GB of heap is the floor, with roughly 30% container headroom over it. Eight vCPU appears only for large communities generating terrain concurrently.",
    ],
};

const MinecraftProminence2: Game = {
    name:     'Minecraft Prominence 2',
    category: 'Minecraft',
    profiles: MinecraftProminence2Profiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftProminence2Page,
};

export default MinecraftProminence2;
