import type { Rect } from "./overlays.ts";
import { formatearEspaciado, unidadActual } from "./espaciado.ts";

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
): { ejeX: MarcaX[]; ejeY: MarcaY[] } {
  const E = (n: number) => formatearEspaciado(n, unidadActual());
  const ejeX: MarcaX[] = [];
  const ejeY: MarcaY[] = [];
  if (padding.left > 0) {
    ejeX.push({ x: frame.x + padding.left / 2, desde: frame.x, hasta: frame.x + padding.left, valor: E(padding.left), tipo: "padding" });
  }
  if (padding.right > 0) {
    const desde = frame.x + frame.width - padding.right;
    ejeX.push({ x: desde + padding.right / 2, desde, hasta: frame.x + frame.width, valor: E(padding.right), tipo: "padding" });
  }
  if (padding.top > 0) {
    ejeY.push({ y: frame.y + padding.top / 2, desde: frame.y, hasta: frame.y + padding.top, valor: E(padding.top), tipo: "padding" });
  }
  if (padding.bottom > 0) {
    const desde = frame.y + frame.height - padding.bottom;
    ejeY.push({ y: desde + padding.bottom / 2, desde, hasta: frame.y + frame.height, valor: E(padding.bottom), tipo: "padding" });
  }
  for (const g of gaps) {
    if (direccion === "HORIZONTAL") {
      ejeX.push({ x: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: spacingAuto ? "Auto" : E(g.width), tipo: "spacing" });
    } else {
      ejeY.push({ y: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: spacingAuto ? "Auto" : E(g.height), tipo: "spacing" });
    }
  }
  return { ejeX, ejeY };
}
