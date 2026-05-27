import type { InstanceProfile } from './types';

export const DefaultProfiles: { [id: string]: InstanceProfile } = {
    "2-3 Players":  { cpu: 2048, memory: 4096 },
    "5-10 Players": { cpu: 4096, memory: 8192 },
    "10+ Players":  { cpu: 4096, memory: 12288 },
};

// You can define heavier profiles for modpacks etc.
export const HeavyModpackProfiles: { [id: string]: InstanceProfile } = {
    "Solo":         { cpu: 2048, memory: 4096},
    "2-3 Players":  { cpu: 4096, memory: 8192 },
    "5-10 Players": { cpu: 4096, memory: 12288 },
    "10+ Players":  { cpu: 8192, memory: 16384 },
};