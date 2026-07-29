import type { Game } from '../types';
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

const MinecraftBedrock: Game = {
    name:     'Minecraft Bedrock',
    category: 'Minecraft',
    profiles: MinecraftBedrockProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftBedrock;
