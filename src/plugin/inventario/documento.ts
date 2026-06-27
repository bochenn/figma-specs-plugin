import type { InventoryRow, GradientData, LineHeightVal, LetterSpacingVal } from "../modelo/tipos.ts";
import { hexOfColor } from "../variables/modes.ts";
import { stripCollectionPrefix } from "../utils/nombre-variable.ts";

// LineHeightVal from Figma's LineHeight.
function alturaLinea(lh: LineHeight): LineHeightVal {
  if (lh.unit === "AUTO") return { unit: "auto" };
  if (lh.unit === "PERCENT") return { unit: "percent", value: lh.value };
  return { unit: "px", value: lh.value };
}

// LetterSpacingVal from Figma's LetterSpacing.
function espaciadoLetra(ls: LetterSpacing): LetterSpacingVal {
  return { unit: ls.unit === "PERCENT" ? "percent" : "px", value: ls.value };
}

// Gradient (stops + transform) from a GradientPaint.
function gradienteDe(p: GradientPaint): GradientData {
  return {
    type: p.type,
    gradientStops: p.gradientStops.map((s) => ({ position: s.position, color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a } })),
    gradientTransform: p.gradientTransform.map((row) => [...row]),
  };
}

// Resolves a variable's color in its default mode, following aliases.
async function colorVariable(v: Variable): Promise<string | undefined> {
  const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  let modeId = col?.defaultModeId ?? Object.keys(v.valuesByMode)[0];
  let raw: VariableValue | undefined = v.valuesByMode[modeId];
  let guard = 0;
  while (raw && typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS" && guard++ < 10) {
    const alias = await figma.variables.getVariableByIdAsync(raw.id);
    if (!alias) return undefined;
    const aliasCol = await figma.variables.getVariableCollectionByIdAsync(alias.variableCollectionId);
    modeId = aliasCol?.defaultModeId ?? Object.keys(alias.valuesByMode)[0];
    raw = alias.valuesByMode[modeId];
  }
  if (raw && typeof raw === "object" && "r" in raw) return hexOfColor(raw);
  return undefined;
}

// Inventory of ALL the document's local styles/variables (catalog).
// The rows carry no applied-where: it's not about a specific element.
export async function documentInventory(): Promise<InventoryRow[]> {
  const rows: InventoryRow[] = [];

  for (const v of await figma.variables.getLocalVariablesAsync("COLOR")) {
    const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    const name = col ? `${stripCollectionPrefix(col.name)}/${v.name}` : v.name;
    const row: InventoryRow = { table: "variable", name, appliedAs: "", appliedTo: "" };
    const hex = await colorVariable(v);
    if (hex) row.swatchHex = hex;
    rows.push(row);
  }

  for (const ps of await figma.getLocalPaintStylesAsync()) {
    const row: InventoryRow = { table: "color", name: ps.name, appliedAs: "", appliedTo: "" };
    const p = ps.paints[0];
    if (p?.type === "SOLID") row.swatchHex = hexOfColor(p.color);
    else if (p && p.type.startsWith("GRADIENT_")) row.gradient = gradienteDe(p as GradientPaint);
    rows.push(row);
  }

  for (const ts of await figma.getLocalTextStylesAsync()) {
    rows.push({
      table: "text", name: ts.name, appliedAs: "", appliedTo: "",
      type: {
        family: ts.fontName.family, style: ts.fontName.style, size: ts.fontSize,
        lineHeight: alturaLinea(ts.lineHeight), letterSpacing: espaciadoLetra(ts.letterSpacing),
      },
    });
  }

  return rows;
}
