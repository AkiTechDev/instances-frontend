import type { Game } from '../types';
import { HeavyModpackProfiles } from '../profiles';

import banner from '../../../assets/games/MinecraftCursedWalking/banner.png?format=avif;webp&responsive';
import { MinecraftJavaConfigurationSchema } from './MinecraftJava/schema';

const MinecraftCursedWalking: Game = {
    name:     'Minecraft Cursed Walking',
    category: 'Minecraft',
    profiles: HeavyModpackProfiles,
    getBanner: async () => banner,
    getSchema: async () => MinecraftJavaConfigurationSchema,
};

export default MinecraftCursedWalking;