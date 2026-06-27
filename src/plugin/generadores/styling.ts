import type { InventoryRow, TextType, GradientData } from "../modelo/tipos.ts";
import { verticalFrame, horizontalFrame, text, valueText, keyText, variableChip, themedFill, BORDER_PILL } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { hexToRgb } from "../utils/color.ts";
import { formatSpacing, currentUnit } from "../utils/espaciado.ts";

const GRAY_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 }; // #6B7280
const PREVIEW_WIDTH = 760; // wrap width of the sample text
const MUESTRA = "The quick brown fox jumps over the lazy dog";

// Small gray text for the description/note under each subsection title.
async function notaTabla(content: string): Promise<TextNode> {
  const t = await text(content, 14);
  t.fills = [{ type: "SOLID", color: GRAY_DESC }];
  return t;
}

// Base card of an entry: border + radius + padding.
function entryCard(name: string): FrameNode {
  const card = verticalFrame(name, 16);
  card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 16;
  card.cornerRadius = 8;
  card.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  card.strokeWeight = 1;
  card.fills = themedFill(themeVars().bgSpec);
  return card;
}

// key→value row: key (gray) + value. `valueWidth` fixes the width and wraps.
async function kvRow(key: string, value: string, valueWidth?: number): Promise<FrameNode> {
  const f = horizontalFrame("kv", 8);
  f.counterAxisAlignItems = "MIN";
  f.appendChild(await keyText(`${key}:`));
  const v = await valueText(value);
  if (valueWidth !== undefined) { v.textAutoResize = "HEIGHT"; v.resize(valueWidth, v.height); }
  f.appendChild(v);
  return f;
}

// "Applied as / Applied to" at the foot of each entry (where it's used).
async function appliedIn(row: InventoryRow): Promise<FrameNode> {
  const b = verticalFrame("appliedTo", 4);
  b.appendChild(await kvRow("Applied as", row.appliedAs));
  b.appendChild(await kvRow("Applied to", row.appliedTo, 600));
  return b;
}

function lhText(lh: TextType["lineHeight"]): string | undefined {
  if (!lh) return undefined;
  if (lh.unit === "auto") return "Auto";
  if (lh.unit === "percent") return `${lh.value}%`;
  return formatSpacing(lh.value ?? 0, currentUnit(), true);
}
function lsText(ls: TextType["letterSpacing"]): string | undefined {
  if (!ls) return undefined;
  if (ls.unit === "percent") return `${ls.value}%`;
  return formatSpacing(ls.value, currentUnit(), true);
}

// Gradient paint from the captured stops/transform.
function paintGradiente(g: GradientData): GradientPaint {
  return {
    type: g.type as GradientPaint["type"],
    gradientTransform: (g.gradientTransform ?? [[1, 0, 0], [0, 1, 0]]) as Transform,
    gradientStops: g.gradientStops.map((s) => ({ position: s.position, color: s.color })),
  };
}

// Color entry: large swatch (solid or gradient) + name (ChipVar) + hex, with applied-where below.
async function colorEntry(row: InventoryRow): Promise<FrameNode> {
  const card = entryCard(`${row.table}: ${row.name}`);
  const top = horizontalFrame("top", 16);
  top.counterAxisAlignItems = "CENTER";
  const sw = figma.createRectangle();
  sw.resize(56, 56);
  sw.cornerRadius = 8;
  if (row.swatchHex) sw.fills = [{ type: "SOLID", color: hexToRgb(row.swatchHex) }];
  else if (row.gradient) sw.fills = [paintGradiente(row.gradient)];
  else sw.fills = [];
  sw.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  sw.strokeWeight = 1;
  top.appendChild(sw);
  const info = verticalFrame("info", 6);
  info.appendChild(await variableChip(row.name));
  if (row.swatchHex) info.appendChild(await valueText(row.swatchHex));
  else if (row.gradient) info.appendChild(await valueText("Gradient"));
  top.appendChild(info);
  card.appendChild(top);
  if (row.appliedTo) card.appendChild(await appliedIn(row));
  return card;
}

// Text-style entry: properties (left) + preview in the real style (right), applied-where below.
async function textEntry(row: InventoryRow): Promise<FrameNode> {
  const card = entryCard(`text: ${row.name}`);
  const top = horizontalFrame("top", 48);
  top.counterAxisAlignItems = "MIN";
  const t = row.type;

  const props = verticalFrame("props", 6);
  if (t) {
    props.appendChild(await kvRow("Font family", t.family));
    props.appendChild(await kvRow("Font weight", t.style));
    props.appendChild(await kvRow("Font size", formatSpacing(t.size, currentUnit(), true)));
    const lh = lhText(t.lineHeight);
    if (lh) props.appendChild(await kvRow("Line height", lh));
    const ls = lsText(t.letterSpacing);
    if (ls) props.appendChild(await kvRow("Letter spacing", ls));
  }
  top.appendChild(props);

  const right = verticalFrame("preview", 12);
  right.appendChild(await variableChip(row.name));
  if (t) {
    const muestra = await text(MUESTRA, t.size, { family: t.family, style: t.style });
    if (t.lineHeight) {
      muestra.lineHeight = t.lineHeight.unit === "auto" ? { unit: "AUTO" }
        : { value: t.lineHeight.value ?? 0, unit: t.lineHeight.unit === "percent" ? "PERCENT" : "PIXELS" };
    }
    if (t.letterSpacing) {
      muestra.letterSpacing = { value: t.letterSpacing.value, unit: t.letterSpacing.unit === "percent" ? "PERCENT" : "PIXELS" };
    }
    muestra.textAutoResize = "HEIGHT";
    muestra.resize(PREVIEW_WIDTH, muestra.height);
    right.appendChild(muestra);
  }
  top.appendChild(right);

  card.appendChild(top);
  if (row.appliedTo) card.appendChild(await appliedIn(row));
  return card;
}

// Subsection: title + description (+ note) + list of entries (cards).
async function subsection(title: string, description: string, rows: InventoryRow[], empty: string, frameName: string, note?: string): Promise<FrameNode> {
  const sub = verticalFrame(frameName, 16);
  const head = verticalFrame("head", 8);
  head.appendChild(await text(title, 36));
  head.appendChild(await notaTabla(description));
  if (note) head.appendChild(await notaTabla(`Note: ${note}`));
  sub.appendChild(head);
  if (rows.length === 0) {
    sub.appendChild(await text(empty, 16));
    return sub;
  }
  const lista = verticalFrame("entries", 16);
  for (const row of rows) {
    lista.appendChild(row.table === "text" ? await textEntry(row) : await colorEntry(row));
  }
  sub.appendChild(lista);
  return sub;
}

// Generates the Styling Inventory output with the Variables, Color and Text styles tables.
export async function generateStyling(name: string, rows: InventoryRow[]): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(name, 64));
  spec.appendChild(await stylingSection(name, rows));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds only the Styling Inventory section (without Specifications or node title).
// `total`: catalog of all the document's styles (without applied-where) instead
// of just the selected element's.
export async function stylingSection(name: string, rows: InventoryRow[], total = false): Promise<FrameNode> {
  const section = verticalFrame("Styling Inventory", 64);
  section.appendChild(await text("Styling Inventory", 48));

  const variables = rows.filter((f) => f.table === "variable");
  const colorStyles = rows.filter((f) => f.table === "color");
  const textStyles = rows.filter((f) => f.table === "text");

  // Note when a color token has neither swatch nor gradient (e.g. an image).
  const sinSwatch = "non-solid paints (e.g. image fills) don't show a color swatch";
  const variablesNote = variables.some((f) => !f.swatchHex && !f.gradient) ? sinSwatch : undefined;
  const noteColor = colorStyles.some((f) => !f.swatchHex && !f.gradient) ? sinSwatch : undefined;

  const desc = total
    ? {
        v: "All color variables (design tokens) in the document, with their resolved value.",
        c: "All color styles in the document.",
        t: "All text styles in the document.",
      }
    : {
        v: "Variables (design tokens) bound to this element and its layers, with their resolved value.",
        c: "Color styles applied to the fills and strokes of this element.",
        t: "Text styles applied to the text layers of this element.",
      };

  section.appendChild(await subsection("Variables", desc.v, variables, "No variables", "variablesTable", variablesNote));
  section.appendChild(await subsection("Color styles", desc.c, colorStyles, "No color styles", "colorStylesTable", noteColor));
  section.appendChild(await subsection("Text styles", desc.t, textStyles, "No text styles", "textStylesTable"));

  return section;
}
