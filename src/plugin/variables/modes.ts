import type { ModeEntry, ModesCollection } from "../modelo/tipos.ts";

// Converts a color (0..1 channels) to uppercase hex #RRGGBB.
export function hexOfColor(rgb: { r: number; g: number; b: number }): string {
  const canal = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
  return "#" + canal(rgb.r) + canal(rgb.g) + canal(rgb.b);
}

// Groups the entries by collection (first-appearance order); takes the
// modes of the first entry of each collection.
export function groupModes(entries: ModeEntry[]): ModesCollection[] {
  const orden: string[] = [];
  const groups = new Map<string, ModesCollection>();
  for (const e of entries) {
    let g = groups.get(e.collectionName);
    if (!g) {
      orden.push(e.collectionName);
      g = { collectionName: e.collectionName, collectionId: e.collectionId, modes: e.modes, attributes: [] };
      groups.set(e.collectionName, g);
    }
    g.attributes.push({
      layer: e.layer,
      appliedAs: e.appliedAs,
      variableName: e.variableName,
      values: e.values,
    });
  }
  return orden.map((n) => groups.get(n)!);
}
