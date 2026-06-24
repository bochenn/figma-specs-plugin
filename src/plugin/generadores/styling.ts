import type { FilaInventario } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, textoValor, textoClave, chipVariable, fillTematizado, BORDE_PILL } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { hexARgb } from "../utils/color.ts";

const COL_AS = 160;
const COL_TO = 280;
const CHIP = 12;
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 }; // #6B7280

// Texto gris chico para la descripción/observación bajo el título de cada tabla.
async function notaTabla(contenido: string): Promise<TextNode> {
  const t = await texto(contenido, 14);
  t.fills = [{ type: "SOLID", color: GRIS_DESC }];
  return t;
}

// Celda de datos: texto valor (mono, estilo itemValue), ancho fijo y wrap.
async function celda(contenido: string, ancho: number): Promise<TextNode> {
  const t = await textoValor(contenido);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Celda de header: etiqueta de columna en estilo clave (gris mono), ancho fijo.
async function celdaHeader(label: string, ancho: number): Promise<TextNode> {
  const t = await textoClave(label);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Celda Name: nombre del token como ChipVar en UNA línea (hug), con el swatch de
// color delante y el hex explícito detrás cuando hay color. La columna se alinea
// después fijando todas las celdas al ancho máximo (ver `tabla`).
async function celdaNombre(nombre: string, swatchHex: string | undefined): Promise<FrameNode> {
  const cont = frameHorizontal("Name", 8);
  cont.counterAxisAlignItems = "CENTER";
  if (swatchHex) {
    const sw = figma.createRectangle();
    sw.resize(CHIP, CHIP);
    sw.fills = [{ type: "SOLID", color: hexARgb(swatchHex) }];
    sw.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    sw.strokeWeight = 1;
    cont.appendChild(sw);
  }
  cont.appendChild(await chipVariable(nombre));
  if (swatchHex) cont.appendChild(await textoValor(`(${swatchHex})`));
  return cont;
}

// Fija el ancho de una celda (texto o frame) dejando el contenido a la izquierda.
function fijarAncho(nodo: FrameNode | TextNode, ancho: number): void {
  if (nodo.type === "TEXT") {
    nodo.resize(ancho, nodo.height);
  } else {
    nodo.primaryAxisSizingMode = "FIXED";
    nodo.resize(ancho, nodo.height);
  }
}

// Subsección con su tabla, o nota si no hay filas. La tabla se arma como Card
// (borde + radius + header con divisor inferior + body con padding), igual que
// las cards de Anatomy y Layout & Spacing. `nombreTabla` da el id del frame.
async function tabla(titulo: string, descripcion: string, filas: FilaInventario[], vacio: string, nombreTabla: string, observacion?: string): Promise<FrameNode> {
  const sub = frameVertical(titulo, 16);
  // Encabezado: título + descripción (+ observación si hay), juntos.
  const head = frameVertical("head", 8);
  head.appendChild(await texto(titulo, 36));
  head.appendChild(await notaTabla(descripcion));
  if (observacion) head.appendChild(await notaTabla(`Note: ${observacion}`));
  sub.appendChild(head);
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  // Celdas Name (chip en 1 línea); se mide el ancho máximo para alinear la columna.
  const headerName = await textoClave("Name");
  const nameCells = await Promise.all(filas.map((f) => celdaNombre(f.nombre, f.swatchHex)));
  let colName = headerName.width;
  for (const c of nameCells) colName = Math.max(colName, c.width);

  const card = frameVertical(nombreTabla, 0);
  card.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.fills = fillTematizado(varsTema().fondoSpec);
  card.clipsContent = true;

  // Header: etiquetas de columna (gris), con padding y divisor inferior.
  const header = frameHorizontal("Header", 16);
  header.counterAxisAlignItems = "CENTER";
  header.paddingTop = header.paddingBottom = 8;
  header.paddingLeft = header.paddingRight = 16;
  header.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;
  fijarAncho(headerName, colName);
  header.appendChild(headerName);
  header.appendChild(await celdaHeader("Applied as", COL_AS));
  header.appendChild(await celdaHeader("Applied to", COL_TO));
  card.appendChild(header);
  header.layoutSizingHorizontal = "FILL";

  // Body: filas de datos, con padding.
  const body = frameVertical("Body", 8);
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16;
  for (let i = 0; i < filas.length; i++) {
    const f = frameHorizontal("Fila", 16);
    f.counterAxisAlignItems = "CENTER";
    fijarAncho(nameCells[i], colName);
    f.appendChild(nameCells[i]);
    f.appendChild(await celda(filas[i].appliedAs, COL_AS));
    f.appendChild(await celda(filas[i].appliedTo, COL_TO));
    body.appendChild(f);
  }
  card.appendChild(body);
  body.layoutSizingHorizontal = "FILL";

  sub.appendChild(card);
  return sub;
}

// Genera el output de Styling Inventory con las tablas Variables, Color y Text styles.
export async function generarStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(await seccionDeStyling(nombre, filas));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye solo la sección Styling Inventory (sin Specifications ni título de nodo).
export async function seccionDeStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const seccion = frameVertical("Styling Inventory", 64);
  seccion.appendChild(await texto("Styling Inventory", 48));

  const variables = filas.filter((f) => f.tabla === "variable");
  const colorStyles = filas.filter((f) => f.tabla === "color");
  const textStyles = filas.filter((f) => f.tabla === "text");

  // Observación cuando algún token de color no tiene un swatch (gradiente / no sólido).
  const sinSwatch = "gradient or non-solid styles don't show a color swatch";
  const obsVariables = variables.some((f) => !f.swatchHex) ? sinSwatch : undefined;
  const obsColor = colorStyles.some((f) => !f.swatchHex) ? sinSwatch : undefined;

  seccion.appendChild(await tabla(
    "Variables",
    "Variables (design tokens) bound to this element and its layers, with their resolved value.",
    variables, "No variables", "variablesTable", obsVariables,
  ));
  seccion.appendChild(await tabla(
    "Color styles",
    "Color styles applied to the fills and strokes of this element.",
    colorStyles, "No color styles", "colorStylesTable", obsColor,
  ));
  seccion.appendChild(await tabla(
    "Text styles",
    "Text styles applied to the text layers of this element.",
    textStyles, "No text styles", "textStylesTable",
  ));

  return seccion;
}
