// Normaliza la selección a un Component Set, o null si no hay variantes.
export function resolverComponentSet(nodo: SceneNode): ComponentSetNode | null {
  if (nodo.type === "COMPONENT_SET") return nodo;
  if (nodo.type === "COMPONENT" && nodo.parent?.type === "COMPONENT_SET") {
    return nodo.parent as ComponentSetNode;
  }
  if (nodo.type === "INSTANCE") {
    const main = nodo.mainComponent;
    if (main && main.parent?.type === "COMPONENT_SET") {
      return main.parent as ComponentSetNode;
    }
  }
  return null;
}
