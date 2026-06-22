import type { Unidad } from "../modelo/tipos.ts";

// Redondea a máximo 2 decimales (sin ceros sobrantes).
function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Formatea un valor en px al formato elegido. `mostrarUnidad` agrega "px" (rem siempre
// lleva su unidad). px sin unidad = número pelado (para las cotas del artwork).
export function formatearEspaciado(n: number, unidad: Unidad, mostrarUnidad = false): string {
  if (unidad === "rem") return `${redondear2(n / 16)}rem`;
  const v = redondear2(n);
  return mostrarUnidad ? `${v}px` : `${v}`;
}

// "16" / "1rem" sin variable; "DS Space/padding/1x (16)" con variable.
export function etiquetaSpacing(px: number, unidad: Unidad, nombreVar?: string): string {
  const v = formatearEspaciado(px, unidad);
  return nombreVar ? `${nombreVar} (${v})` : v;
}

// Padding legible al estilo CSS: colapsa lados iguales. 4 iguales → un valor;
// pares vertical/horizontal → "V H"; todos distintos → "T R B L". Cada lado se
// formatea con etiquetaSpacing (respeta unidad y nombre de variable).
export function textoPadding(
  p: { left: number; top: number; right: number; bottom: number },
  unidad: Unidad,
  sv: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string } = {},
): string {
  const T = etiquetaSpacing(p.top, unidad, sv.paddingTop);
  const R = etiquetaSpacing(p.right, unidad, sv.paddingRight);
  const B = etiquetaSpacing(p.bottom, unidad, sv.paddingBottom);
  const L = etiquetaSpacing(p.left, unidad, sv.paddingLeft);
  if (T === R && R === B && B === L) return T;
  if (T === B && L === R) return `${T} ${R}`;
  return `${T} ${R} ${B} ${L}`;
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
