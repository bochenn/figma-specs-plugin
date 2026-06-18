// Helpers compartidos para construir frames con Auto Layout. Tocan figma.*.

import { varsTema } from "../utils/variables-tema.ts";
import { anchoContenedor } from "../utils/columnas.ts";

// Fill SOLID atado a una variable de tema (se re-tematiza al cambiar el modo en Figma).
export function fillTematizado(variable: Variable): Paint[] {
  const base: SolidPaint = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  return [figma.variables.setBoundVariableForPaint(base, "color", variable)];
}

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

export const FONT_REG: FontName = { family: "Inter", style: "Regular" };
export const FONT_BOLD: FontName = { family: "Inter", style: "Bold" };
export const FONT_SEMI: FontName = { family: "Inter", style: "Semi Bold" };
export const FONT_MONO: FontName = { family: "JetBrains Mono", style: "Regular" };

const fontsCache = new Map<string, FontName>();

// Carga una fuente; si no está disponible en el archivo, cae a Inter Regular.
export async function cargarFont(font: FontName): Promise<FontName> {
  const key = `${font.family}|${font.style}`;
  const cached = fontsCache.get(key);
  if (cached) return cached;
  let real = font;
  try {
    await figma.loadFontAsync(font);
  } catch {
    real = FONT_REG;
    await figma.loadFontAsync(FONT_REG);
  }
  fontsCache.set(key, real);
  return real;
}

// Crea un texto. fontSize en px; `font` opcional (default Inter Regular), con fallback.
export async function texto(contenido: string, fontSize: number, font: FontName = FONT_REG): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await cargarFont(font);
  t.characters = contenido;
  t.fontSize = fontSize;
  t.fills = fillTematizado(varsTema().texto);
  return t;
}

const GAP_COL = 64;

// Acomoda los ítems en `columnas` columnas: un contenedor wrap de ancho fijo,
// con cada ítem fijado al ancho máximo del grupo (≥ su ancho natural → sin overflow).
export function enColumnas(items: FrameNode[], columnas: number): FrameNode {
  let maxW = 0;
  for (const it of items) maxW = Math.max(maxW, it.width);

  const cont = figma.createFrame();
  cont.name = "Columns";
  cont.layoutMode = "HORIZONTAL";
  cont.layoutWrap = "WRAP";
  cont.itemSpacing = GAP_COL;
  cont.counterAxisSpacing = GAP_COL;
  cont.counterAxisSizingMode = "AUTO";
  cont.fills = [];
  cont.primaryAxisSizingMode = "FIXED";
  cont.resize(anchoContenedor(columnas, maxW, GAP_COL), 1);

  for (const it of items) {
    cont.appendChild(it);
    it.layoutSizingHorizontal = "FIXED";
    it.resize(maxW, it.height);
  }
  return cont;
}

// Arma una tabla: text nodes de todas las celdas, alineadas fijando cada celda
// al ancho máximo de su columna (≥ su ancho natural → sin overflow). Header arriba.
export async function tablaDe(headers: string[], filas: string[][]): Promise<FrameNode> {
  const registros = [headers, ...filas];
  const ncols = headers.length;

  const celdas: TextNode[][] = [];
  for (const registro of registros) {
    const row: TextNode[] = [];
    for (let c = 0; c < ncols; c++) row.push(await texto(registro[c] ?? "", 14));
    celdas.push(row);
  }

  const maxW: number[] = [];
  for (let c = 0; c < ncols; c++) {
    let m = 0;
    for (const row of celdas) m = Math.max(m, row[c].width);
    maxW.push(m);
  }

  const cont = frameVertical("Table", 8);
  for (const row of celdas) {
    const filaFrame = frameHorizontal("Row", 24);
    for (let c = 0; c < ncols; c++) {
      filaFrame.appendChild(row[c]);
      row[c].layoutSizingHorizontal = "FIXED";
      row[c].resize(maxW[c], row[c].height);
    }
    cont.appendChild(filaFrame);
  }
  return cont;
}
