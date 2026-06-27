// Shared helpers to build Auto Layout frames. They touch figma.*.

import { themeVars } from "../utils/variables-tema.ts";
import { containerWidth } from "../utils/columnas.ts";

// SOLID fill bound to a theme variable (re-themes when the mode changes in Figma).
export function themedFill(variable: Variable): Paint[] {
  const base: SolidPaint = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  return [figma.variables.setBoundVariableForPaint(base, "color", variable)];
}

// Creates a frame with a configured vertical Auto Layout.
export function verticalFrame(name: string, gap: number, padding = 0): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = padding;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Creates a frame with a configured horizontal Auto Layout.
export function horizontalFrame(name: string, gap: number): FrameNode {
  const f = figma.createFrame();
  f.name = name;
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
// Inter Medium (with fallback to Regular via loadFont).
export const FONT_MEDIUM: FontName[] = [{ family: "Inter", style: "Medium" }, { family: "Inter", style: "Regular" }];
// Monospace: SF Mono first, JetBrains Mono as fallback (and finally Inter, via loadFont).
export const FONT_MONO: FontName[] = [
  { family: "SF Mono", style: "Regular" },
  { family: "JetBrains Mono", style: "Regular" },
];

const fontsCache = new Map<string, FontName>();

// Loads the first available font from the list (or a single one); if none is
// installed in the file, falls back to Inter Regular. Caches by the requested chain.
export async function loadFont(font: FontName | FontName[]): Promise<FontName> {
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
      // try the next one in the chain
    }
  }
  await figma.loadFontAsync(FONT_REG);
  fontsCache.set(key, FONT_REG);
  return FONT_REG;
}

// Creates a text. fontSize in px; `font` optional (default Inter Regular); accepts a
// fallback chain (FontName[]) and falls back to Inter if none is available.
export async function text(content: string, fontSize: number, font: FontName | FontName[] = FONT_REG): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await loadFont(font);
  t.characters = content;
  t.fontSize = fontSize;
  t.fills = themedFill(themeVars().text);
  // Full text style definition (leave nothing on "auto"): line-height
  // 1.5×, no tracking, aligned top-left, no decoration or transformation.
  t.lineHeight = { value: 150, unit: "PERCENT" };
  t.letterSpacing = { value: 0, unit: "PERCENT" };
  t.textAlignHorizontal = "LEFT";
  t.textAlignVertical = "TOP";
  t.textDecoration = "NONE";
  t.textCase = "ORIGINAL";
  return t;
}

// Card header text: Inter Medium 16, line-height 32px, no tracking.
export async function cardHeaderText(content: string): Promise<TextNode> {
  const t = await text(content, 16, FONT_MEDIUM);
  t.lineHeight = { value: 32, unit: "PIXELS" };
  t.letterSpacing = { value: 0, unit: "PERCENT" };
  return t;
}

export const BORDER_PILL: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB
const CHIP_BG: RGB = { r: 1, g: 0.878, b: 0.988 };       // #FFE0FC
const CHIP_TEXT: RGB = { r: 0.918, g: 0.063, b: 0.675 };   // #EA10AC
const COLOR_CLAVE: RGB = { r: 0.420, g: 0.447, b: 0.502 }; // #6B7280
const VALUE_COLOR: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151

// Spec KEY text (e.g. "Breakpoint:"): monospace, gray #6B7280.
export async function keyText(s: string): Promise<TextNode> {
  const t = await text(s, 12, FONT_MONO);
  t.fills = [{ type: "SOLID", color: COLOR_CLAVE }];
  return t;
}

// Spec VALUE text (e.g. "Mobile"): monospace, dark gray #374151.
export async function valueText(s: string): Promise<TextNode> {
  const t = await text(s, 12, FONT_MONO);
  t.fills = [{ type: "SOLID", color: VALUE_COLOR }];
  return t;
}

// Gray chip for a variable/style (monospace). Shared across sections.
export async function variableChip(name: string): Promise<FrameNode> {
  const c = horizontalFrame("ChipVar", 0);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = c.paddingRight = 5;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: CHIP_BG }];
  const t = await text(name, 11, FONT_MONO);
  t.fills = [{ type: "SOLID", color: CHIP_TEXT }];
  c.appendChild(t);
  return c;
}

