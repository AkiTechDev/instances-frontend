import type { Game } from '../types';
import type { GamePage, InstanceProfile } from '../types';

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

/**
 * Copy for /games/valheim.
 *
 * Drafted from the sizing rationale above rather than written separately, so
 * the public explanation and the actual tier definitions can't tell different
 * stories. If the profiles change, this changes with them.
 */
const ValheimPage: GamePage = {
    slug: 'valheim',
    tagline: 'Ten Vikings, one world, and nobody has to forward a port.',
    summary:
        "Run a Valheim dedicated server sized around how the game actually behaves \u2014 three tiers built for its ten-player cap and the base-building that really drives the load. Billed by the hour.",

    intro: [
        "Valheim's dedicated server is a small, stubborn thing. It caps at ten players, does most of its world simulation on a single thread, and gets heavier the more you build rather than the more people join.",
        "So we didn't size it small, medium and large. There are three tiers, and each one exists because of something specific about how this game runs.",
    ],

    tierNotes: {
        'Solo \u00b7 1-3 Players':
            'Early game, a shared starter base, or a solo world you dip in and out of. 4 GB is the floor the game itself asks for.',
        'Small \u00b7 4-6 Players':
            'The usual case. Same two cores, more room for a world that has been running a few months and has real bases standing in it.',
        'Full Server \u00b7 7-10 Players':
            'A full ten-player server, or a smaller group with a genuinely sprawling build. Four vCPU is the ceiling the engine can use, not a budget cap.',
    },

    sizing: [
        'Valheim hard-caps at ten concurrent players, so the tiers stop where the game does. A sixteen-player Valheim server is not a thing we can sell you.',
        'The real cost driver is world and base complexity, not headcount. Every placed piece, portal and tamed creature is something the server tracks and ticks. Three people with two enormous longhouses will work it harder than six who just landed in the Meadows.',
        'The official guidance is roughly 4 GB and two cores to start, and long-lived worlds climb towards 6\u20138 GB as the build count grows. That is why the tiers add memory before they add cores.',
        'The server is largely single-threaded, so four vCPU is a practical ceiling. Paying for more cores would not make your world tick any faster, so we do not offer them.',
    ],

    config: [
        { key: 'SERVER_NAME', label: 'Server name', description: 'How the server appears in the in-game browser.' },
        { key: 'WORLD_NAME', label: 'World name', description: 'Names the world save. Changing it starts a new world rather than renaming the one you have.' },
        { key: 'SERVER_PASS', label: 'Password', description: 'Valheim requires one. Everyone joining needs it.' },
        { key: 'SERVER_PUBLIC', label: 'List publicly', description: 'Whether the server advertises itself in the community browser, or stays join-by-invite.' },
        { key: 'SERVER_PORT', label: 'Port', description: 'The UDP port the server listens on. Leave it be unless you have a reason not to.' },
        { key: 'ADMINLIST_IDS', label: 'Admins', description: 'Steam IDs allowed to run server commands.' },
        { key: 'PERMITTEDLIST_IDS', label: 'Allowlist', description: 'Set this and only these Steam IDs can join \u2014 everyone else is refused, password or not.' },
        { key: 'BANNEDLIST_IDS', label: 'Banned', description: 'Steam IDs refused a connection outright.' },
    ],

    faqs: [
        {
            q: 'How many people can play at once?',
            a: 'Ten. That is Valheim\u2019s own limit, not ours \u2014 which is why our largest tier is built for exactly that.',
        },
        {
            q: 'Do I pay while nobody is playing?',
            a: 'You pay for the hours the server is actually running. Stop it when your group logs off and the meter stops with it.',
        },
        {
            q: 'What happens to my world when I stop the server?',
            a: 'It stays on the instance\u2019s storage and is there when you start it again \u2014 stopping is not deleting. It does not survive deleting the instance, and we do not guarantee backups, so keep your own copy of a world you would hate to lose.',
        },
        {
            q: 'Can I move to a bigger size later?',
            a: 'Yes. Change the size from the instance\u2019s configuration and the hourly rate changes with it. You are not picking a tier for life.',
        },
    ],
};

const Valheim: Game = {
    name:     'Valheim',
    category: 'Valheim',
    profiles: ValheimProfiles,
    getBanner: async () => banner,
    getSchema: async () => ValheimConfigurationSchema,
    page: ValheimPage,
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
