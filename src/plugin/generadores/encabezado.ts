// Encabezado de documento "title-header": barra (_Status) con nombre del plugin + sección,
// más el bloque de título (_Doc/Heading) con título y descripción. Va arriba de cada sección.

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

// Texto de la barra (plugin o sección): SF Pro Text Medium 13, gris #374151.
async function textoBarra(contenido: string): Promise<TextNode> {
  const t = await texto(contenido, 13, FONT_BARRA);
  t.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  return t;
}

// Una mitad de la barra (Right/Left Side): se estira a FILL, con su alineación horizontal.
async function ladoBarra(nombre: string, align: "MIN" | "MAX", contenido: string): Promise<FrameNode> {
  const lado = frameHorizontal(nombre, 8);
  lado.primaryAxisAlignItems = align;
  lado.appendChild(await textoBarra(contenido));
  return lado;
}

// Barra superior _Status: plugin (izq) + sección (der) + divisor inferior.
async function barraStatus(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = frameHorizontal("title", 0);
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingBottom = 12;
  barra.paddingTop = 24;
  barra.strokes = [{ type: "SOLID", color: BORDE_HEADER }];
  barra.strokeTopWeight = 0;
  barra.strokeLeftWeight = 0;
  barra.strokeRightWeight = 0;
  barra.strokeBottomWeight = 1;

  // Nota: los nombres de frame "Right Side"/"Left Side" vienen del structure.pdf del
  // usuario (están cruzados respecto a su posición visual); las variables sí reflejan
  // qué contiene cada lado.
  const ladoPlugin = await ladoBarra("Right Side", "MIN", NOMBRE_PLUGIN);
  barra.appendChild(ladoPlugin);
  ladoPlugin.layoutSizingHorizontal = "FILL";

  const ladoSeccion = await ladoBarra("Left Side", "MAX", etiquetaSeccion.toUpperCase());
  barra.appendChild(ladoSeccion);
  ladoSeccion.layoutSizingHorizontal = "FILL";

  return barra;
}

// Bloque _Doc/Heading: Description (título 36 + descripción 16), con padding lateral 64.
async function docHeading(nombreElemento: string): Promise<FrameNode> {
  const doc = frameVertical("_Doc/Heading", 10);
  doc.paddingLeft = doc.paddingRight = 64;

  const desc = frameVertical("Description", 24);
  desc.appendChild(await texto(nombreElemento, 36, FONT_TITULO));
  const sub = await texto(DESCRIPCION_PLACEHOLDER, 16);
  sub.fills = [{ type: "SOLID", color: GRIS_DESC }];
  desc.appendChild(sub);

  doc.appendChild(desc);
  return doc;
}

// Encabezado "title-header" completo. Se estira a FILL al appendearlo a su contenedor.
export async function tituloYEncabezado(nombreElemento: string, etiquetaSeccion: string): Promise<FrameNode> {
  const cont = frameVertical("title-header", 64);

  const wrapper = frameVertical("wrapper", 8);
  wrapper.paddingLeft = wrapper.paddingRight = 64;
  const barra = await barraStatus(etiquetaSeccion);
  wrapper.appendChild(barra);
  barra.layoutSizingHorizontal = "FILL";
  cont.appendChild(wrapper);
  wrapper.layoutSizingHorizontal = "FILL";

  const doc = await docHeading(nombreElemento);
  cont.appendChild(doc);
  doc.layoutSizingHorizontal = "FILL";

  return cont;
}
