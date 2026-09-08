import type { Game, GamePage } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/MinecraftBedrock/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

/**
 * Compute profiles for Minecraft Bedrock Dedicated Server (BDS).
 *
 * Sizing rationale — much lighter than Java:
 *  - BDS is native C++ (no JVM heap/metaspace/GC overhead), so it runs far leaner than a Java
 *    server and squeezes more players out of the same resources. RAM floor is the lowest of any
 *    supported game — a small realm-style server is happy on 1 vCPU / 2 GB.
 *  - Bedrock handles concurrency better than Java's single-threaded tick, so player tiers reach
 *    higher counts at each CPU/RAM step; 4 vCPU comfortably serves a large public server.
 *  - RAM scales with loaded chunks (view distance × players) more than raw player count.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const MinecraftBedrockProfiles: { [id: string]: InstanceProfile } = {
    // 1 vCPU · 2 GB — realm-style server for a small friend group.
    "Solo · 1-4 Players":     { cpu: 1024, memory: 2048 },

    // 2 vCPU · 4 GB — small community, a few behavior/resource packs.
    "Small · 5-10 Players":   { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — active server, higher view distance.
    "Medium · 10-20 Players": { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — large public server with many concurrent players.
    "Large · 20-40 Players":  { cpu: 4096, memory: 8192 },
};

/**
 * Draft copy for /games/minecraft-bedrock.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const MinecraftBedrockPage: GamePage = {
    slug: "minecraft-bedrock",
    draft: true,
    tagline: "Native C++, no JVM, and the lowest floor we offer.",
    summary:
        "Host a Minecraft Bedrock server. Native code runs leaner than Java, so a realm-style server for friends is happy on one vCPU and 2 GB. Billed by the hour.",

    intro: [
        "Bedrock Dedicated Server is native C++. There is no JVM heap, no metaspace and no garbage collector to leave headroom for, so it does more with less than the Java server does.",
        "It also handles concurrency better than Java's single-threaded tick, which is why every step up this list reaches a higher player count than the equivalent Java tier.",
    ],

    tierNotes: {
        "Solo · 1-4 Players":
            "A realm-style server for a small group of friends. The lowest floor of any game we host.",
        "Small · 5-10 Players":
            "A small community running a few behaviour and resource packs.",
        "Medium · 10-20 Players":
            "An active server with the view distance turned up.",
        "Large · 20-40 Players":
            "A large public server with a lot of people on at once.",
    },

    sizing: [
        "No JVM overhead means the memory floor is the lowest of any game we support. One vCPU and 2 GB genuinely works for a handful of friends, which is not true anywhere else on the platform.",
        "Bedrock handles concurrency better than Java, so player counts climb faster at each step. Four vCPU comfortably serves a large public server.",
        "Memory tracks loaded chunks — view distance multiplied by players — more than raw headcount. Turning the view distance up costs you more than inviting more people.",
    ],
};

const MinecraftBedrock: Game = {
    name:     'Minecraft Bedrock',
    category: 'Minecraft',
    profiles: MinecraftBedrockProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
    page: MinecraftBedrockPage,
};

export default MinecraftBedrock;
