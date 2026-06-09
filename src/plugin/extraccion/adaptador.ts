import type { NodoLike } from "../modelo/tipos.ts";

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
  if (nodo.type === "INSTANCE") {
    const main = (nodo as InstanceNode).mainComponent;
    if (main) base.mainComponentName = main.name;
  }
  if ("children" in nodo) {
    base.children = nodo.children.map((c) => aNodoLike(c));
  }
  return base;
}
