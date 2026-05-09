import type { Game } from '../types';
import { DefaultProfiles } from '../profiles';

import banner from '../../../assets/games/MinecraftJava/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

const MinecraftBedrock: Game = {
    name:     'Minecraft Bedrock',
    category: 'Minecraft',
    profiles: DefaultProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftBedrock;