import type { NodeLike, Attribute, LineHeightVal, LetterSpacingVal } from "../modelo/tipos.ts";
import { formatColor, currentColorFormat } from "./color.ts";
import { currentRawFormat, currentShowRaw, currentPreference } from "./valores.ts";
import { formatSpacing, currentUnit } from "./espaciado.ts";

// Line height for its own row: "Auto", "150%" or "20px".
function textLineHeight(lh?: LineHeightVal): string | undefined {
  if (!lh) return undefined;
  if (lh.unit === "auto") return "Auto";
  if (lh.unit === "percent") return `${lh.value}%`;
  return formatSpacing(lh.value ?? 0, currentUnit(), true);
}

// Tracking (letter-spacing) for its own row: "0%" or "0.5px".
function textLetterSpacing(ls?: LetterSpacingVal): string | undefined {
  if (!ls) return undefined;
  if (ls.unit === "percent") return `${ls.value}%`;
  return formatSpacing(ls.value, currentUnit(), true);
}

// Horizontal text alignment as readable text.
function textAlignVal(value: string): string {
  if (value === "CENTER") return "Center";
  if (value === "RIGHT") return "Right";
  if (value === "JUSTIFIED") return "Justified";
  return "Left"; // "LEFT"
}

// Case transformation (text case) as readable text.
function textCaseVal(value: string): string {
  if (value === "UPPER") return "Uppercase";
  if (value === "LOWER") return "Lowercase";
  if (value === "TITLE") return "Title case";
  if (value === "SMALL_CAPS" || value === "SMALL_CAPS_FORCED") return "Small caps";
  return "Original"; // "ORIGINAL"
}

// Converts a color channel (0..1) to two hex digits.
function canalHex(canal: number): string {
  return Math.round(canal * 255).toString(16).padStart(2, "0").toUpperCase();
}

function aHex(color: { r: number; g: number; b: number }): string {
  return "#" + canalHex(color.r) + canalHex(color.g) + canalHex(color.b);
}

// Color attribute: variable or style (per the preference when both exist),
// with the resolved value formatted per the Custom Value Formats options;
// hardcoded if there's none. Returns undefined if there's no resolved color.
export function attributeColor(
  key: string,
  opts: { hex?: string; variableName?: string; styleName?: string },
): Attribute | undefined {
  const hex = opts.hex;
  if (!hex) return undefined;
  const named = (value: string, format: "VARIABLE" | "STYLE"): Attribute => {
    const a: Attribute = { key, value, format, swatchHex: hex };
    if (currentShowRaw()) a.rawValue = formatColor(hex, currentRawFormat());
    return a;
  };
  if (currentPreference() === "STYLE" && opts.styleName) return named(opts.styleName, "STYLE");
  if (opts.variableName) return named(opts.variableName, "VARIABLE");
  if (opts.styleName) return named(opts.styleName, "STYLE");
  return { key, value: formatColor(hex, currentColorFormat()), format: "HARDCODED", swatchHex: hex };
}

// Returns the hex of the first SOLID paint in a list, or undefined.
export function solidHex(
  paints: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }> | undefined,
): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? aHex(p.color) : undefined;
}

// True if the property is toggled off: there are paints and ALL have visible false.
// ponytail: mixed lists (some paint on, some off) count as visible.
export function paintsOff(paints: ReadonlyArray<{ visible?: boolean }> | undefined): boolean {
  return !!paints && paints.length > 0 && paints.every((p) => p.visible === false);
}

type StrokeWeights = { top: number; right: number; bottom: number; left: number };

// Sides code (T/R/B/L order) → UI3 border icon name.
const BORDER_ICONS: Record<string, string> = {
  "": "border-none",
  T: "border-top", R: "border-right", B: "border-bottom", L: "border-left",
  TR: "border-top-right", TB: "border-top-bottom", TL: "border-top-left",
  RB: "border-bottom-right", RL: "border-left-right", BL: "border-bottom-left",
  TRB: "border-top-right-bottom", TRL: "border-top-left-right",
  TBL: "border-top-left-bottom", RBL: "border-bottom-left-right",
  TRBL: "border",
};

// UI3 icon key for the sides that have a stroke (weight > 0).
export function borderIconKey(w: StrokeWeights): string {
  const code = (w.top > 0 ? "T" : "") + (w.right > 0 ? "R" : "") + (w.bottom > 0 ? "B" : "") + (w.left > 0 ? "L" : "");
  return BORDER_ICONS[code];
}

