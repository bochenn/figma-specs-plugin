import type { NodoLike, EntradaEstilo } from "../modelo/tipos.ts";

// Emite las entradas de estilo de un solo nodo.
function emitir(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  if (nodo.fillStyleName) {
    entradas.push({
      tabla: "color",
      nombre: nodo.fillStyleName,
      appliedAs: nodo.type === "TEXT" ? "Text color" : "Background color",
      capa: nodo.name,
    });
  }
  if (nodo.strokeStyleName) {
    entradas.push({ tabla: "color", nombre: nodo.strokeStyleName, appliedAs: "Border color", capa: nodo.name });
  }
  if (nodo.textStyleName) {
    entradas.push({ tabla: "text", nombre: nodo.textStyleName, appliedAs: "Text style", capa: nodo.name });
  }
}

// Visita un nodo: emite sus estilos y baja por sus hijos, salvo en instancias.
function visitar(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  emitir(nodo, entradas);
  if (nodo.type === "INSTANCE") return;
  for (const hijo of nodo.children ?? []) {
    visitar(hijo, entradas);
  }
}

// Recolecta todas las entradas de estilo de la selección (raíz + descendientes).
export function recolectarEstilos(raiz: NodoLike): EntradaEstilo[] {
  const entradas: EntradaEstilo[] = [];
  visitar(raiz, entradas);
  return entradas;
}
