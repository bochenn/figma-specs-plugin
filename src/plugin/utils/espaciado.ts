import type { Unidad } from "../modelo/tipos.ts";

// Formatea un valor en px al formato elegido (px = número pelado; rem = n/16).
export function formatearEspaciado(n: number, unidad: Unidad): string {
  return unidad === "rem" ? `${n / 16}rem` : String(n);
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
