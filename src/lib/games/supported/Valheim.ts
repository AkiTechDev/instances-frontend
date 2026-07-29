import type { Game } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/Valheim/banner.png?format=avif;webp&responsive';

import * as v from "valibot";

/**
 * Compute profiles for the Valheim dedicated server.
 *
 * Sizing rationale — player-capped, base-complexity driven:
 *  - Valheim hard-caps at 10 concurrent players, so tiers are bounded by that ceiling rather
 *    than scaling indefinitely — the top tier is a full 10-player server.
 *  - The real cost driver is world/base complexity: large builds and many placed instances
 *    (pieces, portals, tamed creatures) grow RAM and per-tick CPU far more than player count.
 *    The server is largely single-threaded, so 4 vCPU is the practical ceiling.
 *  - Official guidance is ~4 GB / 2 cores minimum; big long-lived worlds climb toward 6-8 GB.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const ValheimProfiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 4 GB — solo or a few players, early/modest bases.
    "Solo · 1-3 Players":        { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — small group with established bases.
    "Small · 4-6 Players":       { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — full 10-player server / large sprawling builds.
    "Full Server · 7-10 Players": { cpu: 4096, memory: 8192 },
};

const Valheim: Game = {
    name:     'Valheim',
    category: 'Valheim',
    profiles: ValheimProfiles,
    getBanner: async () => banner,
    getSchema: async () => ValheimConfigurationSchema,
};

export default Valheim;

export const ValheimConfigurationSchema = v.object({
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    SERVER_PORT: v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)),
    WORLD_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    SERVER_PASS: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    SERVER_PUBLIC: v.boolean(),
    ADMINLIST_IDS: v.pipe(v.string(), v.minLength(4), v.maxLength(124)),
    BANNEDLIST_IDS: v.pipe(v.string(), v.minLength(4), v.maxLength(124)),
    PERMITTEDLIST_IDS: v.pipe(v.string(), v.minLength(4), v.maxLength(124))
});