// Stroke weight/style summary: "1px", "top 1px · left 2px", with "· Dashed" if dashed.
export function borderDetail(w: StrokeWeights, dashed?: boolean): string {
  const sides: [string, number][] = [["top", w.top], ["right", w.right], ["bottom", w.bottom], ["left", w.left]];
  const activos = sides.filter(([, peso]) => peso > 0);
  let texto: string;
  if (activos.length === 0) texto = "";
  else if (activos.every(([, peso]) => peso === activos[0][1])) texto = formatSpacing(activos[0][1], currentUnit(), true);
  else texto = activos.map(([lado, peso]) => `${lado} ${formatSpacing(peso, currentUnit(), true)}`).join(" · ");
  if (dashed) texto = texto ? `${texto} · Dashed` : "Dashed";
  return texto;
}

// Maps Figma's resizing mode to its label ("FIXED" → "Fixed", etc.).
function modoDeSizing(s?: string): string | undefined {
  if (s === "HUG") return "Hug";
  if (s === "FILL") return "Fill";
  if (s === "FIXED") return "Fixed";
  return undefined;
}

// Dimension attribute: VARIABLE (name + rawValue) if there's a bound variable;
// HARDCODED (bare value) otherwise. `mode` adds the resizing prefix if present.
function dimensionAtributo(key: string, px: number, varName?: string, mode?: string): Attribute {
  const fmtValue = formatSpacing(px, currentUnit(), true);
  const a: Attribute = varName
    ? { key, value: varName, format: "VARIABLE", rawValue: fmtValue }
    : { key, value: fmtValue, format: "HARDCODED" };
  const prefix = modoDeSizing(mode);
  if (prefix) a.prefix = prefix;
  return a;
}

// Reads the visual attributes present on a node.
export function readAttributes(node: NodeLike): Attribute[] {
  const attributes: Attribute[] = [];

  const bg = attributeColor("background-color", {
    hex: solidHex(node.fills),
    variableName: node.fillVariableName,
    styleName: node.fillStyleName,
  });
  if (bg) {
    if (paintsOff(node.fills)) bg.visibilityOff = true;
    attributes.push(bg);
  }

  const bd = attributeColor("border-color", {
    hex: solidHex(node.strokes),
    variableName: node.strokeVariableName,
    styleName: node.strokeStyleName,
  });
  if (bd) {
    if (paintsOff(node.strokes)) bd.visibilityOff = true;
    if (node.strokeWeights) {
      bd.icon = borderIconKey(node.strokeWeights);
      const detail = borderDetail(node.strokeWeights, node.strokeDashed);
      if (detail) bd.detail = detail;
    }
    attributes.push(bd);
  }

  if (typeof node.width === "number") {
    attributes.push(dimensionAtributo("width", node.width, node.widthVariableName, node.layoutSizingHorizontal));
  }

  if (typeof node.height === "number" && node.heightVariableName) {
    attributes.push(dimensionAtributo("height", node.height, node.heightVariableName, node.layoutSizingVertical));
  }

  if (typeof node.opacity === "number" && node.opacity < 1) {
    attributes.push({ key: "opacity", value: Math.round(node.opacity * 100) + "%", format: "HARDCODED" });
  }

  if (node.fontFamily && typeof node.fontSize === "number") {
    // Text Style: the applied token, or "N/A" if the text has no assigned style.
    attributes.push(node.textStyleName
      ? { key: "Text Style", value: node.textStyleName, format: "STYLE" }
      : { key: "Text Style", value: "N/A", format: "HARDCODED" });
    // Typography detail: one property per row.
    attributes.push({ key: "Font Family", value: node.fontFamily, format: "HARDCODED" });
    if (node.fontStyle) attributes.push({ key: "Font Weight", value: node.fontStyle, format: "HARDCODED" });
    attributes.push({ key: "Font Size", value: formatSpacing(node.fontSize, currentUnit(), true), format: "HARDCODED" });
    const lh = textLineHeight(node.lineHeight);
    if (lh) attributes.push({ key: "Line Height", value: lh, format: "HARDCODED" });
    const ls = textLetterSpacing(node.letterSpacing);
    if (ls) attributes.push({ key: "Letter Spacing", value: ls, format: "HARDCODED" });
    if (node.textAlign) attributes.push({ key: "Alignment", value: textAlignVal(node.textAlign), format: "HARDCODED" });
    if (node.textCase) attributes.push({ key: "Case", value: textCaseVal(node.textCase), format: "HARDCODED" });
  }

  return attributes;
}
