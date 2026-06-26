import type { NodoLike, ElementoAnatomy } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

function elementoDe(nodo: NodoLike, profundidad: number): ElementoAnatomy {
  const esInstancia = nodo.type === "INSTANCE";
  const elemento: ElementoAnatomy = {
    id: nodo.id,
    nombre: nodo.name,
    tipo: nodo.type,
    esInstancia,
    atributos: leerAtributos(nodo),
  };
  if (esInstancia && nodo.mainComponentName) elemento.dependeDe = nodo.mainComponentName;
  if (profundidad > 0) elemento.profundidad = profundidad;
  return elemento;
}

// Recorre el nodo raíz y produce la lista de elementos de Anatomy.
// opts.nivelMax: límite de profundidad de árbol (default Infinity).
// opts.incluirRaiz: incluye el nodo raíz como primer elemento (default false).
export function extraerAnatomy(
  nodoRaiz: NodoLike,
  itemizar = false,
  opts: { nivelMax?: number; incluirRaiz?: boolean; textosProfundos?: boolean } = {},
): ElementoAnatomy[] {
  const nivelMax = opts.nivelMax ?? Infinity;
  const descendientes = recorrer(nodoRaiz, itemizar, 0, 0, nivelMax, opts.textosProfundos ?? false).map(({ nodo, profundidad }) => elementoDe(nodo, profundidad));
  return opts.incluirRaiz ? [elementoDe(nodoRaiz, 0), ...descendientes] : descendientes;
}
