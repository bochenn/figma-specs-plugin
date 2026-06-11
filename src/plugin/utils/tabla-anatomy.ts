import type { ElementoAnatomy } from "../modelo/tipos.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type"];

// Mapea un elemento a una fila de la tabla de Anatomy.
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  return [String(numero), elemento.nombre, elemento.tipo];
}
