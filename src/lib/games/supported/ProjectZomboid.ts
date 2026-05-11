import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/ProjectZomboid/banner.jpeg?format=avif;webp&responsive';

import * as v from "valibot";

const ProjectZomboid: Game = {
    name:     'ProjectZomboid',
    category: 'ProjectZomboid',
    profiles: HeavyModpackProfiles,
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