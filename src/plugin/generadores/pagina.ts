// Cáscara de página de cada sección: Header, Hero, Feature, Footer, el Badge
// "specifications" y el wrapper anatomyItem. Tocan figma.*. Reemplaza al viejo encabezado.ts.

import { frameVertical, frameHorizontal, texto, fillTematizado, FONT_MEDIUM, FONT_REG } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";

const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const BORDE_SHELL: RGB = { r: 0.882, g: 0.882, b: 0.882 }; // #E1E1E1
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const DESCRIPCION_ELEMENTO =
  "This is a placeholder description of what this element does in the project.";
export const ANCHO_PAGINA = 1980; // ancho mínimo de la página (puede crecer si el contenido es más ancho)

// Borde completo #E1E1E1, weight 1.
function bordeShell(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDE_SHELL }];
  f.strokeWeight = 1;
}

// Solo borde inferior #E1E1E1, weight 1.
function bordeInferior(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDE_SHELL }];
  f.strokeTopWeight = 0;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 1;
}

// Solo borde superior #E1E1E1, weight 1.
function bordeSuperior(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDE_SHELL }];
  f.strokeTopWeight = 1;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 0;
}

// Une las dos últimas palabras con un espacio duro para evitar que la última
// línea quede con una sola palabra huérfana al hacer wrap.
function sinHuerfano(s: string): string {
  const i = s.lastIndexOf(" ");
  return i < 0 ? s : s.slice(0, i) + " " + s.slice(i + 1);
}

// Texto gris de descripción (Inter Regular), preparado para FILL con wrap.
async function textoDesc(contenido: string, fontSize: number): Promise<TextNode> {
  const t = await texto(sinHuerfano(contenido), fontSize, FONT_REG);
  t.fills = [{ type: "SOLID", color: GRIS_DESC }];
  t.textAutoResize = "HEIGHT";
  return t;
}

// Barra horizontal de 1980 con fill de tema (sin borde; lo pone cada caller).
function barraShell(nombre: string, gap: number): FrameNode {
  const barra = frameHorizontal(nombre, gap);
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingTop = barra.paddingBottom = 32;
  barra.paddingLeft = barra.paddingRight = 100;
  barra.fills = fillTematizado(varsTema().fondoSpec);
  barra.primaryAxisSizingMode = "FIXED";
  return barra;
}

// pageHeader: nombre del plugin (FILL a la izquierda) + etiqueta de sección a la derecha. Solo borde inferior.
export async function header(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = barraShell("pageHeader", 32);
  bordeInferior(barra);

  const izq = await texto(NOMBRE_PLUGIN, 16, FONT_MEDIUM);
  barra.appendChild(izq);
  izq.layoutSizingHorizontal = "FILL"; // empuja la etiqueta hacia la derecha

  barra.appendChild(await texto(etiquetaSeccion.toUpperCase(), 16, FONT_MEDIUM));
  barra.resize(ANCHO_PAGINA, barra.height);
  return barra;
}

// pageFooter: nombre del plugin centrado. Solo borde superior.
export async function footer(): Promise<FrameNode> {
  const barra = barraShell("pageFooter", 32);
  bordeSuperior(barra);
  barra.primaryAxisAlignItems = "CENTER";
  barra.appendChild(await texto(NOMBRE_PLUGIN, 16, FONT_MEDIUM));
  barra.resize(ANCHO_PAGINA, barra.height);
  return barra;
}

// Badge "specifications": caja con borde, radius 8, Inter Medium 14.
export async function badgeSpecifications(): Promise<FrameNode> {
  const badge = frameHorizontal("Badge", 8);
  badge.counterAxisAlignItems = "CENTER";
  badge.paddingTop = badge.paddingBottom = 6;
  badge.paddingLeft = badge.paddingRight = 12;
  badge.cornerRadius = 8;
  badge.fills = fillTematizado(varsTema().fondoSpec);
  bordeShell(badge);
  badge.appendChild(await texto("SPECIFICATIONS", 14, FONT_MEDIUM));
  return badge;
}

// Hero: Badge + título de sección (Inter Medium 56) + descripción (Inter Regular 18).
export async function hero(titulo: string, descripcion: string): Promise<FrameNode> {
  const cont = frameVertical("pageHero", 56);
  cont.paddingTop = cont.paddingBottom = cont.paddingLeft = cont.paddingRight = 100;
  cont.fills = fillTematizado(varsTema().fondoSpec);
  bordeInferior(cont);
  cont.counterAxisSizingMode = "FIXED";
  cont.resize(ANCHO_PAGINA, cont.height);

  const heroHeader = frameVertical("heroHeader", 24);
  cont.appendChild(heroHeader);
  heroHeader.layoutSizingHorizontal = "FILL";

  const title = frameVertical("Title", 12);
  heroHeader.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  title.appendChild(await badgeSpecifications());
  title.appendChild(await texto(titulo, 56, FONT_MEDIUM));

  const desc = await textoDesc(descripcion, 18);
  heroHeader.appendChild(desc);
  // Ancho 50% del ancho útil del heroHeader (1780 → 890).
  desc.layoutSizingHorizontal = "FIXED";
  desc.resize(Math.round((ANCHO_PAGINA - 200) * 0.50), desc.height);
  return cont;
}

// Feature: nombre del elemento (Inter Medium 32) + descripción placeholder (Inter Regular 16).
export async function feature(nombreElemento: string): Promise<FrameNode> {
  const cont = frameVertical("Feature", 56);
  cont.paddingTop = 72;
  cont.paddingBottom = 0;
  cont.paddingLeft = cont.paddingRight = 100;
  cont.fills = fillTematizado(varsTema().fondoSpec);
  cont.counterAxisSizingMode = "FIXED";
  cont.resize(ANCHO_PAGINA, cont.height);

  const title = frameVertical("Title", 8);
  title.paddingBottom = 72;
  cont.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  bordeInferior(title);
  title.appendChild(await texto(nombreElemento, 32, FONT_MEDIUM));

  const desc = await textoDesc(DESCRIPCION_ELEMENTO, 16);
  title.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";
  return cont;
}

// Envuelve el contenido de una sección en un item (padding 72/100, gap 48).
// El contenido queda hug a la izquierda; el item se estira a FILL desde main.ts.
// `nombre` permite un id único por sección (ej. anatomyItem01, layoutspecItem01).
export function envolverItem(contenido: FrameNode, nombre = "anatomyItem"): FrameNode {
  const item = frameVertical(nombre, 48);
  item.paddingTop = item.paddingBottom = 72;
  item.paddingLeft = item.paddingRight = 100;
  item.fills = fillTematizado(varsTema().fondoSpec);
  item.appendChild(contenido);
  return item;
}
