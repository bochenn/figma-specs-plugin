import type { NodeLike, AnatomyElement } from "../modelo/tipos.ts";
import { traverse } from "../traversal/recorrer.ts";
import { readAttributes } from "../utils/atributos.ts";
import { frameIconKey } from "../utils/iconos-frame.ts";

function elementOf(node: NodeLike, depth: number): AnatomyElement {
  const isInstance = node.type === "INSTANCE";
  const element: AnatomyElement = {
    id: node.id,
    name: node.name,
    type: node.type,
    isInstance,
    attributes: readAttributes(node),
  };
  const typeIcon = frameIconKey(node);
  if (typeIcon) element.typeIcon = typeIcon;
  if (isInstance && node.mainComponentName) element.dependsOn = node.mainComponentName;
  if (node.instanceOf) element.instanceOf = node.instanceOf;
  if (depth > 0) element.depth = depth;
  return element;
}

// Traverses the root node and produces the Anatomy element list.
// opts.maxLevel: tree depth limit (default Infinity).
// opts.includeRoot: includes the root node as the first element (default false).
export function extractAnatomy(
  rootNode: NodeLike,
  itemize = false,
  opts: { maxLevel?: number; includeRoot?: boolean; deepTexts?: boolean } = {},
): AnatomyElement[] {
  const maxLevel = opts.maxLevel ?? Infinity;
  const descendientes = traverse(rootNode, itemize, 0, 0, maxLevel, opts.deepTexts ?? false).map(({ node, depth }) => elementOf(node, depth));
  return opts.includeRoot ? [elementOf(rootNode, 0), ...descendientes] : descendientes;
}
