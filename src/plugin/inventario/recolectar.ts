import type { NodeLike, StyleEntry, GradientData } from "../modelo/tipos.ts";
import { hexOfColor } from "../variables/modes.ts";

// Hex of the first SOLID paint in a list, or undefined.
function solidHex(paints: NodeLike["fills"]): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? hexOfColor(p.color) : undefined;
}

// Data of the first gradient paint in a list, or undefined.
function gradienteDe(paints: NodeLike["fills"]): GradientData | undefined {
  return paints?.find((f) => f.gradient)?.gradient;
}

// Emits the style/variable entries of a single node (variable > style priority).
function emitir(node: NodeLike, entries: StyleEntry[]): void {
  const appliedFill = node.type === "TEXT" ? "Text color" : "Background color";

  if (node.fillVariableName) {
    entries.push({ table: "variable", name: node.fillVariableName, appliedAs: appliedFill, layer: node.name, swatchHex: solidHex(node.fills) });
  } else if (node.fillStyleName) {
    const entry: StyleEntry = { table: "color", name: node.fillStyleName, appliedAs: appliedFill, layer: node.name };
    const hex = solidHex(node.fills);
    if (hex) entry.swatchHex = hex;
    else { const g = gradienteDe(node.fills); if (g) entry.gradient = g; }
    entries.push(entry);
  }

  if (node.strokeVariableName) {
    entries.push({ table: "variable", name: node.strokeVariableName, appliedAs: "Border color", layer: node.name, swatchHex: solidHex(node.strokes) });
  } else if (node.strokeStyleName) {
    const entry: StyleEntry = { table: "color", name: node.strokeStyleName, appliedAs: "Border color", layer: node.name };
    const hex = solidHex(node.strokes);
    if (hex) entry.swatchHex = hex;
    else { const g = gradienteDe(node.strokes); if (g) entry.gradient = g; }
    entries.push(entry);
  }

  if (node.textStyleName) {
    const entry: StyleEntry = { table: "text", name: node.textStyleName, appliedAs: "Text style", layer: node.name };
    // Captures the style's typography (for the preview and the properties list).
    if (node.fontFamily && typeof node.fontSize === "number") {
      entry.type = {
        family: node.fontFamily,
        style: node.fontStyle ?? "Regular",
        size: node.fontSize,
        lineHeight: node.lineHeight,
        letterSpacing: node.letterSpacing,
      };
    }
    entries.push(entry);
  }
}

// Visits a node: emits its styles and descends through its children, also inside
// instances (to inventory the tokens the nested components use).
function visitar(node: NodeLike, entries: StyleEntry[]): void {
  emitir(node, entries);
  for (const child of node.children ?? []) {
    visitar(child, entries);
  }
}

// Collects all the style entries of the selection (root + descendants).
export function collectStyles(root: NodeLike): StyleEntry[] {
  const entries: StyleEntry[] = [];
  visitar(root, entries);
  return entries;
}
