import type { ElementoAnatomy } from "../modelo/tipos.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type", "Attributes"];

// Mapea un elemento a una fila de la tabla de Anatomy (con sus atributos
// aplanados). Incluye el valor resuelto (rawValue) de variables/styles, igual
// que la lista normal.
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  const attrs = elemento.atributos
    .map((a) => (a.rawValue ? `${a.clave}: ${a.valor} (${a.rawValue})` : `${a.clave}: ${a.valor}`))
    .join(", ");
  return [String(numero), elemento.nombre, elemento.tipo, attrs];
}
