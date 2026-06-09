import type { NodoLike, LayoutSpec } from "../modelo/tipos.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";

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

// Produce un LayoutSpec por cada capa con Auto Layout de la selección.
export function extraerLayout(raiz: NodoLike): LayoutSpec[] {
  return recorrerAutoLayout(raiz).map((nodo) => ({
    elementoNombre: nodo.name,
    tipo: nodo.type,
    direccion: nodo.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL",
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
  }));
}
