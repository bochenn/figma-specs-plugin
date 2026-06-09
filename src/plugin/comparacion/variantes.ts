import type { NodoLike, Atributo, AtributoCambiado, ParElementos, ElementoCambiado } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

// Indica si dos mapas prop→valor son exactamente iguales.
export function mismasProps(a: Record<string, string>, b: Record<string, string>): boolean {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((k) => a[k] === b[k]);
}
