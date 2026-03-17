export interface Game {
    name: string
    icon: string
};

const games: {[id: string]: Game} = {
    "MinecraftJava": {
        name: "Minecraft Java",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftAllTheMods10": {
        name: "Minecraft ATM10",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftBetterMC4": {
        name: "Minecraft BetterMC 4",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftRLCraft": {
        name: "Minecraft RLCraft",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftProminence2": {
        name: "Minecraft Prominence 2",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftCursedWalking": {
        name: "Minecraft Cursed Walking",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "MinecraftBedrock": {
        name: "Minecraft Bedrock",
        icon: "imgs/MinecraftJava/icon.svg"
    },
    "Valheim": {
        name: "Valheim",
        icon: "imgs/Valheim/icon.svg"
    },
};

export default games