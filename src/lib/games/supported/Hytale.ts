import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/Hytale/banner.jpg?format=avif;webp&responsive';

import * as v from "valibot";

const Hytale: Game = {
    name:     'Hytale',
    category: 'Hytale',
    profiles: HeavyModpackProfiles,
    getBanner: async () => banner,
    getSchema: async () => HytaleConfigurationSchema,
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