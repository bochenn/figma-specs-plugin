import type { ModeEntry, ModeValue } from "../modelo/tipos.ts";
import { hexOfColor } from "./modes.ts";
import { visibleNode } from "../extraccion/adaptador.ts";

// Color variables bound to a node's fill/stroke, with their appliedAs.
function variablesColorDe(node: SceneNode): { id: string; appliedAs: string }[] {
  const res: { id: string; appliedAs: string }[] = [];
  if (!("boundVariables" in node) || !node.boundVariables) return res;
  const bv = node.boundVariables as {
    fills?: readonly VariableAlias[];
    strokes?: readonly VariableAlias[];
  };
  if (bv.fills && bv.fills.length > 0) {
    res.push({ id: bv.fills[0].id, appliedAs: node.type === "TEXT" ? "Text color" : "Background color" });
  }
  if (bv.strokes && bv.strokes.length > 0) {
    res.push({ id: bv.strokes[0].id, appliedAs: "Border color" });
  }
  return res;
}

// Formats a color variable's value in a mode: hex, alias or "—".
async function colorValue(variable: Variable, modeId: string): Promise<string> {
  const raw = variable.valuesByMode[modeId];
  if (raw === undefined || raw === null) return "—";
  if (typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS") {
    const alias = await figma.variables.getVariableByIdAsync(raw.id);
    return alias ? `→ ${alias.name}` : "→ (alias)";
  }
  if (typeof raw === "object" && "r" in raw) {
    return hexOfColor(raw);
  }
  return "—";
}

// Visits a node: emits its color-variable entries and descends through its children,
// also inside the instances (to reach the nested components).
async function visitar(node: SceneNode, entries: ModeEntry[]): Promise<void> {
  for (const { id, appliedAs } of variablesColorDe(node)) {
    const variable = await figma.variables.getVariableByIdAsync(id);
    if (!variable || variable.resolvedType !== "COLOR") continue;
    const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    if (!collection || collection.modes.length < 2) continue;

    const modes = collection.modes.map((m) => ({ modeId: m.modeId, name: m.name }));
    const values: ModeValue[] = [];
    for (const m of modes) {
      values.push({ modeId: m.modeId, value: await colorValue(variable, m.modeId) });
    }
    entries.push({
      collectionName: collection.name,
      collectionId: collection.id,
      modes,
      layer: node.name,
      appliedAs,
      variableName: variable.name,
      values,
    });
  }
  if ("children" in node) {
    for (const child of node.children.filter(visibleNode)) await visitar(child, entries);
  }
}

// Collects the mode entries of the selection (root + descendants).
export async function collectModes(node: SceneNode): Promise<ModeEntry[]> {
  const entries: ModeEntry[] = [];
  await visitar(node, entries);
  return entries;
}
