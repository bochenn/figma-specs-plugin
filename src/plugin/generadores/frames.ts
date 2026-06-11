// Helpers compartidos para construir frames con Auto Layout. Tocan figma.*.

import { temaActual } from "../utils/tema.ts";

// Crea un frame con Auto Layout vertical configurado.
export function frameVertical(nombre: string, gap: number, padding = 0): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = padding;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un frame con Auto Layout horizontal configurado.
export function frameHorizontal(nombre: string, gap: number): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "HORIZONTAL";
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un texto. fontSize en px; carga la fuente antes de escribir.
export async function texto(contenido: string, fontSize: number): Promise<TextNode> {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.fontName = { family: "Inter", style: "Regular" };
  t.characters = contenido;
  t.fontSize = fontSize;
  t.fills = [{ type: "SOLID", color: temaActual().texto }];
  return t;
}
