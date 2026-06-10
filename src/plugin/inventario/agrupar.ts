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
