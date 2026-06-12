import type { ElementoAnatomy } from "../modelo/tipos.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type", "Attributes"];

// Mapea un elemento a una fila de la tabla de Anatomy (con sus atributos aplanados).
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  const attrs = elemento.atributos.map((a) => `${a.clave}: ${a.valor}`).join(", ");
  return [String(numero), elemento.nombre, elemento.tipo, attrs];
}
