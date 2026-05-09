import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/MinecraftRLCraft/banner.avif?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

const MinecraftRLCraft: Game = {
    name:     'Minecraft RLCraft',
    category: 'Minecraft',
    profiles: HeavyModpackProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftRLCraft;