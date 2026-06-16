import type { NodoLike, Atributo, AtributoCambiado, ParElementos, ElementoCambiado } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

// Indica si dos mapas prop→valor son exactamente iguales.
export function mismasProps(a: Record<string, string>, b: Record<string, string>): boolean {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((k) => a[k] === b[k]);
}

// Empareja elementos del default con los de la opción por nombre; los nombres
// repetidos se emparejan por orden de aparición. Los que no tienen contraparte
// quedan con un solo lado.
export function emparejar(a: NodoLike[], b: NodoLike[]): ParElementos[] {
  const pares: ParElementos[] = [];
  const usados = new Set<number>();

  for (const elemA of a) {
    let encontrado = -1;
    for (let i = 0; i < b.length; i++) {
      if (!usados.has(i) && b[i].name === elemA.name) {
        encontrado = i;
        break;
      }
    }
    if (encontrado >= 0) {
      usados.add(encontrado);
      pares.push({ default: elemA, opcion: b[encontrado] });
    } else {
      pares.push({ default: elemA });
    }
  }

  for (let i = 0; i < b.length; i++) {
    if (!usados.has(i)) pares.push({ opcion: b[i] });
  }

  return pares;
}

// Devuelve solo los atributos cuyo valor difiere entre default y opción,
// con ambos valores para poder mostrar el antes/después.
export function diffAtributos(attrsDefault: Atributo[], attrsOpcion: Atributo[]): AtributoCambiado[] {
  const claves = new Set<string>();
  for (const a of attrsDefault) claves.add(a.clave);
  for (const a of attrsOpcion) claves.add(a.clave);

  const cambios: AtributoCambiado[] = [];
  for (const clave of claves) {
    const aDef = attrsDefault.find((a) => a.clave === clave);
    const aOpc = attrsOpcion.find((a) => a.clave === clave);
    if (aDef?.valor !== aOpc?.valor) {
      const cambio: AtributoCambiado = { clave, valorDefault: aDef?.valor, valorOpcion: aOpc?.valor };
      if (aDef?.rawValue) cambio.rawValueDefault = aDef.rawValue;
      if (aOpc?.rawValue) cambio.rawValueOpcion = aOpc.rawValue;
      const swatch = aOpc?.swatchHex ?? aDef?.swatchHex;
      if (swatch) cambio.swatchHex = swatch;
      cambios.push(cambio);
    }
  }
  return cambios;
}

// Compara dos variantes (default vs opción) y devuelve los elementos que cambian.
export function compararVariante(defaultRaiz: NodoLike, opcionRaiz: NodoLike): ElementoCambiado[] {
  const cambios: ElementoCambiado[] = [];

  // La raíz de la variante en sí también puede cambiar (ej. el color de fondo
  // del componente), no solo sus hijos.
  const diffRaiz = diffAtributos(leerAtributos(defaultRaiz), leerAtributos(opcionRaiz));
  if (diffRaiz.length > 0) {
    cambios.push({ elementoNombre: defaultRaiz.name, estado: "modificado", atributos: diffRaiz });
  }

  const pares = emparejar(recorrer(defaultRaiz).map((r) => r.nodo), recorrer(opcionRaiz).map((r) => r.nodo));

  for (const par of pares) {
    if (par.default && par.opcion) {
      const diff = diffAtributos(leerAtributos(par.default), leerAtributos(par.opcion));
      if (diff.length > 0) {
        cambios.push({ elementoNombre: par.default.name, estado: "modificado", atributos: diff });
      }
    } else if (par.default) {
      cambios.push({ elementoNombre: par.default.name, estado: "removido", atributos: [] });
    } else if (par.opcion) {
      cambios.push({ elementoNombre: par.opcion.name, estado: "agregado", atributos: [] });
    }
  }

  return cambios;
}
