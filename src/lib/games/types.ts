import type { ImageData } from "@responsive-image/core";
import type * as v from "valibot";

export interface InstanceProfile {
    cpu: number;
    memory: number;
}

export interface Game {
    name: string;
    category: string;
    profiles: { [id: string]: InstanceProfile };
    // Lazy loaders — nothing is imported until called
    getBanner: () => Promise<ImageData>;
    getSchema: () => Promise<v.ObjectSchema<any, undefined>>;
}