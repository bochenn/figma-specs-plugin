import type { ElementoAnatomy, AnatomyJson, ElementoJson } from "../modelo/tipos.ts";

// Mapea el modelo interno de Anatomy a la forma JSON del PRD (objeto JS).
// Omite los campos que aún no extraemos (systemId, rawValue, propertyName).
export function serializarAnatomy(elementos: ElementoAnatomy[]): AnatomyJson {
  return {
    anatomy: elementos.map((el) => {
      const salida: ElementoJson = {
        name: el.nombre,
        type: el.tipo,
        attributes: el.atributos.map((a) => ({
          value: a.valor,
          format: a.formato,
          key: a.clave,
        })),
      };
      if (el.esInstancia && el.dependeDe) {
        salida.instanceOf = el.dependeDe;
      }
      return salida;
    }),
  };
}
