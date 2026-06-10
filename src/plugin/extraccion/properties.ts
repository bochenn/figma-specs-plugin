import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm, DosWaySpec, CombinacionSpec } from "../modelo/tipos.ts";
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

// Compara todas las combinaciones de las dos primeras propiedades de variante
// contra el default. Devuelve null si hay menos de dos propiedades.
export function extraerDosWay(set: SetNorm): DosWaySpec | null {
  const props = Object.keys(set.propiedades);
  if (props.length < 2) return null;

  const p1 = props[0];
  const p2 = props[1];
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return null;

  const combinaciones: CombinacionSpec[] = [];
  for (const v1 of set.propiedades[p1]) {
    for (const v2 of set.propiedades[p2]) {
      const target = { ...set.defaultProps, [p1]: v1, [p2]: v2 };
      const variante = buscarVariante(set, target);
      if (!variante) continue;
      const cambios = compararVariante(varianteDefault.raiz, variante.raiz);
      combinaciones.push({ valor1: v1, valor2: v2, cambios });
    }
  }
  return { prop1: p1, prop2: p2, combinaciones };
}
