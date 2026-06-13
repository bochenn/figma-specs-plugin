import type { Unidad } from "../modelo/tipos.ts";

// Formatea un valor en px al formato elegido (px = número pelado; rem = n/16).
export function formatearEspaciado(n: number, unidad: Unidad): string {
  return unidad === "rem" ? `${n / 16}rem` : String(n);
}

// "16" / "1rem" sin variable; "DS Space/padding/1x (16)" con variable.
export function etiquetaSpacing(px: number, unidad: Unidad, nombreVar?: string): string {
  const v = formatearEspaciado(px, unidad);
  return nombreVar ? `${nombreVar} (${v})` : v;
}

let unidad: Unidad = "px";

// Setea la unidad actual (default px).
export function aplicarUnidad(u: Unidad): void {
  unidad = u;
}

// Devuelve la unidad actual.
export function unidadActual(): Unidad {
  return unidad;
}
