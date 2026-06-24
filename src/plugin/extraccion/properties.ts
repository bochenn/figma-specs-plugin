import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm, DosWaySpec, CombinacionSpec, ElementoAdicional, VarianteLayout, NodoLike } from "../modelo/tipos.ts";
import { mismasProps, compararVariante } from "../comparacion/variantes.ts";
import { extraerAnatomy } from "./anatomy.ts";
import { layoutSpecDe, claveLayout } from "./layout.ts";

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
      // Primero el variante "default con solo esta prop cambiada"; si no existe
      // (matriz dispersa), cualquiera con ese valor, para mostrar cada versión.
      const varianteOpcion = buscarVariante(set, target)
        ?? set.variantes.find((v) => v.variantProperties[nombreProp] === opcion);
      if (!varianteOpcion) continue;
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

// Etiqueta legible de una variante a partir de sus props ("k=v, k2=v2").
function etiquetaVariante(props: Record<string, string>): string {
  return Object.entries(props).map(([k, v]) => `${k}=${v}`).join(", ");
}

// Lista los elementos que cada variante tiene y el default no (clave tipo|nombre).
export function extraerCompleteAnatomy(set: SetNorm): ElementoAdicional[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const defaultKeys = new Set(extraerAnatomy(varianteDefault.raiz).map((e) => `${e.tipo}|${e.nombre}`));
  const adicionales: ElementoAdicional[] = [];

  for (const variante of set.variantes) {
    if (mismasProps(variante.variantProperties, set.defaultProps)) continue;
    const etiqueta = etiquetaVariante(variante.variantProperties);
    for (const el of extraerAnatomy(variante.raiz)) {
      if (!defaultKeys.has(`${el.tipo}|${el.nombre}`)) {
        adicionales.push({ variante: etiqueta, nombre: el.nombre, tipo: el.tipo });
      }
    }
  }
  return adicionales;
}

// True si el nodo tiene Auto Layout (horizontal o vertical).
function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Variantes cuyo Auto Layout de la raíz difiere del default.
export function extraerCompleteLayout(set: SetNorm): VarianteLayout[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const claveDefault = tieneAutoLayout(varianteDefault.raiz)
    ? claveLayout(layoutSpecDe(varianteDefault.raiz))
    : null;

  const adicionales: VarianteLayout[] = [];
  for (const variante of set.variantes) {
    if (mismasProps(variante.variantProperties, set.defaultProps)) continue;
    if (!tieneAutoLayout(variante.raiz)) continue;
    const spec = layoutSpecDe(variante.raiz);
    if (claveDefault === null || claveLayout(spec) !== claveDefault) {
      adicionales.push({ variante: etiquetaVariante(variante.variantProperties), spec });
    }
  }
  return adicionales;
}
