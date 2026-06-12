import type { FormatoTipo } from "../modelo/tipos.ts";

// Formatea la tipografía de un nodo según el formato elegido.
export function formatearTipografia(t: { family: string; style: string; size: number }, formato: FormatoTipo): string {
  if (formato === "CSS") return `${t.size}px ${t.style} ${t.family}`;
  return `${t.family} ${t.style} ${t.size}`;
}

let formato: FormatoTipo = "Plain";

// Setea el formato de tipografía actual (default Plain).
export function aplicarFormatoTipo(f: FormatoTipo): void {
  formato = f;
}

// Devuelve el formato de tipografía actual.
export function formatoTipoActual(): FormatoTipo {
  return formato;
}
