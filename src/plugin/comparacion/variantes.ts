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

// Empareja elementos del default con los de la opción por nombre; los nombres
// repetidos se emparejan por orden de aparición. Los que no tienen contraparte
// quedan con un solo lado.
export function emparejar(a: NodoLike[], b: NodoLike[]): ParElementos[] {
  const pares: ParElementos[] = [];
  const usados = new Set<number>();

  for (const elemA of a) {
    let encontrado = -1;
    for (let i = 0; i < b.length; i++) {
      if (!usados.has(i) && b[i].name === elemA.name) {
        encontrado = i;
        break;
      }
    }
    if (encontrado >= 0) {
      usados.add(encontrado);
      pares.push({ default: elemA, opcion: b[encontrado] });
    } else {
      pares.push({ default: elemA });
    }
  }

  for (let i = 0; i < b.length; i++) {
    if (!usados.has(i)) pares.push({ opcion: b[i] });
  }

  return pares;
}
