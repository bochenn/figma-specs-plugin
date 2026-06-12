import type { NodoLike } from "../modelo/tipos.ts";

// Resuelve una variable a "Colección/Variable" (o solo su nombre si no hay collection).
function nombreVariable(id: string): string | undefined {
  const variable = figma.variables.getVariableById(id);
  if (!variable) return undefined;
  const col = figma.variables.getVariableCollectionById(variable.variableCollectionId);
  return col ? `${col.name}/${variable.name}` : variable.name;
}

// Convierte un nodo real de Figma en NodoLike (solo lo que leen los módulos puros).
export function aNodoLike(nodo: SceneNode): NodoLike {
  const base: NodoLike = { id: nodo.id, name: nodo.name, type: nodo.type };

  if ("width" in nodo) base.width = nodo.width;
  if ("height" in nodo) base.height = nodo.height;
  if ("opacity" in nodo) base.opacity = nodo.opacity;
  if ("fills" in nodo && Array.isArray(nodo.fills)) {
    base.fills = nodo.fills.map((f) => ({
      type: f.type,
      color: f.type === "SOLID" ? f.color : undefined,
    }));
  }
  if ("strokes" in nodo && Array.isArray(nodo.strokes)) {
    base.strokes = nodo.strokes.map((f) => ({
      type: f.type,
      color: f.type === "SOLID" ? f.color : undefined,
    }));
  }
  if (nodo.type === "INSTANCE") {
    const main = (nodo as InstanceNode).mainComponent;
    if (main) base.mainComponentName = main.name;
  }
  if ("layoutMode" in nodo && (nodo.layoutMode === "HORIZONTAL" || nodo.layoutMode === "VERTICAL")) {
    base.layoutMode = nodo.layoutMode;
    base.primaryAxisAlignItems = nodo.primaryAxisAlignItems;
    base.counterAxisAlignItems = nodo.counterAxisAlignItems;
    base.paddingLeft = nodo.paddingLeft;
    base.paddingTop = nodo.paddingTop;
    base.paddingRight = nodo.paddingRight;
    base.paddingBottom = nodo.paddingBottom;
    base.itemSpacing = nodo.itemSpacing;
    if ("layoutSizingHorizontal" in nodo) base.layoutSizingHorizontal = nodo.layoutSizingHorizontal;
    if ("layoutSizingVertical" in nodo) base.layoutSizingVertical = nodo.layoutSizingVertical;
  }
  if ("fillStyleId" in nodo && typeof nodo.fillStyleId === "string" && nodo.fillStyleId !== "") {
    const estilo = figma.getStyleById(nodo.fillStyleId);
    if (estilo) base.fillStyleName = estilo.name;
  }
  if ("strokeStyleId" in nodo && typeof nodo.strokeStyleId === "string" && nodo.strokeStyleId !== "") {
    const estilo = figma.getStyleById(nodo.strokeStyleId);
    if (estilo) base.strokeStyleName = estilo.name;
  }
  if ("textStyleId" in nodo && typeof nodo.textStyleId === "string" && nodo.textStyleId !== "") {
    const estilo = figma.getStyleById(nodo.textStyleId);
    if (estilo) base.textStyleName = estilo.name;
  }
  if (nodo.type === "TEXT") {
    const fn = nodo.fontName;
    if (fn !== figma.mixed) {
      base.fontFamily = fn.family;
      base.fontStyle = fn.style;
    }
    if (nodo.fontSize !== figma.mixed) base.fontSize = nodo.fontSize;
  }
  if ("boundVariables" in nodo && nodo.boundVariables) {
    const bv = nodo.boundVariables as {
      fills?: readonly VariableAlias[];
      strokes?: readonly VariableAlias[];
    };
    if (bv.fills && bv.fills.length > 0) {
      const nombre = nombreVariable(bv.fills[0].id);
      if (nombre) base.fillVariableName = nombre;
    }
    if (bv.strokes && bv.strokes.length > 0) {
      const nombre = nombreVariable(bv.strokes[0].id);
      if (nombre) base.strokeVariableName = nombre;
    }
  }
  if ("children" in nodo) {
    base.children = nodo.children.map((c) => aNodoLike(c));
  }
  return base;
}
