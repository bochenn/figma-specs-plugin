import type { NodeLike, LayoutSpec } from "../modelo/tipos.ts";
import { traverseTree } from "../traversal/recorrer.ts";
import { attributeColor, solidHex, paintsOff, borderIconKey, borderDetail } from "../utils/atributos.ts";

// Translates Figma's alignment value to readable text.
export function alignment(value: string | undefined): string {
  switch (value) {
    case "CENTER": return "Center";
    case "MAX": return "End";
    case "SPACE_BETWEEN": return "Space between";
    case "BASELINE": return "Baseline";
    default: return "Start"; // "MIN" y ausentes
  }
}

// Translates Figma's resizing value to readable text.
export function resizing(value: string | undefined): string {
  switch (value) {
    case "FILL": return "Fill";
    case "HUG": return "Hug";
    default: return "Fixed"; // "FIXED" y ausentes
  }
}

// Text style of the first direct TEXT child (to show it in the exhibit).
export function textStyleOf(node: NodeLike): { name?: string; summary?: string } | undefined {
  const txt = (node.children ?? []).find((c) => c.type === "TEXT");
  if (!txt) return undefined;
  if (txt.textStyleName) return { name: txt.textStyleName };
  if (txt.fontFamily) return { summary: `${txt.fontFamily} ${txt.fontStyle ?? ""} · ${txt.fontSize ?? ""}`.replace(/\s+/g, " ").trim() };
  return undefined;
}

// Builds the LayoutSpec of a single Auto Layout node.
export function layoutSpecOf(node: NodeLike, depth = 0): LayoutSpec {
  const fill = attributeColor("fill", { hex: solidHex(node.fills), variableName: node.fillVariableName, styleName: node.fillStyleName });
  if (fill && paintsOff(node.fills)) fill.visibilityOff = true;
  const stroke = attributeColor("stroke", { hex: solidHex(node.strokes), variableName: node.strokeVariableName, styleName: node.strokeStyleName });
  if (stroke && paintsOff(node.strokes)) stroke.visibilityOff = true;
  if (stroke && node.strokeWeights) {
    stroke.icon = borderIconKey(node.strokeWeights);
    const detail = borderDetail(node.strokeWeights, node.strokeDashed);
    if (detail) stroke.detail = detail;
  }
  const spec: LayoutSpec = {
    elementName: node.name,
    type: node.type,
    direction: node.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : node.layoutMode === "GRID" ? "GRID" : "VERTICAL",
    primaryAlignment: alignment(node.primaryAxisAlignItems),
    counterAlignment: alignment(node.counterAxisAlignItems),
    resizingHorizontal: resizing(node.layoutSizingHorizontal),
    resizingVertical: resizing(node.layoutSizingVertical),
    padding: {
      left: node.paddingLeft ?? 0,
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
    },
    itemSpacing: node.itemSpacing ?? 0,
    wrap: node.layoutWrap === "WRAP",
    spacingAuto: node.primaryAxisAlignItems === "SPACE_BETWEEN",
    grids: node.layoutGrids ?? [],
    spacingVars: node.spacingVars ?? {},
    width: node.width ?? 0,
    height: node.height ?? 0,
  };
  if (node.widthVariableName) spec.widthVar = node.widthVariableName;
  if (node.heightVariableName) spec.heightVar = node.heightVariableName;
  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) spec.cornerRadius = node.cornerRadius;
  if (node.cornerRadiusVar) spec.cornerRadiusVar = node.cornerRadiusVar;
  if (fill) spec.fill = fill;
  if (stroke) spec.stroke = stroke;
  if (depth > 0) spec.depth = depth;
  if (node.layoutMode === "GRID") {
    if (typeof node.gridColumnCount === "number") spec.gridColumns = node.gridColumnCount;
    if (typeof node.gridRowCount === "number") spec.gridRows = node.gridRowCount;
    if (typeof node.gridColumnGap === "number") spec.gridColumnGap = node.gridColumnGap;
    if (typeof node.gridRowGap === "number") spec.gridRowGap = node.gridRowGap;
    if (node.gridColumnGapVar) spec.gridColumnGapVar = node.gridColumnGapVar;
    if (node.gridRowGapVar) spec.gridRowGapVar = node.gridRowGapVar;
  }
  const ts = textStyleOf(node);
  if (ts) spec.textStyle = ts;
  return spec;
}

// Serializes the layout config (to compare across variants).
export function layoutKey(spec: LayoutSpec): string {
  const p = spec.padding;
  return `${spec.direction}|${spec.primaryAlignment}|${spec.counterAlignment}|${spec.resizingHorizontal}|${spec.resizingVertical}|L${p.left}T${p.top}R${p.right}B${p.bottom}|gap${spec.itemSpacing}`;
}

// Produces one LayoutSpec per layer of the selection (root + every descendant,
// not only Auto Layout ones), so leaf layers (texts, icons) are documented too.
export function extractLayout(root: NodeLike, itemize = false): LayoutSpec[] {
  return traverseTree(root, itemize).map((r) => layoutSpecOf(r.node, r.depth));
}
