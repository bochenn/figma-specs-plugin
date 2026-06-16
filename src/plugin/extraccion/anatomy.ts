import type { NodoLike, ElementoAnatomy } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

// Recorre el nodo raíz y produce la lista de elementos de Anatomy.
export function extraerAnatomy(nodoRaiz: NodoLike, itemizar = false): ElementoAnatomy[] {
  return recorrer(nodoRaiz, itemizar).map(({ nodo, profundidad }) => {
    const esInstancia = nodo.type === "INSTANCE";
    const elemento: ElementoAnatomy = {
      id: nodo.id,
      nombre: nodo.name,
      tipo: nodo.type,
      esInstancia,
      atributos: leerAtributos(nodo),
    };
    if (esInstancia && nodo.mainComponentName) {
      elemento.dependeDe = nodo.mainComponentName;
    }
    if (profundidad > 0) elemento.profundidad = profundidad;
    return elemento;
  });
}
