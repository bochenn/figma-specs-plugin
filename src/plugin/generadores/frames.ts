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
// Monospace: SF Mono primero, JetBrains Mono como fallback (y al final Inter, vía cargarFont).
export const FONT_MONO: FontName[] = [
  { family: "SF Mono", style: "Regular" },
  { family: "JetBrains Mono", style: "Regular" },
];

const fontsCache = new Map<string, FontName>();

// Carga la primera fuente disponible de la lista (o una sola); si ninguna está
// instalada en el archivo, cae a Inter Regular. Cachea por la cadena pedida.
export async function cargarFont(font: FontName | FontName[]): Promise<FontName> {
  const lista = Array.isArray(font) ? font : [font];
  const key = lista.map((f) => `${f.family}|${f.style}`).join(">");
  const cached = fontsCache.get(key);
  if (cached) return cached;
  for (const f of lista) {
    try {
      await figma.loadFontAsync(f);
      fontsCache.set(key, f);
      return f;
    } catch {
      // probar la siguiente de la cadena
    }
  }
  await figma.loadFontAsync(FONT_REG);
  fontsCache.set(key, FONT_REG);
  return FONT_REG;
}

// Crea un texto. fontSize en px; `font` opcional (default Inter Regular); acepta una
// cadena de fallback (FontName[]) y cae a Inter si ninguna está disponible.
export async function texto(contenido: string, fontSize: number, font: FontName | FontName[] = FONT_REG): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await cargarFont(font);
  t.characters = contenido;
  t.fontSize = fontSize;
  t.fills = fillTematizado(varsTema().texto);
  return t;
}

const BORDE_PILL: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB
const FONDO_CHIP: RGB = { r: 0.898, g: 0.906, b: 0.922 };  // #E5E7EB
const TEXTO_CHIP: RGB = { r: 0.2, g: 0.2, b: 0.2 };
const COLOR_CLAVE: RGB = { r: 0.420, g: 0.447, b: 0.502 }; // #6B7280
const COLOR_VALOR: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151

// Texto de la CLAVE de un spec (ej. "Breakpoint:"): monospace, gris #6B7280.
export async function textoClave(s: string): Promise<TextNode> {
  const t = await texto(s, 12, FONT_MONO);
  t.fills = [{ type: "SOLID", color: COLOR_CLAVE }];
  return t;
}

// Texto del VALOR de un spec (ej. "Mobile"): monospace, gris oscuro #374151.
export async function textoValor(s: string): Promise<TextNode> {
  const t = await texto(s, 12, FONT_MONO);
  t.fills = [{ type: "SOLID", color: COLOR_VALOR }];
  return t;
}

// Chip gris para una variable/style (monospace). Compartido entre secciones.
export async function chipVariable(nombre: string): Promise<FrameNode> {
  const c = frameHorizontal("ChipVar", 0);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = c.paddingRight = 5;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: FONDO_CHIP }];
  const t = await texto(nombre, 11, FONT_MONO);
  t.fills = [{ type: "SOLID", color: TEXTO_CHIP }];
  c.appendChild(t);
  return c;
}

// Fila en pill con borde (cada atributo/propiedad). Appendea los nodos provistos.
export function filaPill(nodos: SceneNode[]): FrameNode {
  const fila = frameHorizontal("Fila", 6);
  fila.counterAxisAlignItems = "CENTER";
  fila.paddingTop = fila.paddingBottom = 6;
  fila.paddingLeft = fila.paddingRight = 8;
  fila.cornerRadius = 4;
  fila.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  fila.strokeWeight = 1;
  for (const n of nodos) fila.appendChild(n);
  return fila;
}

// Card de entrada: header (con divisor inferior) + body (padding 16, gap 8).
export function tarjeta(headerNodos: SceneNode[], filas: FrameNode[]): FrameNode {
  const card = frameVertical("Card", 0);
  card.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.fills = fillTematizado(varsTema().fondoSpec);
  card.clipsContent = true;

  const header = frameHorizontal("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.paddingTop = header.paddingBottom = 8;
  header.paddingLeft = header.paddingRight = 16;
  header.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;
  for (const n of headerNodos) header.appendChild(n);
  card.appendChild(header);
  header.layoutSizingHorizontal = "FILL";

  const body = frameVertical("Body", 8);
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16;
  for (const f of filas) body.appendChild(f);
  card.appendChild(body);
  body.layoutSizingHorizontal = "FILL";
  return card;
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
