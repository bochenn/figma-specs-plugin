import type { NodoLike } from "../modelo/tipos.ts";

const CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Devuelve los nodos con Auto Layout: incluye la raíz si la tiene, baja por
// los contenedores y frena en instancias (no documenta su layout interno).
export function recorrerAutoLayout(nodo: NodoLike): NodoLike[] {
  const resultado: NodoLike[] = [];
  if (tieneAutoLayout(nodo)) resultado.push(nodo);
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "INSTANCE") continue;
    if (CONTENEDOR.includes(hijo.type)) resultado.push(...recorrerAutoLayout(hijo));
  }
  return resultado;
}
