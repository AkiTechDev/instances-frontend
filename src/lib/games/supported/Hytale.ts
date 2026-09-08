import type { Game, GamePage } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/Hytale/banner.png?format=avif;webp&responsive';

import * as v from "valibot";

/**
 * Compute profiles for the Hytale dedicated server.
 *
 * NOTE: These are PROVISIONAL estimates. Hytale is not released, so no real server specs exist
 * yet — the numbers below are modeled on comparable modern voxel-sandbox servers and this game's
 * schema (MAX_PLAYERS up to 100, VIEW_DISTANCE up to 15). Revisit once official server
 * requirements are published.
 *
 * Sizing rationale (estimated):
 *  - Treated like a modern voxel sandbox: worldgen + entity/chunk ticking are the expected
 *    drivers, so RAM and CPU scale with players and view distance.
 *  - 2 vCPU baseline for small groups; 4 vCPU for larger servers approaching the 100-player cap.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const HytaleProfiles: { [id: string]: InstanceProfile } = {
    // 2 vCPU · 4 GB — solo / small friend group.
    "Solo · 1-4 Players":     { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — small community server.
    "Small · 5-15 Players":   { cpu: 2048, memory: 6144 },

    // 4 vCPU · 8 GB — active server, higher view distance.
    "Medium · 15-40 Players": { cpu: 4096, memory: 8192 },

    // 4 vCPU · 12 GB — large public server approaching the 100-player cap.
    "Large · 40-100 Players": { cpu: 4096, memory: 12288 },
};

/**
 * Draft copy for /games/hytale.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off; the settings table falls back to the schema's own field names until
 * someone writes a `config` list.
 */
const HytalePage: GamePage = {
    slug: "hytale",
    draft: true,
    tagline: "Not out yet. Neither are the real numbers.",
    badge: "Unreleased",
    summary:
        "Hytale server hosting on Instances. The game is unreleased, so these sizes are provisional estimates modelled on comparable voxel sandboxes — and we will keep saying so until they are not.",

    intro: [
        "Hytale has not been released, so no real server requirements exist for it yet.",
        "The sizes below are estimates, modelled on comparable modern voxel-sandbox servers and on Hytale's own configuration schema, which allows up to 100 players and a view distance of 15. We will revisit them the moment official server requirements are published.",
    ],

    tierNotes: {
        "Solo · 1-4 Players":
            "Solo, or a small group of friends.",
        "Small · 5-15 Players":
            "A small community server.",
        "Medium · 15-40 Players":
            "An active server running a higher view distance.",
        "Large · 40-100 Players":
            "A large public server approaching the hundred-player cap.",
    },

    sizing: [
        "These are provisional. Nothing here has been measured against a real Hytale server, because there is not one to measure yet.",
        "We have treated it as a modern voxel sandbox: worldgen plus entity and chunk ticking are the expected drivers, so both processor and memory scale with players and view distance.",
        "Two vCPU as a baseline for small groups, four for larger servers approaching the cap the schema allows.",
    ],
};

const Hytale: Game = {
    name:     'Hytale',
    category: 'Hytale',
    profiles: HytaleProfiles,
    getBanner: async () => banner,
    getSchema: async () => HytaleConfigurationSchema,
    page: HytalePage,
};

export default Hytale;

const auth_modes = [
    "authenticated",
    "offline"
]

const patchline = [
    "release",
    "pre-release"
]

export const HytaleConfigurationSchema = v.object({
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    DEFAULT_PORT: v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)),
    MAX_PLAYERS: v.pipe(v.number(), v.minValue(1), v.maxValue(100)),
    VIEW_DISTANCE: v.pipe(v.number(), v.minValue(1), v.maxValue(15)),
    AUTH_MODE: v.picklist(auth_modes),
    PATCHLINE: v.picklist(patchline),
    DOWNLOAD_ON_START: v.boolean()
});
