import type { ColeccionModes } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

const GRIS_CLARO: RGB = { r: 0.96, g: 0.96, b: 0.96 };

// Bloque de un mode: nombre + artwork (clon con el mode aplicado) + atributos.
async function bloqueMode(
  seleccionado: SceneNode,
  collection: VariableCollection | null,
  modeId: string,
  nombre: string,
  coleccion: ColeccionModes,
): Promise<FrameNode> {
  const bloque = frameVertical(nombre, 8);
  bloque.appendChild(await texto(nombre, 24));

  if (collection) {
    const clon = seleccionado.clone();
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = [{ type: "SOLID", color: GRIS_CLARO }];
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    if ("setExplicitVariableMode" in clon) {
      (clon as { setExplicitVariableMode(c: VariableCollection, m: string): void }).setExplicitVariableMode(collection, modeId);
    }
    artwork.resize(clon.width, clon.height);
    bloque.appendChild(artwork);
  }

  for (const attr of coleccion.atributos) {
    const v = attr.valores.find((x) => x.modeId === modeId);
    const valor = v ? v.valor : "—";
    bloque.appendChild(await texto(`${attr.appliedAs}: ${attr.variableNombre} (${valor})`, 12));
  }
  return bloque;
}

// Subsección de una collection: heading + un bloque por mode.
async function subseccionColeccion(seleccionado: SceneNode, coleccion: ColeccionModes): Promise<FrameNode> {
  const sub = frameVertical(coleccion.coleccionNombre, 40);
  sub.appendChild(await texto(coleccion.coleccionNombre, 36));
  const collection = coleccion.coleccionId
    ? figma.variables.getVariableCollectionById(coleccion.coleccionId)
    : null;
  for (const modo of coleccion.modos) {
    sub.appendChild(await bloqueMode(seleccionado, collection, modo.modeId, modo.nombre, coleccion));
  }
  return sub;
}

// Genera el output de Modes. Devuelve el frame Specifications.
export async function generarModes(seleccionado: SceneNode, colecciones: ColeccionModes[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Modes", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Modes", 48));

  if (colecciones.length === 0) {
    seccion.appendChild(await texto("No se detectaron variables con múltiples modes.", 16));
  }
  for (const c of colecciones) {
    seccion.appendChild(await subseccionColeccion(seleccionado, c));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
