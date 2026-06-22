import type { ElementoAnatomy, Atributo } from "../modelo/tipos.ts";
import { TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado, tarjeta, filaPill, chipVariable, FONT_BOLD, textoClave, textoValor, tagSeccion } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { HEADERS_ANATOMY, filaAnatomy } from "../utils/tabla-anatomy.ts";
import { hexARgb } from "../utils/color.ts";
import { nodoIconoTipo } from "./iconos.ts";
import { parseVariantes } from "../utils/anatomy-variantes.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Mapa id → caja (x/y/w/h) relativa a la esquina del nodo raíz.
function cajasRelativas(raiz: SceneNode): Map<string, { x: number; y: number; width: number; height: number }> {
  const mapa = new Map<string, { x: number; y: number; width: number; height: number }>();
  const base = raiz.absoluteBoundingBox;
  function walk(n: SceneNode): void {
    const b = n.absoluteBoundingBox;
    if (base && b) mapa.set(n.id, { x: b.x - base.x, y: b.y - base.y, width: b.width, height: b.height });
    if ("children" in n) for (const c of n.children) walk(c);
  }
  walk(raiz);
  return mapa;
}

// Paleta de colores de marcador (badge + borde), cicla por índice. Texto blanco.
const COLORES_MARCA: RGB[] = [
  hexARgb("#0D80FF"), // azul
  hexARgb("#FF2D9C"), // magenta
  hexARgb("#9747FF"), // violeta
  hexARgb("#F0411E"), // rojo
  hexARgb("#F5C518"), // amarillo
  hexARgb("#1FA855"), // verde
  hexARgb("#5E6B8A"), // slate
  hexARgb("#F5921E"), // naranja
];

// Borde punteado alrededor de la caja, del color del marcador.
function bordeMarca(caja: { x: number; y: number; width: number; height: number }, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = caja.x; r.y = caja.y;
  r.resize(Math.max(caja.width, 0.01), Math.max(caja.height, 0.01));
  r.fills = [];
  r.strokes = [{ type: "SOLID", color }];
  r.strokeWeight = 1;
  r.dashPattern = [4, 3];
  artwork.appendChild(r);
}

// Dibuja un atributo como fila-pill: swatch (si color) + "clave:" + valor/ChipVar + (raw).
async function filaAtributo(attr: Atributo): Promise<FrameNode> {
  const nodos: SceneNode[] = [];
  if (attr.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexARgb(attr.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: GRIS(0.8) }];
    swatch.strokeWeight = 1;
    nodos.push(swatch);
  }
  nodos.push(await textoClave(`${attr.clave}:`));
  if (attr.prefijo) nodos.push(await textoValor(attr.prefijo));
  if (attr.formato !== "HARDCODED") {
    nodos.push(await chipVariable(attr.valor));
    if (attr.rawValue) nodos.push(await textoValor(`(${attr.rawValue})`));
  } else {
    nodos.push(await textoValor(attr.valor));
  }
  return filaPill(nodos);
}

// Construye la entrada de un elemento como card (header + filas-pill).
async function entradaLista(indice: number, el: ElementoAnatomy, color: RGB): Promise<FrameNode> {
  const headerNodos: SceneNode[] = [await badgePanel(indice, color)];
  const icono = nodoIconoTipo(el.tipo);
  if (icono) headerNodos.push(icono);
  headerNodos.push(await texto(`${el.nombre} · ${el.tipo}`, 16, FONT_BOLD));

  const filas: FrameNode[] = [];
  const variantes = parseVariantes(el.dependeDe);
  if (variantes.length > 0) {
    for (const v of variantes) filas.push(filaPill([await textoClave(`${v.clave}:`), await textoValor(v.valor)]));
  } else if (el.dependeDe) {
    filas.push(filaPill([await textoValor(`Depends on: ${el.dependeDe}`)]));
  }
  for (const attr of el.atributos) filas.push(await filaAtributo(attr));
  return tarjeta(headerNodos, filas);
}

