import type { FormatoTipo, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";
import { formatearEspaciado, unidadActual } from "./espaciado.ts";

// Valor en px formateado según la unidad actual:
// px → "16" (Plain) o "16px" (CSS); rem → "1rem" en ambos.
function valorPx(n: number, conSufijo: boolean): string {
  if (unidadActual() === "rem") return formatearEspaciado(n, "rem");
  return conSufijo ? `${n}px` : String(n);
}

// Formatea la tipografía de un nodo (line-height y letter-spacing incluidos) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea; letterSpacing?: EspaciadoLetra },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (formato === "CSS") {
    let medida = valorPx(t.size, true);
    if (lh && lh.unidad === "px") medida += `/${valorPx(lh.valor, true)}`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    let s = `${medida} ${t.style} ${t.family}`;
    if (ls && ls.valor !== 0) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : valorPx(ls.valor, true)}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${valorPx(t.size, false)}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : valorPx(lh.valor, false);
    s += ` / ${lhStr}`;
  }
  if (ls && ls.valor !== 0) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : valorPx(ls.valor, false)}`;
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
