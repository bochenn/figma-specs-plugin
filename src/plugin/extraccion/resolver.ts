// Normalizes the selection to a Component Set, or null if there are no variants.
export function resolveComponentSet(node: SceneNode): ComponentSetNode | null {
  if (node.type === "COMPONENT_SET") return node;
  if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET") {
    return node.parent as ComponentSetNode;
  }
  if (node.type === "INSTANCE") {
    const main = node.mainComponent;
    if (main && main.parent?.type === "COMPONENT_SET") {
      return main.parent as ComponentSetNode;
    }
  }
  return null;
}
