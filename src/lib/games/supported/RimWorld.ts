import type { Game, GamePage } from '../types';
import type { InstanceProfile } from '../types';

import banner from '../../../assets/games/RimWorld/banner.png?format=avif;webp&responsive';

import * as v from "valibot";

/**
 * Compute profiles for the RimWorld Together server: the multiplayer mod's own .NET 10 server,
 * run from the project's image (ghcr.io/rimworld-together/rimworld-together).
 *
 * Sizing rationale — a store-and-relay server, so connections drive CPU and saves drive RAM:
 *  - Nothing is simulated server-side. Each player's game runs their own colony; the server
 *    stores saves, maps and settlements and relays trades, raids, aid and chat. Its README:
 *    "there aren't any heavy hardware related dependencies". Hosts sell it at 2-6 GB, 1-2 vCores.
 *  - CPU follows connected players, not what they do. Each connection gets a read loop and a
 *    write loop that Thread.Sleep(1) and then poll, idle or not. PR #299 replaced them with
 *    blocking reads but was closed unmerged, and the shipped RTNetwork.dll still polls. A
 *    replica of those loops, measured on Linux (2026-10-23), cost ~0.3-0.4% of a core per idle
 *    connection pinned to one or two cores, and twice that spread over four: more vCPU makes it
 *    worse, so no tier goes past 2. Fargate vCPUs are slower hyperthreads; budget about 2x.
 *  - A save or map crosses the server whole, as one byte array copied through decryption and
 *    deserialisation. Saves arrive zipped, but modded late-game colonies still reach tens of MB,
 *    and every player uploads theirs as they leave.
 *  - By default the server zips all its data into a backup every hour, keeping six: a burst of
 *    CPU that grows with the number of colonies.
 *  - The task also holds the plan's sidecar (probe 128 MiB, watchdog 256 MiB) and the IPv6
 *    relay, which forks a perl process per IPv6 player.
 *  - cpu in Fargate units (1024 = 1 vCPU); memory MiB. All pairs valid per ProfileOptions.
 */
export const RimWorldProfiles: { [id: string]: InstanceProfile } = {
    // 0.5 vCPU · 2 GB — friends sharing a planet; the memory is for modded saves in flight.
    "Small · 1-8 Players":        { cpu: 512, memory: 2048 },

    // 1 vCPU · 3 GB — a bigger group, up to the 20 players a new server allows.
    "Medium · 9-20 Players":      { cpu: 1024, memory: 3072 },

    // 2 vCPU · 4 GB — community server; this many connections' polling wants a second core.
    "Large · 21-50 Players":      { cpu: 2048, memory: 4096 },

    // 2 vCPU · 6 GB — public server up to the 100-player cap. More memory, not more cores.
    "Community · 51-100 Players": { cpu: 2048, memory: 6144 },
};

/**
 * Draft copy for /games/rimworld.
 *
 * Drafted from the sizing rationale above, so the public explanation and the
 * tier definitions cannot tell different stories. `draft: true` keeps the page
 * out of the search index and puts a notice on it until the wording is signed
 * off. The settings are written out rather than left to the schema's field
 * names: fifteen of them are feature switches whose names don't say what they
 * switch.
 */
