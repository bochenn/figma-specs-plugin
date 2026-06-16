import type { NodoLike, LayoutSpec } from "../modelo/tipos.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
import { colorAtributo, hexSolido } from "../utils/atributos.ts";

// Traduce el valor de alineación de Figma a texto legible.
export function alineacion(valor: string | undefined): string {
  switch (valor) {
    case "CENTER": return "Center";
    case "MAX": return "End";
    case "SPACE_BETWEEN": return "Space between";
    case "BASELINE": return "Baseline";
    default: return "Start"; // "MIN" y ausentes
  }
}

// Traduce el valor de resizing de Figma a texto legible.
export function resizing(valor: string | undefined): string {
  switch (valor) {
    case "FILL": return "Fill";
    case "HUG": return "Hug";
    default: return "Fixed"; // "FIXED" y ausentes
  }
}

// Construye el LayoutSpec de un solo nodo con Auto Layout.
export function layoutSpecDe(nodo: NodoLike, profundidad = 0): LayoutSpec {
  const fill = colorAtributo("fill", { hex: hexSolido(nodo.fills), variableName: nodo.fillVariableName, styleName: nodo.fillStyleName });
  const stroke = colorAtributo("stroke", { hex: hexSolido(nodo.strokes), variableName: nodo.strokeVariableName, styleName: nodo.strokeStyleName });
  const spec: LayoutSpec = {
    elementoNombre: nodo.name,
    tipo: nodo.type,
    direccion: nodo.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : nodo.layoutMode === "GRID" ? "GRID" : "VERTICAL",
    alineacionPrimaria: alineacion(nodo.primaryAxisAlignItems),
    alineacionContraria: alineacion(nodo.counterAxisAlignItems),
    resizingHorizontal: resizing(nodo.layoutSizingHorizontal),
    resizingVertical: resizing(nodo.layoutSizingVertical),
    padding: {
      left: nodo.paddingLeft ?? 0,
      top: nodo.paddingTop ?? 0,
      right: nodo.paddingRight ?? 0,
      bottom: nodo.paddingBottom ?? 0,
    },
    itemSpacing: nodo.itemSpacing ?? 0,
    wrap: nodo.layoutWrap === "WRAP",
    spacingAuto: nodo.primaryAxisAlignItems === "SPACE_BETWEEN",
    grids: nodo.layoutGrids ?? [],
    spacingVars: nodo.spacingVars ?? {},
    width: nodo.width ?? 0,
    height: nodo.height ?? 0,
  };
  if (nodo.widthVariableName) spec.widthVar = nodo.widthVariableName;
  if (nodo.heightVariableName) spec.heightVar = nodo.heightVariableName;
  if (typeof nodo.cornerRadius === "number" && nodo.cornerRadius > 0) spec.cornerRadius = nodo.cornerRadius;
  if (fill) spec.fill = fill;
  if (stroke) spec.stroke = stroke;
  if (profundidad > 0) spec.profundidad = profundidad;
  if (nodo.layoutMode === "GRID") {
    if (typeof nodo.gridColumnCount === "number") spec.gridColumnas = nodo.gridColumnCount;
    if (typeof nodo.gridRowCount === "number") spec.gridFilas = nodo.gridRowCount;
    if (typeof nodo.gridColumnGap === "number") spec.gridColumnGap = nodo.gridColumnGap;
    if (typeof nodo.gridRowGap === "number") spec.gridRowGap = nodo.gridRowGap;
  }
  return spec;
}

// Serializa la config de layout (para comparar entre variantes).
export function claveLayout(spec: LayoutSpec): string {
  const p = spec.padding;
  return `${spec.direccion}|${spec.alineacionPrimaria}|${spec.alineacionContraria}|${spec.resizingHorizontal}|${spec.resizingVertical}|L${p.left}T${p.top}R${p.right}B${p.bottom}|gap${spec.itemSpacing}`;
}

// Produce un LayoutSpec por cada capa con Auto Layout de la selección.
export function extraerLayout(raiz: NodoLike, itemizar = false): LayoutSpec[] {
  return recorrerAutoLayout(raiz, itemizar).map((r) => layoutSpecDe(r.nodo, r.profundidad));
}
