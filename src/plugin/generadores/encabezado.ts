// Encabezado de documento "Title & Heading": barra con nombre del plugin + sección,
// más el título del elemento y una descripción placeholder. Va arriba de cada sección.

import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB

// SF Pro (fuentes de sistema macOS) con fallback a Inter si no están en el archivo.
const FONT_BARRA: FontName[] = [{ family: "SF Pro Text", style: "Medium" }, { family: "Inter", style: "Semi Bold" }];
const FONT_TITULO: FontName[] = [{ family: "SF Pro Display", style: "Regular" }, { family: "Inter", style: "Bold" }];

// Barra superior: nombre del plugin (izq) + nombre de sección (der), con divisor inferior.
async function barraStatus(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = frameHorizontal("_Status", 0);
  barra.primaryAxisAlignItems = "SPACE_BETWEEN";
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingBottom = 12;
  barra.strokes = [{ type: "SOLID", color: BORDE_HEADER }];
  barra.strokeTopWeight = 0;
  barra.strokeLeftWeight = 0;
  barra.strokeRightWeight = 0;
  barra.strokeBottomWeight = 1;

  const izq = await texto(NOMBRE_PLUGIN, 13, FONT_BARRA);
  izq.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  const der = await texto(etiquetaSeccion.toUpperCase(), 13, FONT_BARRA);
  der.fills = [{ type: "SOLID", color: GRIS_OSCURO }];

  barra.appendChild(izq);
  barra.appendChild(der);
  return barra;
}

// Bloque título + descripción, indentado con padding lateral 64.
async function docHeading(nombreElemento: string): Promise<FrameNode> {
  const doc = frameVertical("_Doc/Heading", 24);
  doc.paddingLeft = doc.paddingRight = 64;
  doc.appendChild(await texto(nombreElemento, 36, FONT_TITULO));
  const desc = await texto(DESCRIPCION_PLACEHOLDER, 16);
  desc.fills = [{ type: "SOLID", color: GRIS_DESC }];
  doc.appendChild(desc);
  return doc;
}

// Encabezado "Title & Heading" completo. Se estira a FILL al appendearlo a su contenedor.
export async function tituloYEncabezado(nombreElemento: string, etiquetaSeccion: string): Promise<FrameNode> {
  const cont = frameVertical("Title & Heading", 64);

  const barra = await barraStatus(etiquetaSeccion);
  cont.appendChild(barra);
  barra.layoutSizingHorizontal = "FILL";

  const doc = await docHeading(nombreElemento);
  cont.appendChild(doc);
  doc.layoutSizingHorizontal = "FILL";

  return cont;
}
