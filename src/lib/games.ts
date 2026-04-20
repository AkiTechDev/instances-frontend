import { pricing } from "./pricing";
import { regions } from "./regions";

export interface Game {
    name: string
    icon: string
    profiles: {[id: string]: InstanceProfile},
};

export interface InstanceProfile {
    cpu: number,
    memory: number
}

const DefaultProfiles: {[id: string]: InstanceProfile} = {
    "2-3 Players": { cpu: 2048, memory: 4096 },
    "5-10 Players": { cpu: 4096, memory: 8192 },
    "10+ Players": { cpu: 4096, memory: 12288 }
}

const games: {[id: string]: Game} = {
    "MinecraftJava": {
        name: "Minecraft Java",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftAllTheMods10": {
        name: "Minecraft ATM10",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftBetterMC4": {
        name: "Minecraft BetterMC 4",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftRLCraft": {
        name: "Minecraft RLCraft",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftProminence2": {
        name: "Minecraft Prominence 2",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftCursedWalking": {
        name: "Minecraft Cursed Walking",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "MinecraftBedrock": {
        name: "Minecraft Bedrock",
        icon: "imgs/MinecraftJava/icon.svg",
        profiles: DefaultProfiles,
    },
    "Valheim": {
        name: "Valheim",
        icon: "imgs/Valheim/icon.svg",
        profiles: DefaultProfiles,
    },
};

export default games;


export const fgCalc = (region: string, memory: number, cpu: number, tier: string) => {
    const costs = pricing[region];
    const commission = tier === "Premium" ? 1.3 : 1.2;
 
    const vcpu_cost = (cpu / 1024) * costs.vCpuPerHour;
    const memory_cost = (memory / 1024) * costs.memoryGbPerHour;

    return ((vcpu_cost + memory_cost) * commission).toFixed(2);
}; 