import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm } from "../modelo/tipos.ts";
import { mismasProps, compararVariante } from "../comparacion/variantes.ts";

// Busca en el set la variante cuyo mapa de props coincide exactamente con el target.
function buscarVariante(set: SetNorm, target: Record<string, string>): VarianteNorm | undefined {
  return set.variantes.find((v) => mismasProps(v.variantProperties, target));
}

// Produce las PropiedadSpec[]: por cada propiedad, compara el default contra
// cada opción alternativa (salteando el valor default).
export function extraerProperties(set: SetNorm): PropiedadSpec[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const specs: PropiedadSpec[] = [];

  for (const nombreProp of Object.keys(set.propiedades)) {
    const valorDefault = set.defaultProps[nombreProp];
    const opciones: OpcionSpec[] = [];

    for (const opcion of set.propiedades[nombreProp]) {
      if (opcion === valorDefault) continue;
      const target = { ...set.defaultProps, [nombreProp]: opcion };
      const varianteOpcion = buscarVariante(set, target);
      if (!varianteOpcion) continue; // variante inexistente: se saltea
      const cambios = compararVariante(varianteDefault.raiz, varianteOpcion.raiz);
      opciones.push({ nombre: opcion, cambios });
    }

    specs.push({ nombre: nombreProp, tipo: "VARIANT", default: valorDefault, opciones });
  }

  return specs;
}
