import type { Game, GamePage } from '../types';
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

/**
 * Draft copy for /games/minecraft-all-the-mods-10.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftAllTheMods10Page: GamePage = {
    slug: "minecraft-all-the-mods-10",
    draft: true,
    tagline: "Four hundred mods, and a floor to match.",
    summary:
        "Host an All the Mods 10 server. A kitchen-sink pack whose own guidance asks for 8–10 GB, sized for automation that ticks whether or not you are online.",

    intro: [
        "All the Mods 10 is one of the heaviest packs going: roughly 400 mods on Minecraft 1.21 and NeoForge. Its own recommendation is 8 to 10 GB allocated.",
        "The generic modpack sizes do not apply here, which is exactly why this pack has its own list. A 4 GB tier cannot boot it at all.",
    ],

    tierNotes: {
        "Solo · 1-2 Players":
            "Minimum spec for a solo world. Expect hitches while heavy worldgen runs.",
        "Small · 2-4 Players":
            "The recommended starting point for one player or a couple of friends.",
        "Medium · 4-8 Players":
            "An active group with a few automation setups running.",
        "Large · 8-15 Players":
            "A larger group with heavy automation and several dimensions loaded.",
        "Community · 15+ Players":
            "A community server: many players exploring while the automation keeps ticking.",
    },

    sizing: [
        "The dominant cost is world simulation, not players. Many dimensions, dense worldgen and chunk-loaded automation tick around the clock whether or not anyone is online, so memory scales with what you have built at least as much as with who is on.",
        "With 400+ mods, metaspace alone runs to about a gigabyte and off-heap buffers are large, so containers carry roughly 30% headroom over the JVM heap — heavier than vanilla needs.",
        "Chunk generation is threaded on NeoForge 1.21, so four vCPU is the practical floor and eight genuinely pays off once several people are generating terrain at once.",
    ],
};

const MinecraftAllTheMods10: Game = {
    name:     'Minecraft ATM 10',
    category: 'Minecraft',
    profiles: MinecraftAllTheMods10Profiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftAllTheMods10Page,
};

export default MinecraftAllTheMods10;