const RimWorldPage: GamePage = {
    slug: "rimworld",
    draft: true,
    tagline: "Your colonies run on your own PCs. The server keeps the planet you share.",
    summary:
        "Host a RimWorld Together server. Each colony runs on its player's own PC and the server keeps the shared planet, so sizes start at half a vCPU.",

    intro: [
        "RimWorld has no multiplayer of its own. RimWorld Together adds it, as a mod everyone installs: each of you runs your own colony on one shared planet, and you trade, raid and send each other aid across it.",
        "None of that colony simulation happens on the server. It keeps the planet — saves, maps, settlements, the marketplace — and passes along what you do to each other, which makes it one of the lightest servers we run. The sizes are built around what little it does do.",
    ],

    tierNotes: {
        "Small · 1-8 Players":
            "A group of friends sharing a planet. Half a vCPU is plenty, because every colony runs on its own player's PC.",
        "Medium · 9-20 Players":
            "A bigger group, up to twenty — the player limit a new server starts with.",
        "Large · 21-50 Players":
            "A community server. This many people connected at once is where a second vCPU earns its keep.",
        "Community · 51-100 Players":
            "A public server, up to the hundred-player limit. The same two vCPU as Large, with more memory for more saves moving at once.",
    },

    sizing: [
        "Nothing is simulated on the server. Each player's game runs their own colony, and the server stores saves and maps and relays trades, raids, aid and chat between players. That is why the smallest size is half a vCPU.",
        "Processor use follows how many people are connected, not what they are doing. The server checks every open connection about a thousand times a second, whether anything has arrived or not, so a hundred idle players are a real load. It also zips every colony into a backup each hour, which takes longer the more colonies there are.",
        "Past two vCPU it gets worse, not better. In our tests the same hundred idle connections cost twice as much spread over four cores as over two, so the largest size stops at two vCPU and adds memory instead.",
        "Memory follows the saves in flight. A colony's save and map cross the server whole, held in memory while they are stored or sent on, and a modded late-game colony makes a big save. Each size leaves room for many at once, such as everyone saving on their way out.",
    ],

    config: [
        { key: "SERVER_NAME", label: "Server name", description: "How the server appears in the in-game browser and the player list." },
        { key: "SERVER_PORT", label: "Port", description: "The TCP port players connect on. Leave it be unless you have a reason not to." },
        { key: "SERVER_PASSWORD", label: "Password", description: "Everyone joining needs it; leave it empty for an open server. A new server starts with one, because whoever joins first creates the world and becomes its admin." },
        { key: "MAX_PLAYERS", label: "Player limit", description: "How many can be connected at once. Someone still logging in counts." },
        { key: "LIST_PUBLICLY", label: "List publicly", description: "Lists the server in RimWorld Together's in-game browser, so players can find it without the address. Listing sends RimWorld Together's own service the server's name, address, player names and mods." },
        { key: "DESCRIPTION", label: "Description", description: "Shown beside the server in the browser, if it's listed." },
        { key: "DISCORD_URL", label: "Discord link", description: "An invite to your Discord, shown beside the server in the browser." },
        { key: "STEAM_WORKSHOP_URL", label: "Workshop link", description: "A Steam Workshop link to the server's mods, shown beside the server in the browser." },
        { key: "SERVER_IMAGE_URL", label: "Server image", description: "An image for the server's listing in the browser." },
        { key: "MOTD", label: "Message of the day", description: "Sent to each player as they join. Leave it empty for none." },
        { key: "JOIN_LEAVE_MESSAGES", label: "Join and leave messages", description: "Posts in chat as each player joins or leaves." },
        { key: "SERVER_SAVES_ONLY", label: "Server saves only", description: "Players always resume from the server's copy of their colony, even if they have their own, so an edited or older save can't be brought back." },
        { key: "ENABLE_RAIDS", label: "Raids", description: "Lets players raid another player's colony, fought on the copy of its map the server keeps." },
        { key: "ENABLE_EVENTS", label: "Events", description: "Lets players set off events in another player's colony while its owner is online." },
        { key: "ENABLE_AID", label: "Aid", description: "Lets players send colonists to help another player's colony, if its owner is online to accept them." },
        { key: "ENABLE_TRADE", label: "Trade", description: "Lets players trade with, or send gifts to, another player's colony while its owner is online." },
        { key: "ENABLE_CARAVANS", label: "Caravans", description: "Shows each player's caravans on everyone else's world map as they travel." },
        { key: "ENABLE_MARKET", label: "Market", description: "A shared marketplace where players post items for anyone on the server to buy." },
        { key: "ENABLE_GUILDS", label: "Guilds", description: "Lets players found guilds, invite others and rank their members." },
        { key: "ENABLE_SITES", label: "Sites", description: "Lets players build sites on the world map that produce rewards over time." },
        { key: "ENABLE_ROADS", label: "Roads", description: "Lets players build roads across the shared world map." },
        { key: "ENABLE_RIVERS", label: "Rivers", description: "Syncs the planet's rivers, so every player sees the same ones." },
        { key: "ENABLE_POLLUTION", label: "Pollution", description: "Spreads each colony's pollution onto the shared planet, where every player sees it." },
        { key: "ENABLE_LEADERBOARD", label: "Leaderboard", description: "Ranks colonies by wealth, for everyone on the server to see." },
        { key: "ENABLE_MAP_VIEWING", label: "Map viewing", description: "Lets players look at another player's colony, from the copy of its map the server keeps." },
        { key: "ENABLE_ROLLBACK", label: "Rollback", description: "Lets players roll their own colony back to an earlier save." },
        { key: "ENABLE_SCENARIO_EDITOR", label: "Scenario editor", description: "Lets players use RimWorld's scenario editor." },
        { key: "ADMINS", label: "Admins", description: "Usernames made admin each time the server starts, separated by spaces. A name only counts once that player has joined, and removing it doesn't take admin away." },
    ],
};

