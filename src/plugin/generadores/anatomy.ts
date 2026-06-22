import type { ElementoAnatomy, Atributo } from "../modelo/tipos.ts";
import { TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado, tarjeta, filaPill, chipVariable, FONT_BOLD, textoClave, textoValor, tagSeccion, FONT_MEDIUM, parrafoSeccion } from "./frames.ts";
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
  const num = await texto(String(numero), 11, FONT_MEDIUM);
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

  const num = await texto(String(numero), 14, FONT_MEDIUM);
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

// Línea guía vertical recta (del color del marcador): de `desdeY` a `haciaY` en la X dada.
function lineaGuiaV(artwork: FrameNode, x: number, desdeY: number, haciaY: number, color: RGB): void {
  const v = figma.createRectangle();
  v.x = x - 0.5;
  v.y = Math.min(desdeY, haciaY);
  v.resize(1, Math.max(Math.abs(haciaY - desdeY), 0.01));
  v.fills = [{ type: "SOLID", color }];
  artwork.appendChild(v);
}

// Línea guía horizontal recta (del color del marcador): de `desdeX` a `haciaX` en la Y dada.
function lineaGuiaH(artwork: FrameNode, desdeX: number, y: number, haciaX: number, color: RGB): void {
  const h = figma.createRectangle();
  h.x = Math.min(desdeX, haciaX);
  h.y = y - 0.5;
  h.resize(Math.max(Math.abs(haciaX - desdeX), 0.01), 1);
  h.fills = [{ type: "SOLID", color }];
  artwork.appendChild(h);
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
  seccion.appendChild(await parrafoSeccion("Desglosa el elemento en sus capas. Cada capa se numera sobre el diseño (a la izquierda) y se detalla a la derecha con su tipo y sus atributos —color, dimensiones, tipografía y las variables aplicadas—. Úsalo para entender de qué está compuesto el elemento y qué tokens del sistema usa cada parte."));

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
  // Distancia del marcador al borde de su box, y margen reservado para los marcadores.
  const OFFSET_MARCA = 48;
  const MARGEN_MARCA = OFFSET_MARCA + TAM_MARCADOR;
  // Tamaño mínimo del canvas gris: un elemento chico queda centrado en una caja amplia.
  const ARTWORK_MIN = 440;
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  const canvasW = Math.max(ARTWORK_MIN, clon.width + 2 * (MARGEN_ARTWORK + MARGEN_MARCA));
  const canvasH = Math.max(ARTWORK_MIN, clon.height + 2 * (MARGEN_ARTWORK + MARGEN_MARCA));
  artwork.resize(canvasW, canvasH);
  const offsetX = (canvasW - clon.width) / 2;
  const offsetY = (canvasH - clon.height) / 2;
  clon.x = offsetX;
  clon.y = offsetY;

  // Cada marcador va JUSTO AFUERA de su box con una línea recta corta:
  // por defecto a la izquierda (línea horizontal); si colisiona con otro ya puesto, arriba
  // (línea vertical). El número es el índice del elemento (coincide con la lista).
  const cajas = cajasRelativas(seleccionado);
  const colocados: { x: number; y: number }[] = [];
  const colisiona = (cx: number, cy: number): boolean =>
    colocados.some((m) => Math.abs(m.x - cx) < TAM_MARCADOR + 4 && Math.abs(m.y - cy) < TAM_MARCADOR + 4);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    const bx = caja.x + offsetX;
    const by = caja.y + offsetY;
    bordeMarca({ x: bx, y: by, width: caja.width, height: caja.height }, color, artwork);
    // Lado izquierdo (default): centro del marcador a la izquierda del box, en su centro vertical.
    let mcx = bx - OFFSET_MARCA - TAM_MARCADOR / 2;
    let mcy = by + caja.height / 2;
    let arriba = false;
    if (colisiona(mcx, mcy)) {
      // Lado superior: centro del marcador arriba del box, en su centro horizontal.
      mcx = bx + caja.width / 2;
      mcy = by - OFFSET_MARCA - TAM_MARCADOR / 2;
      arriba = true;
    }
    // 3+ marcadores en el mismo box: correrlo en el eje libre del carril hasta despejar.
    while (colisiona(mcx, mcy)) {
      if (arriba) mcx += TAM_MARCADOR + 4;
      else mcy += TAM_MARCADOR + 4;
    }
    if (arriba) lineaGuiaV(artwork, mcx, mcy + TAM_MARCADOR / 2, by, color);
    else lineaGuiaH(artwork, mcx + TAM_MARCADOR / 2, mcy, bx, color);
    artwork.appendChild(await marcador(i + 1, mcx - TAM_MARCADOR / 2, mcy - TAM_MARCADOR / 2, color));
    colocados.push({ x: mcx, y: mcy });
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
