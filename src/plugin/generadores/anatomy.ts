import type { ElementoAnatomy, Atributo } from "../modelo/tipos.ts";
import { TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado, chipVariable } from "./frames.ts";
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

// Paleta de colores de marcador (badge + borde), cicla por índice.
const COLORES_MARCA: RGB[] = [
  { r: 0.05, g: 0.4, b: 0.85 }, { r: 0.9, g: 0.2, b: 0.5 }, { r: 0.45, g: 0.3, b: 0.8 },
  { r: 0.95, g: 0.45, b: 0.1 }, { r: 0.1, g: 0.6, b: 0.4 },
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

// Dibuja un atributo: swatch (si es color) + "clave:" + valor. Si es variable/style,
// el valor va en chip gris (ChipVar) + (rawValue), igual que el panel de Layout.
async function filaAtributo(attr: Atributo): Promise<SceneNode> {
  const fila = frameHorizontal("Atributo", 6);
  fila.counterAxisAlignItems = "CENTER";
  if (attr.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexARgb(attr.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: GRIS(0.8) }];
    swatch.strokeWeight = 1;
    fila.appendChild(swatch);
  }
  fila.appendChild(await texto(`${attr.clave}:`, 12));
  if (attr.formato !== "HARDCODED") {
    fila.appendChild(await chipVariable(attr.valor));
    if (attr.rawValue) fila.appendChild(await texto(`(${attr.rawValue})`, 12));
  } else {
    fila.appendChild(await texto(attr.valor, 12));
  }
  return fila;
}

// Construye la entrada de un elemento en la lista de contenido.
async function entradaLista(indice: number, el: ElementoAnatomy, color: RGB): Promise<FrameNode> {
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  const header = frameHorizontal("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.appendChild(await badgePanel(indice, color));
  const icono = nodoIconoTipo(el.tipo);
  if (icono) header.appendChild(icono);
  header.appendChild(await texto(`${el.nombre} · ${el.tipo}`, 16));
  fila.appendChild(header);
  const variantes = parseVariantes(el.dependeDe);
  if (variantes.length > 0) {
    for (const v of variantes) fila.appendChild(await texto(`${v.clave}: ${v.valor}`, 12));
  } else if (el.dependeDe) {
    fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  }
  for (const attr of el.atributos) fila.appendChild(await filaAtributo(attr));
  return fila;
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
  const seccion = frameVertical("Anatomy", 64);
  seccion.appendChild(await texto("Anatomy", 48));

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
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN_ARTWORK;
  clon.y = MARGEN_ARTWORK;
  artwork.resize(clon.width + 2 * MARGEN_ARTWORK, clon.height + 2 * MARGEN_ARTWORK);

  // Un marcador por elemento, posicionado sobre la caja real de la capa.
  const cajas = cajasRelativas(seleccionado);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    const x = caja.x + MARGEN_ARTWORK;
    const y = caja.y + MARGEN_ARTWORK;
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