const RimWorld: Game = {
    name:     'RimWorld',
    category: 'RimWorld',
    profiles: RimWorldProfiles,
    // RimWorld has no multiplayer of its own: every player needs the RimWorld
    // Together mod, and the server, which pulls the mod's latest release at
    // each start, refuses a client on any other version. And whoever joins
    // first picks the world's settings and becomes its admin, which is why a
    // new server starts with a password.
    setupNotes: [
        {
            title: "Everyone who plays needs the RimWorld Together mod.",
            body: "It's free on the Steam Workshop. Your server updates to the mod's latest release each time it starts, and only lets in players on that same version.",
        },
        {
            title: "The first player to join creates the world and becomes its admin.",
            body: "They choose its difficulty, storyteller and scenario. Your server starts with a password, which you'll find in its settings, so strangers can't get there first.",
        },
    ],
    getBanner: async () => banner,
    getSchema: async () => RimWorldConfigurationSchema,
    page: RimWorldPage,
};

export default RimWorld;

/*
 * Mirrors the backend's RimWorld schema key for key: it refuses any key it
 * doesn't list, and requires every one it does. The server reads no
 * environment; its start script writes these into the JSON files the server
 * reads, which is where most of the rules come from.
 */

// Free text goes into those files as JSON strings, which can't hold a raw
// control character. Empty where the setting is optional.
const noControl = /^[^\x00-\x1F\x7F]*$/;
const noControlMessage = "No tabs or other control characters";

// Each link goes where its label says, with nothing a JSON string would need
// to escape. Empty for none.
const linkMessage = (prefix: string) => `Use a link starting ${prefix}, with no spaces`;

export const RimWorldConfigurationSchema = v.object({
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32), v.regex(/^[^\x00-\x1F\x7F]+$/, noControlMessage)),
    SERVER_PORT: v.pipe(v.number(), v.integer(), v.minValue(1024), v.maxValue(65535)),
    // Empty for none. The client sends a hash of the password's ASCII bytes,
    // so anything else would quietly become a different password.
    SERVER_PASSWORD: v.pipe(v.string(), v.maxLength(32),
        v.regex(/^[\x21-\x7E]*$/, "Letters, numbers and symbols only, no spaces")),
    MAX_PLAYERS: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    LIST_PUBLICLY: v.boolean(),
    DESCRIPTION: v.pipe(v.string(), v.maxLength(128), v.regex(noControl, noControlMessage)),
    DISCORD_URL: v.pipe(v.string(), v.maxLength(256),
        v.regex(/^(https:\/\/(www\.)?discord\.(gg|com)\/[^\x00-\x20\x22\x5C\x7F]+)?$/, linkMessage("https://discord.gg/ or https://discord.com/"))),
    STEAM_WORKSHOP_URL: v.pipe(v.string(), v.maxLength(256),
        v.regex(/^(https:\/\/(www\.)?steamcommunity\.com\/[^\x00-\x20\x22\x5C\x7F]+)?$/, linkMessage("https://steamcommunity.com/"))),
    SERVER_IMAGE_URL: v.pipe(v.string(), v.maxLength(256),
        v.regex(/^(https:\/\/[^\x00-\x20\x22\x5C\x7F]+)?$/, linkMessage("https://"))),
    MOTD: v.pipe(v.string(), v.maxLength(128), v.regex(noControl, noControlMessage)),
    JOIN_LEAVE_MESSAGES: v.boolean(),
    SERVER_SAVES_ONLY: v.boolean(),
    ENABLE_RAIDS: v.boolean(),
    ENABLE_EVENTS: v.boolean(),
    ENABLE_AID: v.boolean(),
    ENABLE_TRADE: v.boolean(),
    ENABLE_CARAVANS: v.boolean(),
    ENABLE_MARKET: v.boolean(),
    ENABLE_GUILDS: v.boolean(),
    ENABLE_SITES: v.boolean(),
    ENABLE_ROADS: v.boolean(),
    ENABLE_RIVERS: v.boolean(),
    ENABLE_POLLUTION: v.boolean(),
    ENABLE_LEADERBOARD: v.boolean(),
    ENABLE_MAP_VIEWING: v.boolean(),
    ENABLE_ROLLBACK: v.boolean(),
    ENABLE_SCENARIO_EDITOR: v.boolean(),
    // Names separated by spaces, which no RimWorld Together name can hold —
    // nor any of the characters refused here.
    ADMINS: v.pipe(v.string(), v.maxLength(256),
        v.regex(/^[^\x00-\x1F\x7F\x22\x2A\x2F\x3A\x3C\x3E\x3F\x7C]*$/, 'Names separated by spaces, without " * / : < > ? or |')),
});
