import type { Rect } from "./overlays.ts";
import type { Unidad } from "../modelo/tipos.ts";
import { unidadActual, etiquetaSpacing } from "./espaciado.ts";

// "<resizing> <dim>" con la dimensión formateada (variable + valor si la hay):
// "Fixed sizing/card-width (240)", "Hug 88", "Fixed 1rem".
export function textoDimension(resizing: string, px: number, unidad: Unidad, nombreVar?: string): string {
  return `${resizing} ${etiquetaSpacing(px, unidad, nombreVar)}`;
}

export interface MarcaX {
  x: number;       // centro de la banda (donde va el texto)
  desde: number;   // borde izquierdo de la banda (para los ticks)
  hasta: number;   // borde derecho
  valor: string;
  tipo: "padding" | "spacing";
}

export interface MarcaY {
  y: number;
  desde: number;
  hasta: number;
  valor: string;
  tipo: "padding" | "spacing";
}

// Descarta marcas que se pisan con otra anterior de igual valor (típico en
// wrap: el gap de cada fila se proyecta casi en la misma posición).
function sinPisadas<T extends { desde: number; hasta: number; valor: string }>(marcas: T[]): T[] {
  const resultado: T[] = [];
  for (const m of marcas) {
    const pisada = resultado.some((o) => o.valor === m.valor && m.desde < o.hasta && o.desde < m.hasta);
    if (!pisada) resultado.push(m);
  }
  return resultado;
}

// Marcas numéricas de un contenedor: las bandas verticales (padding left/right,
// gaps de dirección HORIZONTAL) se anotan arriba del artwork (eje X); las
// horizontales (padding top/bottom, gaps de dirección VERTICAL), a la izquierda
// (eje Y). Bandas de grosor 0 no generan marca. Con spacingAuto, las marcas de
// spacing dicen "Auto" (el padding conserva su número).
export function marcasLayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string } = {},
): { ejeX: MarcaX[]; ejeY: MarcaY[] } {
  const u = unidadActual();
  const ejeX: MarcaX[] = [];
  const ejeY: MarcaY[] = [];
  if (padding.left > 0) {
    ejeX.push({ x: frame.x + padding.left / 2, desde: frame.x, hasta: frame.x + padding.left, valor: etiquetaSpacing(padding.left, u, spacingVars.paddingLeft), tipo: "padding" });
  }
  if (padding.right > 0) {
    const desde = frame.x + frame.width - padding.right;
    ejeX.push({ x: desde + padding.right / 2, desde, hasta: frame.x + frame.width, valor: etiquetaSpacing(padding.right, u, spacingVars.paddingRight), tipo: "padding" });
  }
  if (padding.top > 0) {
    ejeY.push({ y: frame.y + padding.top / 2, desde: frame.y, hasta: frame.y + padding.top, valor: etiquetaSpacing(padding.top, u, spacingVars.paddingTop), tipo: "padding" });
  }
  if (padding.bottom > 0) {
    const desde = frame.y + frame.height - padding.bottom;
    ejeY.push({ y: desde + padding.bottom / 2, desde, hasta: frame.y + frame.height, valor: etiquetaSpacing(padding.bottom, u, spacingVars.paddingBottom), tipo: "padding" });
  }
  for (const g of gaps) {
    if (direccion === "HORIZONTAL") {
      ejeX.push({ x: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: spacingAuto ? "Auto" : etiquetaSpacing(g.width, u, spacingVars.itemSpacing), tipo: "spacing" });
    } else {
      ejeY.push({ y: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: spacingAuto ? "Auto" : etiquetaSpacing(g.height, u, spacingVars.itemSpacing), tipo: "spacing" });
    }
  }
  return { ejeX: sinPisadas(ejeX), ejeY: sinPisadas(ejeY) };
}

// Estilo de puntas de la cota azul según el resizing del eje:
// Fixed = topes, Fill = flechas hacia afuera, Hug = flechas hacia adentro.
export function estiloCota(resizing: string): "fixed" | "fill" | "hug" {
  if (resizing === "Fill") return "fill";
  if (resizing === "Hug") return "hug";
  return "fixed";
}

// Ícono de dirección del artwork (variante grilla cuando hay wrap).
export function iconoDireccion(
  direccion: "HORIZONTAL" | "VERTICAL",
  wrap: boolean,
): "flecha-h" | "flecha-v" | "grilla-h" | "grilla-v" {
  if (wrap) return direccion === "HORIZONTAL" ? "grilla-h" : "grilla-v";
  return direccion === "HORIZONTAL" ? "flecha-h" : "flecha-v";
}