// Bordered chip for a section name (e.g. "ANATOMY"): no fill, stroke #374151.
export async function sectionTag(label: string): Promise<FrameNode> {
  const chip = horizontalFrame("Tag", 0);
  chip.counterAxisAlignItems = "CENTER";
  chip.paddingTop = chip.paddingBottom = 6;
  chip.paddingLeft = chip.paddingRight = 16;
  chip.cornerRadius = 6;
  chip.fills = [];
  chip.strokes = [{ type: "SOLID", color: VALUE_COLOR }];
  chip.strokeWeight = 1;
  const t = await text(label.toUpperCase(), 12, FONT_SEMI);
  t.fills = [{ type: "SOLID", color: VALUE_COLOR }];
  t.letterSpacing = { value: 8, unit: "PERCENT" };
  chip.appendChild(t);
  return chip;
}

// Section descriptive paragraph (gray, fixed width with wrap). Goes below the tag.
export async function sectionParagraph(description: string, width = 720): Promise<TextNode> {
  const t = await text(description, 14);
  t.fills = [{ type: "SOLID", color: COLOR_CLAVE }];
  t.textAutoResize = "HEIGHT";
  t.resize(width, t.height);
  return t;
}

// Bordered pill row (each attribute/property). Appends the provided nodes.
export function pillRow(nodes: SceneNode[]): FrameNode {
  const row = horizontalFrame("itemValue", 6);
  row.counterAxisAlignItems = "CENTER";
  row.paddingTop = row.paddingBottom = 6;
  row.paddingLeft = row.paddingRight = 8;
  row.cornerRadius = 4;
  row.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  row.strokeWeight = 1;
  for (const n of nodes) row.appendChild(n);
  return row;
}

// Entry card: header (with bottom divider) + body (padding 16, gap 8).
export function card(headerNodes: SceneNode[], rows: FrameNode[]): FrameNode {
  const card = verticalFrame("Card", 0);
  card.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.fills = themedFill(themeVars().bgSpec);
  card.clipsContent = true;

  const header = horizontalFrame("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.paddingTop = header.paddingBottom = 8;
  header.paddingLeft = header.paddingRight = 16;
  header.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;
  for (const n of headerNodes) header.appendChild(n);
  card.appendChild(header);
  header.layoutSizingHorizontal = "FILL";

  const body = verticalFrame("Body", 8);
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16;
  for (const f of rows) body.appendChild(f);
  card.appendChild(body);
  body.layoutSizingHorizontal = "FILL";
  return card;
}

const GAP_COL = 64;

// Arranges the items in `columns` columns: a fixed-width wrap container,
// with each item set to the group's max width (≥ its natural width → no overflow).
export function inColumns(items: FrameNode[], columns: number): FrameNode {
  let maxW = 0;
  for (const it of items) maxW = Math.max(maxW, it.width);

  const container = figma.createFrame();
  container.name = "Columns";
  container.layoutMode = "HORIZONTAL";
  container.layoutWrap = "WRAP";
  container.itemSpacing = GAP_COL;
  container.counterAxisSpacing = GAP_COL;
  container.counterAxisSizingMode = "AUTO";
  container.fills = [];
  container.primaryAxisSizingMode = "FIXED";
  container.resize(containerWidth(columns, maxW, GAP_COL), 1);

  for (const it of items) {
    container.appendChild(it);
    it.layoutSizingHorizontal = "FIXED";
    it.resize(maxW, it.height);
  }
  return container;
}

// Builds a table: text nodes for all cells, aligned by setting each cell
// to its column's max width (≥ its natural width → no overflow). Header on top.
export async function tableOf(headers: string[], rows: string[][]): Promise<FrameNode> {
  const registros = [headers, ...rows];
  const ncols = headers.length;

  const celdas: TextNode[][] = [];
  for (const registro of registros) {
    const row: TextNode[] = [];
    for (let c = 0; c < ncols; c++) row.push(await text(registro[c] ?? "", 14));
    celdas.push(row);
  }

  const maxW: number[] = [];
  for (let c = 0; c < ncols; c++) {
    let m = 0;
    for (const row of celdas) m = Math.max(m, row[c].width);
    maxW.push(m);
  }

  const container = verticalFrame("Table", 8);
  for (const row of celdas) {
    const frameRow = horizontalFrame("Row", 24);
    for (let c = 0; c < ncols; c++) {
      frameRow.appendChild(row[c]);
      row[c].layoutSizingHorizontal = "FIXED";
      row[c].resize(maxW[c], row[c].height);
    }
    container.appendChild(frameRow);
  }
  return container;
}
