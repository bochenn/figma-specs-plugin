import type { AnatomyJson } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

const ANCHO_JSON = 600;

// Genera el output de Data: el JSON de Anatomy en un text node.
// Devuelve el frame Specifications creado.
export async function generarData(nombre: string, json: AnatomyJson): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(await seccionDeData(nombre, json));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye solo la sección Data (JSON) (sin Specifications ni título de nodo).
export async function seccionDeData(nombre: string, json: AnatomyJson): Promise<FrameNode> {
  const seccion = frameVertical("Data (JSON)", 64);
  seccion.appendChild(await texto("Data (JSON)", 48));

  const jsonNode = await texto(JSON.stringify(json, null, 2), 14);
  // Ancho fijo con wrap: primero HEIGHT, después fijar el ancho.
  jsonNode.textAutoResize = "HEIGHT";
  jsonNode.resize(ANCHO_JSON, jsonNode.height);
  seccion.appendChild(jsonNode);

  return seccion;
}
