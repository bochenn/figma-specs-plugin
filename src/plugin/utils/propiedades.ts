// Strips the "#id" suffix from a component property's key.
export function propertyName(key: string): string {
  const i = key.indexOf("#");
  return i >= 0 ? key.slice(0, i) : key;
}
