import * as v from "valibot";

const versions = [
    "LATEST",
    "1.21",
    "1.20.6",
    "1.19.4",
    "1.18.2",
    "1.17.1",
    "1.16.5"
];
const difficulty = [
    "peaceful",
    "easy",
    "normal",
    "hard"
];
const modes = [
    "creative",
    "survival",
    "adventure"
];
const eula = [
    "TRUE",
    "FALSE"
];

export const MinecraftJavaConfigurationSchema = v.object({
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    SERVER_PORT: v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)),
    VERSION: v.picklist(versions),
    MOTD: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
    DIFFICULTY: v.picklist(difficulty),
    HARDCORE: v.boolean(),
    MODE: v.picklist(modes),
    PVP: v.boolean(),
    EULA: v.picklist(eula)
});

export interface MinecraftJavaConfiguration {
    server_name: string,
    server_port: number,
    version: string,
    MOTD: string,
    difficulty: string,
    hardcore: boolean,
    mode: string,
    pvp: boolean,
    eula: boolean
}