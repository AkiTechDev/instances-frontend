function genMemoryOptions(start: number, end: number, size: number): any {
    let list = []

    for (var i = start; i <= end; i+= size) {
        list.push(i)
    }

    return list
}

// ECS Fargate vCPU + RAM options
export const ProfileOptions = {
    256: [512, 1024, 2048],
    512: genMemoryOptions(1024, 4096, 1024),
    1024: genMemoryOptions(2048, 8192, 1024),
    2048: genMemoryOptions(4096, 16384, 1024),
    4096: genMemoryOptions(8192, 30720, 1024),
    8192: genMemoryOptions(16384, 61440, 4096),
    16384: genMemoryOptions(32768, 122880, 8192),
}
