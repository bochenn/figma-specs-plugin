import type { EntradaModo, ColeccionModes } from "../modelo/tipos.ts";

// Convierte un color (canales 0..1) a hex #RRGGBB en mayúsculas.
export function hexDeColor(rgb: { r: number; g: number; b: number }): string {
  const canal = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
  return "#" + canal(rgb.r) + canal(rgb.g) + canal(rgb.b);
}

// Agrupa las entradas por collection (orden de primera aparición); toma los
// modos de la primera entrada de cada collection.
export function agruparModes(entradas: EntradaModo[]): ColeccionModes[] {
  const orden: string[] = [];
  const grupos = new Map<string, ColeccionModes>();
  for (const e of entradas) {
    let g = grupos.get(e.coleccionNombre);
    if (!g) {
      orden.push(e.coleccionNombre);
      g = { coleccionNombre: e.coleccionNombre, modos: e.modos, atributos: [] };
      grupos.set(e.coleccionNombre, g);
    }
    g.atributos.push({
      capa: e.capa,
      appliedAs: e.appliedAs,
      variableNombre: e.variableNombre,
      valores: e.valores,
    });
  }
  return orden.map((n) => grupos.get(n)!);
}
