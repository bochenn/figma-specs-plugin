import type { ColeccionModes } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Bloque de un mode: su nombre + los atributos con su valor en ese mode.
async function bloqueMode(modeId: string, nombre: string, coleccion: ColeccionModes): Promise<FrameNode> {
  const bloque = frameVertical(nombre, 8);
  bloque.appendChild(await texto(nombre, 24));
  for (const attr of coleccion.atributos) {
    const v = attr.valores.find((x) => x.modeId === modeId);
    const valor = v ? v.valor : "—";
    bloque.appendChild(await texto(`${attr.appliedAs}: ${attr.variableNombre} (${valor})`, 12));
  }
  return bloque;
}

// Subsección de una collection: heading + un bloque por mode.
async function subseccionColeccion(coleccion: ColeccionModes): Promise<FrameNode> {
  const sub = frameVertical(coleccion.coleccionNombre, 40);
  sub.appendChild(await texto(coleccion.coleccionNombre, 36));
  for (const modo of coleccion.modos) {
    sub.appendChild(await bloqueMode(modo.modeId, modo.nombre, coleccion));
  }
  return sub;
}

// Genera el output de Modes. Devuelve el frame Specifications.
export async function generarModes(nombre: string, colecciones: ColeccionModes[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Modes", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Modes", 48));

  if (colecciones.length === 0) {
    seccion.appendChild(await texto("No se detectaron variables con múltiples modes.", 16));
  }
  for (const c of colecciones) {
    seccion.appendChild(await subseccionColeccion(c));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
