const PREFIXES = [
  "Aether", "Iron", "Frost", "Ember", "Shadow", "Stone", "Crimson", "Void",
  "Silver", "Thorn", "Ashen", "Storm", "Hollow", "Dusk", "Gilded", "Savage",
  "Bleak", "Verdant", "Pale", "Sunken",
];

const MIDDLES = [
  "The", "Dark", "Wild", "Lost", "Broken", "Eternal",
  "Forsaken", "Ancient", "Burning", "Dying", "Howling", "Sunless", "Wandering",
];

const SUFFIXES = [
  "Vale", "Hollow", "Reach", "Spire", "Mere", "Fell", "Moor", "Haven",
  "Mark", "Watch", "Keep", "Gate", "Depth", "Crown", "Strand", "Bastion",
  "Expanse", "Abyss", "Sanctum", "Threshold",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomName() {
  return { prefix: pick(PREFIXES), middle: pick(MIDDLES), suffix: pick(SUFFIXES) };
}

export function fullSeverName(parts: {[id: string]: string}) {
  return `${parts.prefix} ${parts.middle} ${parts.suffix}`;
}
