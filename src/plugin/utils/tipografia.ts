import type { FormatoTipo, AlturaLinea } from "../modelo/tipos.ts";

// Formatea la tipografía de un nodo (incluido el line-height) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    return `${medida} ${t.style} ${t.family}`;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  return s;
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
