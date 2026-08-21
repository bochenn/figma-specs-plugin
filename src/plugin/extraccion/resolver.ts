// Name of the component an instance comes from. For a variant the main component
// is named "Size=M", which means nothing to a reader: the component set's name is
// used instead. Returns undefined when it matches the layer name (nothing to clarify).
export function originName(layerName: string, main: ComponentNode): string | undefined {
  const name = main.parent?.type === "COMPONENT_SET" ? main.parent.name : main.name;
  return name === layerName ? undefined : name;
}

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
