import type { FilaInventario, TipoTexto, GradienteData } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, textoValor, textoClave, chipVariable, fillTematizado, BORDE_PILL } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { hexARgb } from "../utils/color.ts";
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";

const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 }; // #6B7280
const ANCHO_PREVIEW = 760; // ancho de wrap del texto de muestra
const MUESTRA = "The quick brown fox jumps over the lazy dog";

// Texto gris chico para la descripción/observación bajo el título de cada subsección.
async function notaTabla(contenido: string): Promise<TextNode> {
  const t = await texto(contenido, 14);
  t.fills = [{ type: "SOLID", color: GRIS_DESC }];
  return t;
}

// Card base de una entrada: borde + radius + padding.
function cardEntrada(name: string): FrameNode {
  const card = frameVertical(name, 16);
  card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 16;
  card.cornerRadius = 8;
  card.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  card.strokeWeight = 1;
  card.fills = fillTematizado(varsTema().fondoSpec);
  return card;
}

// Fila clave→valor: clave (gris) + valor. `anchoValor` fija el ancho y envuelve.
async function filaKV(clave: string, valor: string, anchoValor?: number): Promise<FrameNode> {
  const f = frameHorizontal("kv", 8);
  f.counterAxisAlignItems = "MIN";
  f.appendChild(await textoClave(`${clave}:`));
  const v = await textoValor(valor);
  if (anchoValor !== undefined) { v.textAutoResize = "HEIGHT"; v.resize(anchoValor, v.height); }
  f.appendChild(v);
  return f;
}

// "Applied as / Applied to" al pie de cada entrada (la info de dónde se usa).
async function aplicadoEn(fila: FilaInventario): Promise<FrameNode> {
  const b = frameVertical("appliedTo", 4);
  b.appendChild(await filaKV("Applied as", fila.appliedAs));
  b.appendChild(await filaKV("Applied to", fila.appliedTo, 600));
  return b;
}

function lhTexto(lh: TipoTexto["lineHeight"]): string | undefined {
  if (!lh) return undefined;
  if (lh.unidad === "auto") return "Auto";
  if (lh.unidad === "percent") return `${lh.valor}%`;
  return formatearEspaciado(lh.valor ?? 0, unidadActual(), true);
}
function lsTexto(ls: TipoTexto["letterSpacing"]): string | undefined {
  if (!ls) return undefined;
  if (ls.unidad === "percent") return `${ls.valor}%`;
  return formatearEspaciado(ls.valor, unidadActual(), true);
}

// Paint de gradiente a partir de los stops/transform capturados.
function paintGradiente(g: GradienteData): GradientPaint {
  return {
    type: g.type as GradientPaint["type"],
    gradientTransform: (g.gradientTransform ?? [[1, 0, 0], [0, 1, 0]]) as Transform,
    gradientStops: g.gradientStops.map((s) => ({ position: s.position, color: s.color })),
  };
}

// Entrada de color: swatch grande (sólido o gradiente) + nombre (ChipVar) + hex, con applied-where debajo.
async function entradaColor(fila: FilaInventario): Promise<FrameNode> {
  const card = cardEntrada(`${fila.tabla}: ${fila.nombre}`);
  const top = frameHorizontal("top", 16);
  top.counterAxisAlignItems = "CENTER";
  const sw = figma.createRectangle();
  sw.resize(56, 56);
  sw.cornerRadius = 8;
  if (fila.swatchHex) sw.fills = [{ type: "SOLID", color: hexARgb(fila.swatchHex) }];
  else if (fila.gradiente) sw.fills = [paintGradiente(fila.gradiente)];
  else sw.fills = [];
  sw.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  sw.strokeWeight = 1;
  top.appendChild(sw);
  const info = frameVertical("info", 6);
  info.appendChild(await chipVariable(fila.nombre));
  if (fila.swatchHex) info.appendChild(await textoValor(fila.swatchHex));
  else if (fila.gradiente) info.appendChild(await textoValor("Gradient"));
  top.appendChild(info);
  card.appendChild(top);
  if (fila.appliedTo) card.appendChild(await aplicadoEn(fila));
  return card;
}

