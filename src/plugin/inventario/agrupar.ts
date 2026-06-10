import type { EntradaEstilo, FilaInventario } from "../modelo/tipos.ts";

// Junta nombres de capa separados por coma, en orden de primera aparición;
// los repetidos se muestran una vez con la cantidad entre paréntesis.
export function formatearAplicadoA(capas: string[]): string {
  const orden: string[] = [];
  const conteo = new Map<string, number>();
  for (const c of capas) {
    if (!conteo.has(c)) orden.push(c);
    conteo.set(c, (conteo.get(c) ?? 0) + 1);
  }
  return orden
    .map((c) => {
      const n = conteo.get(c) ?? 1;
      return n > 1 ? `${c} (${n})` : c;
    })
    .join(", ");
}

// Agrupa las entradas por (tabla, nombre, appliedAs); cada combinación única
// es una fila, con las capas juntadas en "Applied to".
export function agruparInventario(entradas: EntradaEstilo[]): FilaInventario[] {
  const orden: string[] = [];
  const grupos = new Map<string, { tabla: "color" | "text" | "variable"; nombre: string; appliedAs: string; capas: string[]; swatchHex?: string }>();

  for (const e of entradas) {
    const clave = `${e.tabla}|${e.nombre}|${e.appliedAs}`;
    let grupo = grupos.get(clave);
    if (!grupo) {
      orden.push(clave);
      grupo = { tabla: e.tabla, nombre: e.nombre, appliedAs: e.appliedAs, capas: [], swatchHex: e.swatchHex };
      grupos.set(clave, grupo);
    }
    grupo.capas.push(e.capa);
  }

  return orden.map((clave) => {
    const g = grupos.get(clave)!;
    const fila: FilaInventario = { tabla: g.tabla, nombre: g.nombre, appliedAs: g.appliedAs, appliedTo: formatearAplicadoA(g.capas) };
    if (g.swatchHex) fila.swatchHex = g.swatchHex;
    return fila;
  });
}
