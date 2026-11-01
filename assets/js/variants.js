export const VARIANTS = 2;

export function nextVariant(map, key) {
  const variant = map.has(key) ? (map.get(key) + 1) % VARIANTS : 0;
  map.set(key, variant);
  return variant;
}
