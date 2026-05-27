import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/Valheim/banner.png?format=avif;webp&responsive';

import * as v from "valibot";

const Valheim: Game = {
    name:     'Valheim',
    category: 'Valheim',
    profiles: HeavyModpackProfiles,
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