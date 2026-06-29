import type { NodeLike } from "../modelo/tipos.ts";

export interface Traversal { node: NodeLike; depth: number; path?: { name: string; type: string }[]; }

const TIPOS_INSTANCIA = "INSTANCE";
const CONTAINER_TYPES = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Collects only the descendant TEXT layers (at any depth, descending
// instances too). Useful to document text styles that would be
// out by the level limit or by being inside an instance.
function nestedTexts(node: NodeLike, prof: number): Traversal[] {
  const res: Traversal[] = [];
  for (const child of node.children ?? []) {
    if (child.type === "TEXT") res.push({ node: child, depth: prof });
    else res.push(...nestedTexts(child, prof));
  }
  return res;
}

// Every layer of the tree (root + descendants), each with its full path
// (root→layer) and instance depth. Same shape as traverseAutoLayout, but keeps
// ALL layers (not only Auto Layout ones) so Layout & Spacing can document leaf
// layers (texts, icons, vectors) too. Without itemize, instances are listed but
// not opened.
export function traverseTree(node: NodeLike, itemize = false, prof = 0, path: { name: string; type: string }[] = []): Traversal[] {
  const own = [...path, { name: node.name, type: node.type }];
  const elements: Traversal[] = [{ node, depth: prof, path: own }];
  for (const child of node.children ?? []) {
    const childPath = [...own, { name: child.name, type: child.type }];
    if (child.type === TIPOS_INSTANCIA) {
      if (itemize) elements.push(...traverseTree(child, itemize, prof + 1, own));
      else elements.push({ node: child, depth: prof, path: childPath });
    } else if (CONTAINER_TYPES.includes(child.type)) {
      elements.push(...traverseTree(child, itemize, prof, own));
    } else {
      elements.push({ node: child, depth: prof, path: childPath });
    }
  }
  return elements;
}

// deepTexts: besides the normal list, rescues the TEXT layers that are
// deeper than maxLevel or inside instances (so their style isn't lost).
export function traverse(node: NodeLike, itemize = false, prof = 0, nivel = 0, maxLevel = Infinity, deepTexts = false): Traversal[] {
  const elements: Traversal[] = [];
  if (nivel >= maxLevel) return elements;
  for (const child of node.children ?? []) {
    elements.push({ node: child, depth: prof });
    if (child.type === TIPOS_INSTANCIA) {
      if (itemize) elements.push(...traverse(child, itemize, prof + 1, nivel + 1, maxLevel, deepTexts));
      else if (deepTexts) elements.push(...nestedTexts(child, prof + 1));
    } else if (CONTAINER_TYPES.includes(child.type)) {
      if (deepTexts && nivel + 1 >= maxLevel) elements.push(...nestedTexts(child, prof));
      else elements.push(...traverse(child, itemize, prof, nivel + 1, maxLevel, deepTexts));
    }
  }
  return elements;
}
