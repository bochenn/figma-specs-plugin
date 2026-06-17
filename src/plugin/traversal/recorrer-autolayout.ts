import type { NodoLike } from "../modelo/tipos.ts";
import type { Recorrido } from "./recorrer.ts";

const CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL" || n.layoutMode === "GRID";
}

// Nodos con Auto Layout y su profundidad (instancias atravesadas). Sin itemizar
// frena en instancias; con itemizar entra (prof +1). La raíz va con prof 0.
// `camino` son los nombres desde la raíz hasta el nodo inclusive.
export function recorrerAutoLayout(nodo: NodoLike, itemizar = false, prof = 0, camino: string[] = []): Recorrido[] {
  const resultado: Recorrido[] = [];
  const propio = [...camino, nodo.name];
  if (tieneAutoLayout(nodo)) resultado.push({ nodo, profundidad: prof, camino: propio });
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "INSTANCE") {
      if (itemizar) resultado.push(...recorrerAutoLayout(hijo, itemizar, prof + 1, propio));
    } else if (CONTENEDOR.includes(hijo.type)) {
      resultado.push(...recorrerAutoLayout(hijo, itemizar, prof, propio));
    }
  }
  return resultado;
}
