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
// The server won't start without the EULA accepted, so there is nothing else
// to offer.
const eula = [
    "TRUE"
];

export const MinecraftJavaConfigurationSchema = v.object({
    SERVER_NAME: v.pipe(v.string(), v.minLength(4), v.maxLength(32)),
    SERVER_PORT: v.pipe(v.number(), v.integer(), v.minValue(1024), v.maxValue(65535)),
    VERSION: v.picklist(versions),
    MOTD: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
    DIFFICULTY: v.picklist(difficulty),
    HARDCORE: v.boolean(),
    MODE: v.picklist(modes),
    PVP: v.boolean(),
    EULA: v.picklist(eula)
});