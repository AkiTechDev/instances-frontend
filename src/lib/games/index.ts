import type { Game } from './types';

import MinecraftIcon from '../../assets/games/MinecraftJava/icon.svg';
import ValheimIcon from '../../assets/games/Valheim/icon.svg';
import HytaleIcon from '../../assets/games/Hytale/icon.svg';
import ProjectZomboidIcon from '../../assets/games/ProjectZomboid/icon.svg';
import type { SvgComponent } from 'astro/types';
import type { ImageMetadata } from 'astro';

export const gameRegistry: Record<string, {
    name: string;
    icon: SvgComponent & ImageMetadata;
    load: () => Promise<{ default: Game }>;
}> = {
    'MinecraftJava': {
        name: 'Minecraft Java',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftJava/MinecraftJava'),
    },
    'MinecraftAllTheMods10': {
        name: 'Minecraft ATM 10',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftAllTheMods10'),
    },
    'MinecraftBetterMC4': {
        name: 'Minecraft BetterMC 4',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftBetterMC4'),
    },
    'MinecraftCursedWalking': {
        name: 'Minecraft Cursed Walking',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftCursedWalking'),
    },
    'MinecraftProminence2': {
        name: 'Minecraft Prominence 2',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftProminence2'),
    },
    'MinecraftRLCraft': {
        name: 'Minecraft RLCraft',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftRLCraft'),
    },


    'MinecraftBedrock': {
        name: 'Minecraft Bedrock',
        icon: MinecraftIcon,
        load: () => import('./supported/MinecraftBedrock'),
    },


    'Valheim': {
        name: 'Valheim',
        icon: ValheimIcon,
        load: () => import('./supported/Valheim'),
    },

    'Hytale': {
        name: 'Hytale',
        icon: HytaleIcon,
        load: () => import('./supported/Hytale')
    },

    'ProjectZomboid': {
        name: 'Project Zomboid',
        icon: ProjectZomboidIcon,
        load: () => import('./supported/ProjectZomboid')
    }
};