import type { NodeLike } from "../modelo/tipos.ts";
import { visibleChildren, type Traversal } from "./recorrer.ts";

const CONTAINER = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodeLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL" || n.layoutMode === "GRID";
}

// Auto Layout nodes and their depth (instances traversed). Without itemize
// stops at instances; with itemize it descends (depth +1). The root goes with depth 0.
// `path` are the names from the root to the node inclusive.
export function traverseAutoLayout(node: NodeLike, itemize = false, prof = 0, path: { name: string; type: string }[] = []): Traversal[] {
  const resultado: Traversal[] = [];
  const propio = [...path, { name: node.name, type: node.type }];
  if (tieneAutoLayout(node)) resultado.push({ node, depth: prof, path: propio });
  for (const child of visibleChildren(node)) {
    if (child.type === "INSTANCE") {
      if (itemize) resultado.push(...traverseAutoLayout(child, itemize, prof + 1, propio));
    } else if (CONTAINER.includes(child.type)) {
      resultado.push(...traverseAutoLayout(child, itemize, prof, propio));
    }
  }
  return resultado;
}
