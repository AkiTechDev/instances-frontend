import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/MinecraftAllTheMods10/banner.webp?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

const MinecraftAllTheMods10: Game = {
    name:     'Minecraft ATM 10',
    category: 'Minecraft',
    profiles: HeavyModpackProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema
};

export default MinecraftAllTheMods10;