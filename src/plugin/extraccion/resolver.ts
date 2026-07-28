// Normalizes the selection to a Component Set, or null if there are no variants.
export async function resolveComponentSet(node: SceneNode): Promise<ComponentSetNode | null> {
  if (node.type === "COMPONENT_SET") return node;
  if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET") {
    return node.parent as ComponentSetNode;
  }
  if (node.type === "INSTANCE") {
    const main = await node.getMainComponentAsync();
    if (main && main.parent?.type === "COMPONENT_SET") {
      return main.parent as ComponentSetNode;
    }
  }
  return null;
}
