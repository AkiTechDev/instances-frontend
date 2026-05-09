import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/MinecraftProminence2/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

const MinecraftProminence2: Game = {
    name:     'Minecraft Prominence 2',
    category: 'Minecraft',
    profiles: HeavyModpackProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftProminence2;