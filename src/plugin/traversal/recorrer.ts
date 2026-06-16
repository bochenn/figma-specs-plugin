import type { NodoLike } from "../modelo/tipos.ts";

export interface Recorrido { nodo: NodoLike; profundidad: number; }

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Recorre los descendientes y devuelve la lista plana con su profundidad.
// La profundidad cuenta instancias atravesadas: un frame normal mantiene la del
// contexto; al entrar en una instancia (solo con itemizar) sube +1.
export function recorrer(nodo: NodoLike, itemizar = false, prof = 0): Recorrido[] {
  const elementos: Recorrido[] = [];
  for (const hijo of nodo.children ?? []) {
    elementos.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === TIPOS_INSTANCIA) {
      if (itemizar) elementos.push(...recorrer(hijo, itemizar, prof + 1));
    } else if (TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo, itemizar, prof));
    }
  }
  return elementos;
}
