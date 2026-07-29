import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/ProjectZomboid/banner.png?format=avif;webp&responsive';

import * as v from "valibot";

/**
 * Compute profiles for the Project Zomboid dedicated server (Java).
 *
 * Sizing rationale — RAM scales with player spread, CPU with zombies:
 *  - PZ streams the map in cells around each player. Because the map is huge and players spread
 *    out, RAM demand tracks how many separate areas are loaded far more than the raw headcount —
 *    a handful of scattered players can load a lot of world. This is the primary RAM driver.
 *  - CPU is dominated by zombie simulation: the server ticks thousands of zombies (pathing,
 *    hordes, migration). Populated servers with high zombie counts are CPU-bound, so cores ramp
 *    with player count and reach 8 vCPU for large communities.
 *  - JVM-based, so containers carry ~25% headroom over heap; default heap is ~3 GB and climbs
 *    with players and mods.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions
 *    (note: 8 vCPU requires >=16 GB).
 */
export const ProjectZomboidProfiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 4 GB — solo / duo survival.
    "Solo · 1-2 Players":     { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — small group; more scattered players = more loaded cells.
    "Small · 3-8 Players":    { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — active server; cores absorb rising zombie simulation load.
    "Medium · 8-16 Players":  { cpu: 4096, memory: 8192 },

    // 4 vCPU · 12 GB — large server, players spread wide across the map.
    "Large · 16-32 Players":  { cpu: 4096, memory: 12288 },

    // 8 vCPU · 16 GB — community server: heavy zombie population + wide world coverage.
    "Community · 32+ Players": { cpu: 8192, memory: 16384 },
};

const ProjectZomboid: Game = {
    name:     'Project Zomboid',
    category: 'ProjectZomboid',
    profiles: ProjectZomboidProfiles,
    getBanner: async () => banner,
    getSchema: async () => ProjectZomboidConfigurationSchema,
};

export default ProjectZomboid;

export const ProjectZomboidConfigurationSchema = v.object({
    ADMIN_USERNAME: v.pipe(v.string(), v.minLength(4), v.maxLength(16)),
    ADMIN_PASSWORD: v.pipe(v.string(), v.minLength(8), v.maxLength(32)),
    PASSWORD: v.pipe(v.string(), v.minLength(8), v.maxLength(32)),
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    DEFAULT_PORT: v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)),
    UDP_PORT: v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)),
    UPDATE_ON_START: v.boolean()
});
