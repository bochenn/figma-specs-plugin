import type { StyleEntry, InventoryRow } from "../modelo/tipos.ts";

// Joins layer names separated by comma, in first-appearance order;
// repeats are shown once with the count in parentheses.
export function formatAppliedTo(capas: string[]): string {
  const orden: string[] = [];
  const count = new Map<string, number>();
  for (const c of capas) {
    if (!count.has(c)) orden.push(c);
    count.set(c, (count.get(c) ?? 0) + 1);
  }
  return orden
    .map((c) => {
      const n = count.get(c) ?? 1;
      return n > 1 ? `${c} (${n})` : c;
    })
    .join(", ");
}

// Groups the entries by (table, name, appliedAs); each unique combination
// it's a row, with the layers joined into "Applied to".
export function groupInventory(entries: StyleEntry[]): InventoryRow[] {
  const orden: string[] = [];
  const groups = new Map<string, { table: "color" | "text" | "variable"; name: string; appliedAs: string; capas: string[]; swatchHex?: string; gradient?: StyleEntry["gradient"]; type?: StyleEntry["type"] }>();

  for (const e of entries) {
    const key = `${e.table}|${e.name}|${e.appliedAs}`;
    let group = groups.get(key);
    if (!group) {
      orden.push(key);
      group = { table: e.table, name: e.name, appliedAs: e.appliedAs, capas: [], swatchHex: e.swatchHex, gradient: e.gradient, type: e.type };
      groups.set(key, group);
    }
    group.capas.push(e.layer);
  }

  return orden.map((key) => {
    const g = groups.get(key)!;
    const row: InventoryRow = { table: g.table, name: g.name, appliedAs: g.appliedAs, appliedTo: formatAppliedTo(g.capas) };
    if (g.swatchHex) row.swatchHex = g.swatchHex;
    if (g.gradient) row.gradient = g.gradient;
    if (g.type) row.type = g.type;
    return row;
  });
}
