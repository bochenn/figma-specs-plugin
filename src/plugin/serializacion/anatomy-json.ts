import type { AnatomyElement, AnatomyJson, JsonElement } from "../modelo/tipos.ts";

// Maps the internal Anatomy model to the JSON shape (JS object).
// Omits the fields we don't extract yet (systemId, rawValue, propertyName).
export function serializeAnatomy(elements: AnatomyElement[]): AnatomyJson {
  return {
    anatomy: elements.map((el) => {
      const salida: JsonElement = {
        name: el.name,
        type: el.type,
        attributes: el.attributes.map((a) => ({
          value: a.value,
          format: a.format,
          key: a.key,
        })),
      };
      if (el.isInstance && el.dependsOn) {
        salida.instanceOf = el.dependsOn;
      }
      return salida;
    }),
  };
}
