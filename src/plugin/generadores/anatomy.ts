import type { ElementoAnatomy, Atributo } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { HEADERS_ANATOMY, filaAnatomy } from "../utils/tabla-anatomy.ts";
import { hexARgb } from "../utils/color.ts";
import { prefijoProfundidad } from "../utils/jerarquia.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Dibuja un atributo: pill (swatch + texto) si es color; texto plano si no.
async function filaAtributo(attr: Atributo): Promise<SceneNode> {
  const linea = attr.rawValue ? `${attr.clave}: ${attr.valor} (${attr.rawValue})` : `${attr.clave}: ${attr.valor}`;
  if (!attr.swatchHex) {
    return await texto(linea, 12);
  }
  const fila = frameHorizontal("Atributo", 8);
  fila.counterAxisAlignItems = "CENTER";
  const swatch = figma.createRectangle();
  swatch.resize(12, 12);
  swatch.fills = [{ type: "SOLID", color: hexARgb(attr.swatchHex) }];
  swatch.strokes = [{ type: "SOLID", color: GRIS(0.8) }];
  swatch.strokeWeight = 1;
  fila.appendChild(swatch);
  fila.appendChild(await texto(linea, 12));
  return fila;
}

// Construye la entrada de un elemento en la lista de contenido.
async function entradaLista(indice: number, el: ElementoAnatomy): Promise<FrameNode> {
  const pref = prefijoProfundidad(el.profundidad ?? 0);
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  fila.appendChild(await texto(`${indice}. ${pref}${el.nombre} · ${el.tipo}`, 16));
  if (el.dependeDe) {
    fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  }
  for (const attr of el.atributos) {
    fila.appendChild(await filaAtributo(attr));
  }
  return fila;
}

// Crea un marcador numerado (círculo + número).
async function marcador(numero: number, x: number, y: number): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.4, b: 0.85 } }];

  const num = await texto(String(numero), 14);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];

  const cont = figma.createFrame();
  cont.name = `Marcador ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
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

  // Contenido: tabla o lista.
  if (elementos.length === 0) {
    display.appendChild(await texto("Sin elementos detectados", 16));
  } else if (tabla) {
    display.appendChild(await tablaDe(HEADERS_ANATOMY, elementos.map((e, i) => filaAnatomy(i + 1, e))));
  } else {
    const lista = frameVertical("Content", 16);
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i]));
    }
    display.appendChild(lista);
  }

  // Artwork: clon del seleccionado + marcadores.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false; // los marcadores van fuera del borde izquierdo
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  display.appendChild(artwork);

  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);

  // Un marcador por elemento, posicionado por su caja relativa al clon.
  for (let i = 0; i < elementos.length; i++) {
    const altura = elementos.length > 0 ? clon.height / elementos.length : 0;
    const caja = { x: 0, y: i * altura, width: clon.width, height: altura };
    const pos = posicionMarcador(caja);
    artwork.appendChild(await marcador(i + 1, pos.x, pos.y));
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
