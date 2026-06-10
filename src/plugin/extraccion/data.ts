import type {
  ElementoAnatomy,
  PropiedadSpec,
  DataAtributo,
  DataElementoAnatomy,
  DataElementoCambiado,
  DataPropiedad,
  DataJSON,
} from "../modelo/tipos.ts";

function atributosAData(atributos: ElementoAnatomy["atributos"]): DataAtributo[] {
  return atributos.map((a) => ({
    key: a.clave,
    value: a.valor,
    format: a.formato,
    rawValue: a.valor,
  }));
}

export function anatomyADataJSON(elementos: ElementoAnatomy[]): DataElementoAnatomy[] {
  return elementos.map((el) => {
    const entry: DataElementoAnatomy = {
      name: el.nombre,
      type: el.tipo,
      attributes: atributosAData(el.atributos),
    };
    if (el.dependeDe) entry.instanceOf = el.dependeDe;
    return entry;
  });
}

export function propiedadesADataJSON(props: PropiedadSpec[]): DataPropiedad[] {
  return props.map((prop) => ({
    name: prop.nombre,
    type: prop.tipo,
    default: prop.default,
    options: prop.opciones.map((op) => ({
      name: op.nombre,
      elements: op.cambios.map((cambio): DataElementoCambiado => ({
        name: cambio.elementoNombre,
        state:
          cambio.estado === "modificado"
            ? "modified"
            : cambio.estado === "agregado"
              ? "added"
              : "removed",
        attributes: cambio.atributos.map((a) => ({
          key: a.clave,
          ...(a.valorDefault !== undefined && { from: a.valorDefault }),
          ...(a.valorOpcion !== undefined && { to: a.valorOpcion }),
        })),
      })),
    })),
  }));
}

export function armarDataJSON(
  anatomy: DataElementoAnatomy[] | null,
  properties: DataPropiedad[] | null,
): string {
  const data: DataJSON = {};
  if (anatomy) data.anatomy = anatomy;
  if (properties) data.properties = properties;
  return JSON.stringify(data, null, 2);
}