// Crea el badge del panel (círculo pequeño + número), sin posición absoluta.
async function badgePanel(numero: number, color: RGB): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color }];
  const num = await texto(String(numero), 11);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];
  const cont = figma.createFrame();
  cont.name = `Badge ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
  cont.clipsContent = false;
  cont.appendChild(circulo);
  cont.appendChild(num);
  num.x = (TAM_MARCADOR - num.width) / 2;
  num.y = (TAM_MARCADOR - num.height) / 2;
  return cont;
}

// Crea un marcador numerado (círculo + número).
async function marcador(numero: number, x: number, y: number, color: RGB): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color }];

  const num = await texto(String(numero), 14);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];

  const cont = figma.createFrame();
  cont.name = `Marcador ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
  cont.clipsContent = false;
  cont.appendChild(circulo);
  cont.appendChild(num);
  num.x = (TAM_MARCADOR - num.width) / 2;
  num.y = (TAM_MARCADOR - num.height) / 2;
  cont.x = x;
  cont.y = y;
  return cont;
}

// Construye el [Nombre] Spec (heading + sección Anatomy con lista + artwork).
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(await seccionDeAnatomy(seleccionado, elementos, tabla));
  return spec;
}

// Construye solo la sección Anatomy (sin Specifications ni título de nodo).
export async function seccionDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const seccion = frameVertical("Anatomy", 24);
  seccion.appendChild(await tagSeccion("Anatomy"));

  // Display horizontal: lista a la izquierda, artwork a la derecha.
  const display = figma.createFrame();
  display.name = "Display";
  display.layoutMode = "HORIZONTAL";
  display.itemSpacing = 64;
  display.primaryAxisSizingMode = "AUTO";
  display.counterAxisSizingMode = "AUTO";
  display.fills = [];
  seccion.appendChild(display);

  // Artwork: clon del seleccionado + marcadores (va a la IZQUIERDA).
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false; // los marcadores van fuera del borde izquierdo
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  display.appendChild(artwork);

  // Margen para que los badges de las capas pegadas al borde no se corten.
  const MARGEN_ARTWORK = 20;
  // Tamaño mínimo del canvas gris: un elemento chico queda centrado en una caja amplia.
  const ARTWORK_MIN = 440;
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  const canvasW = Math.max(ARTWORK_MIN, clon.width + 2 * MARGEN_ARTWORK);
  const canvasH = Math.max(ARTWORK_MIN, clon.height + 2 * MARGEN_ARTWORK);
  artwork.resize(canvasW, canvasH);
  const offsetX = (canvasW - clon.width) / 2;
  const offsetY = (canvasH - clon.height) / 2;
  clon.x = offsetX;
  clon.y = offsetY;

  // Un marcador por elemento, posicionado sobre la caja real de la capa (clon centrado).
  const cajas = cajasRelativas(seleccionado);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    const x = caja.x + offsetX;
    const y = caja.y + offsetY;
    bordeMarca({ x, y, width: caja.width, height: caja.height }, color, artwork);
    artwork.appendChild(await marcador(i + 1, x - 8, y - 8, color));
  }

  // Contenido: tabla o lista (va a la DERECHA).
  if (elementos.length === 0) {
    display.appendChild(await texto("Sin elementos detectados", 16));
  } else if (tabla) {
    display.appendChild(await tablaDe(HEADERS_ANATOMY, elementos.map((e, i) => filaAnatomy(i + 1, e))));
  } else {
    const lista = frameVertical("Content", 16);
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i], COLORES_MARCA[i % COLORES_MARCA.length]));
    }
    display.appendChild(lista);
  }

  return seccion;
}

// Genera el spec de Anatomy de un solo ítem. Devuelve el frame Specifications.
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Genera el spec del principal + un spec por cada instancia anidada.
export async function generarAnatomyConNested(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
  nested: { nodo: SceneNode; elementos: ElementoAnatomy[] }[],
  tabla: boolean,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos, tabla));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
