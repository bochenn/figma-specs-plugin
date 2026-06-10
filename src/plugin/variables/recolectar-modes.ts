import type { EntradaModo, ValorModo } from "../modelo/tipos.ts";
import { hexDeColor } from "./modes.ts";

// Variables de color vinculadas a fill/stroke de un nodo, con su appliedAs.
function variablesColorDe(nodo: SceneNode): { id: string; appliedAs: string }[] {
  const res: { id: string; appliedAs: string }[] = [];
  if (!("boundVariables" in nodo) || !nodo.boundVariables) return res;
  const bv = nodo.boundVariables as {
    fills?: readonly VariableAlias[];
    strokes?: readonly VariableAlias[];
  };
  if (bv.fills && bv.fills.length > 0) {
    res.push({ id: bv.fills[0].id, appliedAs: nodo.type === "TEXT" ? "Text color" : "Background color" });
  }
  if (bv.strokes && bv.strokes.length > 0) {
    res.push({ id: bv.strokes[0].id, appliedAs: "Border color" });
  }
  return res;
}

// Formatea el valor de una variable de color en un mode: hex, alias o "—".
function valorColor(variable: Variable, modeId: string): string {
  const raw = variable.valuesByMode[modeId];
  if (raw === undefined || raw === null) return "—";
  if (typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS") {
    const alias = figma.variables.getVariableById(raw.id);
    return alias ? `→ ${alias.name}` : "→ (alias)";
  }
  if (typeof raw === "object" && "r" in raw) {
    return hexDeColor(raw);
  }
  return "—";
}

// Visita un nodo: emite entradas de sus variables de color y baja por sus hijos
// (salvo en instancias).
function visitar(nodo: SceneNode, entradas: EntradaModo[]): void {
  for (const { id, appliedAs } of variablesColorDe(nodo)) {
    const variable = figma.variables.getVariableById(id);
    if (!variable || variable.resolvedType !== "COLOR") continue;
    const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    if (!collection || collection.modes.length < 2) continue;

    const modos = collection.modes.map((m) => ({ modeId: m.modeId, nombre: m.name }));
    const valores: ValorModo[] = modos.map((m) => ({ modeId: m.modeId, valor: valorColor(variable, m.modeId) }));
    entradas.push({
      coleccionNombre: collection.name,
      modos,
      capa: nodo.name,
      appliedAs,
      variableNombre: variable.name,
      valores,
    });
  }
  if (nodo.type === "INSTANCE") return;
  if ("children" in nodo) {
    for (const hijo of nodo.children) visitar(hijo, entradas);
  }
}

// Recolecta las entradas de modes de la selección (raíz + descendientes).
export function recolectarModes(nodo: SceneNode): EntradaModo[] {
  const entradas: EntradaModo[] = [];
  visitar(nodo, entradas);
  return entradas;
}
