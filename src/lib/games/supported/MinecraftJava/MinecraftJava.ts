import type { Game } from '../../types';
import { DefaultProfiles } from '../../profiles';

import banner from '../../../../assets/games/MinecraftJava/banner.png?format=avif;webp&responsive';

import { MinecraftJavaConfigurationSchema } from './schema';

const MinecraftJava: Game = {
    name:     'Minecraft Java',
    category: 'Minecraft',
    profiles: DefaultProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};


export default MinecraftJava;