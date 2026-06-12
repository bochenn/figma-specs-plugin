import type { FormatoTipo, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";

// Formatea la tipografía de un nodo (line-height y letter-spacing incluidos) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea; letterSpacing?: EspaciadoLetra },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    let s = `${medida} ${t.style} ${t.family}`;
    if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}px`}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}`}`;
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
