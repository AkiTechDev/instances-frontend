interface Region {
  value: string,
  label: string
};


export const regions: {[id: string]: string} = {
  'sa-east-1': 'Sao Paulo',
  'us-east-1': 'N. Virginia',
  'us-east-2': 'Ohio',
  'us-west-1': 'N. California',
  'us-west-2': 'Oregon',
  'ap-south-1': 'Mumbai',
  'ap-northeast-1': 'Tokyo',
  'ap-northeast-2': 'Seoul',
  'ap-southeast-1': 'Singapore',
  'ap-southeast-2': 'Sydney',
  'ca-central-1': 'Canada',
  'eu-central-1': 'Frankfurt',
  'eu-west-1': 'Ireland',
  'eu-west-2': 'London',
};



async function pingRegion(region: string) {
  const url = `https://dynamodb.${region}.amazonaws.com/ping`;
  const start = performance.now();
  try {
    await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" });
    return performance.now() - start;
  } catch {
    return Infinity; // unreachable
  }
}

export async function getBestRegion() {
  const results = await Promise.all(
    Object.keys(regions).map(async (region: string) => ({
      region,
      latency: await pingRegion(region),
    }))
  );

  results.sort((a, b) => a.latency - b.latency);
  return results; // results[0] is the best region
}