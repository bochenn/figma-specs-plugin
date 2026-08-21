import type { NodeLike, PaintLike } from "../modelo/tipos.ts";
import { gridSpecOf } from "../utils/grilla.ts";
import { stripCollectionPrefix } from "../utils/nombre-variable.ts";
import { originName } from "./resolver.ts";

// Converts a Figma Paint to PaintLike: solid color or gradient stops.
function paintLike(f: Paint): PaintLike {
  const p: PaintLike = { type: f.type };
  if (f.visible === false) p.visible = false;
  if (f.type === "SOLID") p.color = f.color;
  if (f.type.startsWith("GRADIENT_")) {
    const g = f as GradientPaint;
    p.gradient = {
      type: f.type,
      gradientStops: g.gradientStops.map((s) => ({ position: s.position, color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a } })),
      gradientTransform: g.gradientTransform.map((row) => [...row]),
    };
  }
  return p;
}

// Resolves a variable to "Collection/Variable" (or just its name if there's no collection).
async function variableNameVal(id: string): Promise<string | undefined> {
  const variable = await figma.variables.getVariableByIdAsync(id);
  if (!variable) return undefined;
  const col = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
  return col ? `${stripCollectionPrefix(col.name)}/${variable.name}` : variable.name;
}

// False when the layer's visibility toggle is off.
export function visibleNode(node: SceneNode): boolean {
  return !("visible" in node) || node.visible !== false;
}

// Variable modes explicitly applied to the node ("Variable modes" in the panel),
// as { collection, mode } names.
async function variableModesOf(node: SceneNode): Promise<{ collection: string; mode: string }[]> {
  const explicit = (node as { explicitVariableModes?: Record<string, string> }).explicitVariableModes;
  if (!explicit) return [];
  const res: { collection: string; mode: string }[] = [];
  for (const collectionId of Object.keys(explicit)) {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) continue;
    const mode = collection.modes.find((m) => m.modeId === explicit[collectionId]);
    if (mode) res.push({ collection: stripCollectionPrefix(collection.name), mode: mode.name });
  }
  return res;
}

// Converts a real Figma node into NodeLike (only what the pure modules read).
// Async: with documentAccess "dynamic-page" the styles/variables/mainComponent
// APIs only exist in their async variants.
export async function toNodeLike(node: SceneNode): Promise<NodeLike> {
  const base: NodeLike = { id: node.id, name: node.name, type: node.type };

  if ("visible" in node) base.visible = node.visible;
  if ("layoutPositioning" in node) base.layoutPositioning = node.layoutPositioning;
  const modes = await variableModesOf(node);
  if (modes.length > 0) base.variableModes = modes;

  if ("width" in node) base.width = node.width;
  if ("height" in node) base.height = node.height;
  if ("opacity" in node) base.opacity = node.opacity;
  if ("fills" in node && Array.isArray(node.fills)) {
    base.fills = node.fills.map(paintLike);
  }
  if ("strokes" in node && Array.isArray(node.strokes)) {
    base.strokes = node.strokes.map(paintLike);
    if (node.strokes.length > 0) {
      // Per-side weights (frames/rects/instances); uniform weight for the rest.
      const sw = node as unknown as {
        strokeWeight?: number | symbol;
        strokeTopWeight?: number; strokeRightWeight?: number;
        strokeBottomWeight?: number; strokeLeftWeight?: number;
        dashPattern?: readonly number[];
      };
      if (typeof sw.strokeTopWeight === "number") {
        base.strokeWeights = {
          top: sw.strokeTopWeight,
          right: sw.strokeRightWeight ?? 0,
          bottom: sw.strokeBottomWeight ?? 0,
          left: sw.strokeLeftWeight ?? 0,
        };
      } else if (typeof sw.strokeWeight === "number") {
        base.strokeWeights = { top: sw.strokeWeight, right: sw.strokeWeight, bottom: sw.strokeWeight, left: sw.strokeWeight };
      }
      if (Array.isArray(sw.dashPattern) && sw.dashPattern.length > 0) base.strokeDashed = true;
    }
  }
  if (node.type === "INSTANCE") {
    const main = await (node as InstanceNode).getMainComponentAsync();
    if (main) {
      base.mainComponentName = main.name;
      base.instanceOf = originName(node.name, main);
    }
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
        const name = await variableNameVal(alias.id);
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
      if (colVar) { const n = await variableNameVal(colVar.id); if (n) base.gridColumnGapVar = n; }
      const rowVar = bvLayout["gridRowGap"];
      if (rowVar) { const n = await variableNameVal(rowVar.id); if (n) base.gridRowGapVar = n; }
    }
  }
  if ("layoutGrids" in node && Array.isArray(node.layoutGrids)) {
    base.layoutGrids = node.layoutGrids.map((g) => gridSpecOf(g));
  }
  if ("cornerRadius" in node && typeof node.cornerRadius === "number") base.cornerRadius = node.cornerRadius;
  if ("fillStyleId" in node && typeof node.fillStyleId === "string" && node.fillStyleId !== "") {
    const style = await figma.getStyleByIdAsync(node.fillStyleId);
    if (style) base.fillStyleName = style.name;
  }
  if ("strokeStyleId" in node && typeof node.strokeStyleId === "string" && node.strokeStyleId !== "") {
    const style = await figma.getStyleByIdAsync(node.strokeStyleId);
    if (style) base.strokeStyleName = style.name;
  }
  if ("textStyleId" in node && typeof node.textStyleId === "string" && node.textStyleId !== "") {
    const style = await figma.getStyleByIdAsync(node.textStyleId);
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
      const name = await variableNameVal(bv.fills[0].id);
      if (name) base.fillVariableName = name;
    }
    if (bv.strokes && bv.strokes.length > 0) {
      const name = await variableNameVal(bv.strokes[0].id);
      if (name) base.strokeVariableName = name;
    }
    if (bv.width) {
      const name = await variableNameVal(bv.width.id);
      if (name) base.widthVariableName = name;
    }
    if (bv.height) {
      const name = await variableNameVal(bv.height.id);
      if (name) base.heightVariableName = name;
    }
    // The uniform radius is bound per corner; topLeftRadius represents the whole.
    if (bv.topLeftRadius) {
      const name = await variableNameVal(bv.topLeftRadius.id);
      if (name) base.cornerRadiusVar = name;
    }
  }
  if ("children" in node) {
    // Hidden layers (visibility off) are left out of the specs, at any depth.
    base.children = await Promise.all(node.children.filter(visibleNode).map((c) => toNodeLike(c)));
  }
  return base;
}
