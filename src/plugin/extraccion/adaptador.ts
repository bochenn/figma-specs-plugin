import type { NodeLike, PaintLike } from "../modelo/tipos.ts";
import { gridSpecOf } from "../utils/grilla.ts";
import { stripCollectionPrefix } from "../utils/nombre-variable.ts";

// Converts a Figma Paint to PaintLike: solid color or gradient stops.
function paintLike(f: Paint): PaintLike {
  if (f.type === "SOLID") return { type: f.type, color: f.color };
  if (f.type.startsWith("GRADIENT_")) {
    const g = f as GradientPaint;
    return {
      type: f.type,
      gradient: {
        type: f.type,
        gradientStops: g.gradientStops.map((s) => ({ position: s.position, color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a } })),
        gradientTransform: g.gradientTransform.map((row) => [...row]),
      },
    };
  }
  return { type: f.type };
}

// Resolves a variable to "Collection/Variable" (or just its name if there's no collection).
function variableNameVal(id: string): string | undefined {
  const variable = figma.variables.getVariableById(id);
  if (!variable) return undefined;
  const col = figma.variables.getVariableCollectionById(variable.variableCollectionId);
  return col ? `${stripCollectionPrefix(col.name)}/${variable.name}` : variable.name;
}

// Converts a real Figma node into NodeLike (only what the pure modules read).
export function toNodeLike(node: SceneNode): NodeLike {
  const base: NodeLike = { id: node.id, name: node.name, type: node.type };

  if ("width" in node) base.width = node.width;
  if ("height" in node) base.height = node.height;
  if ("opacity" in node) base.opacity = node.opacity;
  if ("fills" in node && Array.isArray(node.fills)) {
    base.fills = node.fills.map(paintLike);
  }
  if ("strokes" in node && Array.isArray(node.strokes)) {
    base.strokes = node.strokes.map(paintLike);
  }
  if (node.type === "INSTANCE") {
    const main = (node as InstanceNode).mainComponent;
    if (main) base.mainComponentName = main.name;
  }
  if ("layoutMode" in node && (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL" || node.layoutMode === "GRID")) {
    base.layoutMode = node.layoutMode;
    base.primaryAxisAlignItems = node.primaryAxisAlignItems;
    base.counterAxisAlignItems = node.counterAxisAlignItems;
    base.paddingLeft = node.paddingLeft;
    base.paddingTop = node.paddingTop;
    base.paddingRight = node.paddingRight;
    base.paddingBottom = node.paddingBottom;
    base.itemSpacing = node.itemSpacing;
    if ("layoutWrap" in node) base.layoutWrap = node.layoutWrap;
    if ("layoutSizingHorizontal" in node) base.layoutSizingHorizontal = node.layoutSizingHorizontal;
    if ("layoutSizingVertical" in node) base.layoutSizingVertical = node.layoutSizingVertical;
    const bvLayout = (node.boundVariables ?? {}) as Record<string, VariableAlias | undefined>;
    const sv: NonNullable<NodeLike["spacingVars"]> = {};
    for (const campo of ["paddingLeft", "paddingTop", "paddingRight", "paddingBottom", "itemSpacing"] as const) {
      const alias = bvLayout[campo];
      if (alias) {
        const name = variableNameVal(alias.id);
        if (name) sv[campo] = name;
      }
    }
    if (Object.keys(sv).length > 0) base.spacingVars = sv;
    if (node.layoutMode === "GRID") {
      const g = node as unknown as { gridColumnCount?: number; gridRowCount?: number; gridColumnGap?: number; gridRowGap?: number };
      base.gridColumnCount = g.gridColumnCount;
      base.gridRowCount = g.gridRowCount;
      base.gridColumnGap = g.gridColumnGap;
      base.gridRowGap = g.gridRowGap;
      const colVar = bvLayout["gridColumnGap"];
      if (colVar) { const n = variableNameVal(colVar.id); if (n) base.gridColumnGapVar = n; }
      const rowVar = bvLayout["gridRowGap"];
      if (rowVar) { const n = variableNameVal(rowVar.id); if (n) base.gridRowGapVar = n; }
    }
  }
  if ("layoutGrids" in node && Array.isArray(node.layoutGrids)) {
    base.layoutGrids = node.layoutGrids.map((g) => gridSpecOf(g));
  }
  if ("cornerRadius" in node && typeof node.cornerRadius === "number") base.cornerRadius = node.cornerRadius;
  if ("fillStyleId" in node && typeof node.fillStyleId === "string" && node.fillStyleId !== "") {
    const style = figma.getStyleById(node.fillStyleId);
    if (style) base.fillStyleName = style.name;
  }
  if ("strokeStyleId" in node && typeof node.strokeStyleId === "string" && node.strokeStyleId !== "") {
    const style = figma.getStyleById(node.strokeStyleId);
    if (style) base.strokeStyleName = style.name;
  }
  if ("textStyleId" in node && typeof node.textStyleId === "string" && node.textStyleId !== "") {
    const style = figma.getStyleById(node.textStyleId);
    if (style) base.textStyleName = style.name;
  }
  if (node.type === "TEXT") {
    const fn = node.fontName;
    if (fn !== figma.mixed) {
      base.fontFamily = fn.family;
      base.fontStyle = fn.style;
    }
    if (node.fontSize !== figma.mixed) base.fontSize = node.fontSize;
    const lh = node.lineHeight;
    if (lh !== figma.mixed) {
      if (lh.unit === "AUTO") base.lineHeight = { unit: "auto" };
      else if (lh.unit === "PERCENT") base.lineHeight = { unit: "percent", value: lh.value };
      else base.lineHeight = { unit: "px", value: lh.value };
    }
    const ls = node.letterSpacing;
    if (ls !== figma.mixed) {
      base.letterSpacing = { unit: ls.unit === "PERCENT" ? "percent" : "px", value: ls.value };
    }
    base.textAlign = node.textAlignHorizontal;
    if (node.textCase !== figma.mixed) base.textCase = node.textCase;
    // the text's layoutSizing (Hug/Fixed/Fill) when it lives inside an Auto Layout.
    try {
      base.layoutSizingHorizontal = node.layoutSizingHorizontal;
      base.layoutSizingVertical = node.layoutSizingVertical;
    } catch { /* loose text, no Auto Layout parent: no resizing mode */ }
  }
  if ("boundVariables" in node && node.boundVariables) {
    const bv = node.boundVariables as {
      fills?: readonly VariableAlias[];
      strokes?: readonly VariableAlias[];
      width?: VariableAlias;
      height?: VariableAlias;
      topLeftRadius?: VariableAlias;
    };
    if (bv.fills && bv.fills.length > 0) {
      const name = variableNameVal(bv.fills[0].id);
      if (name) base.fillVariableName = name;
    }
    if (bv.strokes && bv.strokes.length > 0) {
      const name = variableNameVal(bv.strokes[0].id);
      if (name) base.strokeVariableName = name;
    }
    if (bv.width) {
      const name = variableNameVal(bv.width.id);
      if (name) base.widthVariableName = name;
    }
    if (bv.height) {
      const name = variableNameVal(bv.height.id);
      if (name) base.heightVariableName = name;
    }
    // The uniform radius is bound per corner; topLeftRadius represents the whole.
    if (bv.topLeftRadius) {
      const name = variableNameVal(bv.topLeftRadius.id);
      if (name) base.cornerRadiusVar = name;
    }
  }
  if ("children" in node) {
    base.children = node.children.map((c) => toNodeLike(c));
  }
  return base;
}