// Entrada de text style: propiedades (izq) + preview en el estilo real (der), applied-where debajo.
async function entradaTexto(fila: FilaInventario): Promise<FrameNode> {
  const card = cardEntrada(`text: ${fila.nombre}`);
  const top = frameHorizontal("top", 48);
  top.counterAxisAlignItems = "MIN";
  const t = fila.tipo;

  const props = frameVertical("props", 6);
  if (t) {
    props.appendChild(await filaKV("Font family", t.family));
    props.appendChild(await filaKV("Font weight", t.estilo));
    props.appendChild(await filaKV("Font size", formatearEspaciado(t.size, unidadActual(), true)));
    const lh = lhTexto(t.lineHeight);
    if (lh) props.appendChild(await filaKV("Line height", lh));
    const ls = lsTexto(t.letterSpacing);
    if (ls) props.appendChild(await filaKV("Letter spacing", ls));
  }
  top.appendChild(props);

  const right = frameVertical("preview", 12);
  right.appendChild(await chipVariable(fila.nombre));
  if (t) {
    const muestra = await texto(MUESTRA, t.size, { family: t.family, style: t.estilo });
    if (t.lineHeight) {
      muestra.lineHeight = t.lineHeight.unidad === "auto" ? { unit: "AUTO" }
        : { value: t.lineHeight.valor ?? 0, unit: t.lineHeight.unidad === "percent" ? "PERCENT" : "PIXELS" };
    }
    if (t.letterSpacing) {
      muestra.letterSpacing = { value: t.letterSpacing.valor, unit: t.letterSpacing.unidad === "percent" ? "PERCENT" : "PIXELS" };
    }
    muestra.textAutoResize = "HEIGHT";
    muestra.resize(ANCHO_PREVIEW, muestra.height);
    right.appendChild(muestra);
  }
  top.appendChild(right);

  card.appendChild(top);
  if (fila.appliedTo) card.appendChild(await aplicadoEn(fila));
  return card;
}

// Subsección: título + descripción (+ observación) + lista de entradas (cards).
async function subseccion(titulo: string, descripcion: string, filas: FilaInventario[], vacio: string, nombreFrame: string, observacion?: string): Promise<FrameNode> {
  const sub = frameVertical(nombreFrame, 16);
  const head = frameVertical("head", 8);
  head.appendChild(await texto(titulo, 36));
  head.appendChild(await notaTabla(descripcion));
  if (observacion) head.appendChild(await notaTabla(`Note: ${observacion}`));
  sub.appendChild(head);
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  const lista = frameVertical("entries", 16);
  for (const fila of filas) {
    lista.appendChild(fila.tabla === "text" ? await entradaTexto(fila) : await entradaColor(fila));
  }
  sub.appendChild(lista);
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
// `total`: catálogo de todos los estilos del documento (sin applied-where) en vez
// de solo los del elemento seleccionado.
export async function seccionDeStyling(nombre: string, filas: FilaInventario[], total = false): Promise<FrameNode> {
  const seccion = frameVertical("Styling Inventory", 64);
  seccion.appendChild(await texto("Styling Inventory", 48));

  const variables = filas.filter((f) => f.tabla === "variable");
  const colorStyles = filas.filter((f) => f.tabla === "color");
  const textStyles = filas.filter((f) => f.tabla === "text");

  // Observación cuando algún token de color no tiene swatch ni gradiente (ej. imagen).
  const sinSwatch = "non-solid paints (e.g. image fills) don't show a color swatch";
  const obsVariables = variables.some((f) => !f.swatchHex && !f.gradiente) ? sinSwatch : undefined;
  const obsColor = colorStyles.some((f) => !f.swatchHex && !f.gradiente) ? sinSwatch : undefined;

  const desc = total
    ? {
        v: "All color variables (design tokens) in the document, with their resolved value.",
        c: "All color styles in the document.",
        t: "All text styles in the document.",
      }
    : {
        v: "Variables (design tokens) bound to this element and its layers, with their resolved value.",
        c: "Color styles applied to the fills and strokes of this element.",
        t: "Text styles applied to the text layers of this element.",
      };

  seccion.appendChild(await subseccion("Variables", desc.v, variables, "No variables", "variablesTable", obsVariables));
  seccion.appendChild(await subseccion("Color styles", desc.c, colorStyles, "No color styles", "colorStylesTable", obsColor));
  seccion.appendChild(await subseccion("Text styles", desc.t, textStyles, "No text styles", "textStylesTable"));

  return seccion;
}
