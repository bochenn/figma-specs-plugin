import type { StylingInventorySpec, EntradaEstilo } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

async function entradaEstilo(entrada: EntradaEstilo): Promise<FrameNode> {
  const fila = frameVertical(`${entrada.nombre} / ${entrada.aplicadoComo}`, 4);
  fila.appendChild(await texto(`${entrada.nombre}`, 14));
  fila.appendChild(await texto(`Applied as: ${entrada.aplicadoComo}`, 12));
  const aplicadoAStr =
    entrada.aplicadoA.length > 0 ? entrada.aplicadoA.join(", ") : "—";
  fila.appendChild(await texto(`Applied to: ${aplicadoAStr}`, 12));
  return fila;
}

async function subseccion(titulo: string, entradas: EntradaEstilo[]): Promise<FrameNode> {
  const cont = frameVertical(titulo, 12);
  cont.appendChild(await texto(titulo, 16));

  if (entradas.length === 0) {
    cont.appendChild(await texto("— None detected —", 12));
  } else {
    for (const entrada of entradas) {
      cont.appendChild(await entradaEstilo(entrada));
    }
  }
  return cont;
}

export async function generarStyling(
  nombre: string,
  spec: StylingInventorySpec,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const specFrame = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Styling Inventory", 64);

  specifications.appendChild(specFrame);
  specFrame.appendChild(await texto(nombre, 64));
  specFrame.appendChild(seccion);
  seccion.appendChild(await texto("Styling Inventory", 48));

  seccion.appendChild(await subseccion("Variables", spec.variables));
  seccion.appendChild(await subseccion("Text styles", spec.textStyles));
  seccion.appendChild(await subseccion("Color styles", spec.colorStyles));

  figma.currentPage.appendChild(specifications);
  return specifications;
}
