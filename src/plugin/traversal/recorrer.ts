import type { NodoLike } from "../modelo/tipos.ts";

export interface Recorrido { nodo: NodoLike; profundidad: number; camino?: { nombre: string; tipo: string }[]; }

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Junta solo las capas TEXT descendientes (a cualquier profundidad, entrando
// también a instancias). Sirve para documentar estilos de texto que quedarían
// fuera por el límite de nivel o por estar dentro de una instancia.
function textosAnidados(nodo: NodoLike, prof: number): Recorrido[] {
  const res: Recorrido[] = [];
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "TEXT") res.push({ nodo: hijo, profundidad: prof });
    else res.push(...textosAnidados(hijo, prof));
  }
  return res;
}

// textosProfundos: además de la lista normal, rescata las capas TEXT que están
// más profundas que nivelMax o dentro de instancias (para no perder su estilo).
export function recorrer(nodo: NodoLike, itemizar = false, prof = 0, nivel = 0, nivelMax = Infinity, textosProfundos = false): Recorrido[] {
  const elementos: Recorrido[] = [];
  if (nivel >= nivelMax) return elementos;
  for (const hijo of nodo.children ?? []) {
    elementos.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === TIPOS_INSTANCIA) {
      if (itemizar) elementos.push(...recorrer(hijo, itemizar, prof + 1, nivel + 1, nivelMax, textosProfundos));
      else if (textosProfundos) elementos.push(...textosAnidados(hijo, prof + 1));
    } else if (TIPOS_CONTENEDOR.includes(hijo.type)) {
      if (textosProfundos && nivel + 1 >= nivelMax) elementos.push(...textosAnidados(hijo, prof));
      else elementos.push(...recorrer(hijo, itemizar, prof, nivel + 1, nivelMax, textosProfundos));
    }
  }
  return elementos;
}
