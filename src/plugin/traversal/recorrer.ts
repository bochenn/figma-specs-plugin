import type { NodoLike } from "../modelo/tipos.ts";

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Recorre los descendientes de un nodo y devuelve la lista plana de elementos.
// Regla del PRD: las instancias son elemento pero NO se itemizan sus hijos;
// los contenedores son elemento y además se recorren hacia adentro;
// el resto (textos, shapes) son hojas.
export function recorrer(nodo: NodoLike): NodoLike[] {
  const elementos: NodoLike[] = [];
  for (const hijo of nodo.children ?? []) {
    elementos.push(hijo);
    if (hijo.type !== TIPOS_INSTANCIA && TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo));
    }
  }
  return elementos;
}
