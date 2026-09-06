interface Pricing {
  vCpuPerHour: number,
  memoryGbPerHour: number
}

/**
 * Hourly Fargate cost for a size, in a given region.
 *
 * Returns null when we hold no price table for the region (unknown id, or one
 * AWS added since this table was last refreshed) — the caller decides how to
 * render "we don't know" rather than this throwing part-way through a render.
 */
export const fgCalc = (region: string, memory: number, cpu: number, tier: string): string | null => {
    const costs = pricing[region];
    if (!costs) return null;

    const commission = tier === "Premium" ? 1.3 : 1.2;
 
    const vcpu_cost = (cpu / 1024) * costs.vCpuPerHour;
    const memory_cost = (memory / 1024) * costs.memoryGbPerHour;

    return ((vcpu_cost + memory_cost) * commission).toFixed(2);
}; 

export const pricing: {[id: string]: Pricing} = {
  'us-east-1': {
    vCpuPerHour: 0.04048,
    memoryGbPerHour: 0.004445,
  },
  'sa-east-1': {
    vCpuPerHour: 0.0696,
    memoryGbPerHour: 0.0076,
  },
  'us-east-2': {
    vCpuPerHour: 0.04048,
    memoryGbPerHour: 0.004445,
  },
  'us-west-1': {
    vCpuPerHour: 0.04656,
    memoryGbPerHour: 0.00511,
  },
  'us-west-2': {
    vCpuPerHour: 0.04048,
    memoryGbPerHour: 0.004445,
  },
  'ap-south-1': {
    vCpuPerHour: 0.04048,
    memoryGbPerHour: 0.004445,
  },
  'ap-northeast-1': {
    vCpuPerHour: 0.05056,
    memoryGbPerHour: 0.00553,
  },
  'ap-northeast-2': {
    vCpuPerHour: 0.04656,
    memoryGbPerHour: 0.00511,
  },
  'ap-southeast-1': {
    vCpuPerHour: 0.05056,
    memoryGbPerHour: 0.00553,
  },
  'ap-southeast-2': {
    vCpuPerHour: 0.04856,
    memoryGbPerHour: 0.00532,
  },
  'ca-central-1': {
    vCpuPerHour: 0.04456,
    memoryGbPerHour: 0.004865,
  },
  'eu-central-1': {
    vCpuPerHour: 0.04656,
    memoryGbPerHour: 0.00511,
  },
  'eu-west-1': {
    vCpuPerHour: 0.04048,
    memoryGbPerHour: 0.004445,
  },
  'eu-west-2': {
    vCpuPerHour: 0.04656,
    memoryGbPerHour: 0.00511,
  },
};