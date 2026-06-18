import type { NodoLike } from "../modelo/tipos.ts";

export interface Recorrido { nodo: NodoLike; profundidad: number; camino?: string[]; }

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

export function recorrer(nodo: NodoLike, itemizar = false, prof = 0, nivel = 0, nivelMax = Infinity): Recorrido[] {
  const elementos: Recorrido[] = [];
  if (nivel >= nivelMax) return elementos;
  for (const hijo of nodo.children ?? []) {
    elementos.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === TIPOS_INSTANCIA) {
      if (itemizar) elementos.push(...recorrer(hijo, itemizar, prof + 1, nivel + 1, nivelMax));
    } else if (TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo, itemizar, prof, nivel + 1, nivelMax));
    }
  }
  return elementos;
}
