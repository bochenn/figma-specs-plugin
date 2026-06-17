import type { LayoutSpec, NodoLike } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { unidadActual, etiquetaSpacing, textoPadding } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
import { marcasLayout, estiloCota, iconoDireccion, valorDim, valorColor, valorSpacing, type ParteValor } from "../utils/marcadores-layout.ts";
import { rectsGrid, textoGrid, gridSpecDe, franjasGridAutolayout } from "../utils/grilla.ts";
import { prefijoProfundidad } from "../utils/jerarquia.ts";
import type { GridSpec } from "../modelo/tipos.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };
const ROJO: RGB = { r: 1, g: 0.1, b: 0.3 };

// Color semántico estilo DesignDoc: padding azul, gap rosa, dimensión rojo.
const CHIP_PADDING: RGB = { r: 0.05, g: 0.5, b: 1 };
const CHIP_GAP: RGB = { r: 0.9, g: 0.2, b: 0.5 };
const CHIP_DIM: RGB = { r: 0.95, g: 0.25, b: 0.15 };
const PADDING_BANDA: RGB = { r: 0.6, g: 0.78, b: 1 };
const GAP_BANDA: RGB = { r: 1, g: 0.7, b: 0.85 };

// Margen del artwork reservado para las anotaciones (arriba e izquierda).
// 80px: la cota vertical (44) + el número de la medida (hasta ~3 dígitos) deben
// entrar sin cortarse contra el borde izquierdo.
const MARGEN = 96;
const RESPIRO = 16; // borde derecho e inferior

// Íconos 12×12 (gris) por propiedad del panel.
const G_ICONO = "#666666";
const ICONOS_PROP: Record<string, string> = {
  width: `<line x1="1" y1="6" x2="11" y2="6" stroke="${G_ICONO}"/><line x1="1" y1="2" x2="1" y2="10" stroke="${G_ICONO}"/><line x1="11" y1="2" x2="11" y2="10" stroke="${G_ICONO}"/>`,
  height: `<line x1="6" y1="1" x2="6" y2="11" stroke="${G_ICONO}"/><line x1="2" y1="1" x2="10" y2="1" stroke="${G_ICONO}"/><line x1="2" y1="11" x2="10" y2="11" stroke="${G_ICONO}"/>`,
  direction: `<path d="M2 6 H10 M7 3 L10 6 L7 9" stroke="${G_ICONO}" fill="none"/>`,
  fill: `<rect x="2" y="2" width="8" height="8" fill="${G_ICONO}"/>`,
  stroke: `<rect x="2" y="2" width="8" height="8" stroke="${G_ICONO}" fill="none"/>`,
  align: `<line x1="2" y1="3" x2="10" y2="3" stroke="${G_ICONO}"/><line x1="2" y1="6" x2="7" y2="6" stroke="${G_ICONO}"/><line x1="2" y1="9" x2="9" y2="9" stroke="${G_ICONO}"/>`,
  padding: `<rect x="1" y="1" width="10" height="10" stroke="${G_ICONO}" fill="none"/><rect x="4" y="4" width="4" height="4" stroke="${G_ICONO}" fill="none"/>`,
  gap: `<rect x="1" y="3" width="3" height="6" fill="${G_ICONO}"/><rect x="8" y="3" width="3" height="6" fill="${G_ICONO}"/>`,
  corner: `<path d="M2 10 V5 A3 3 0 0 1 5 2 H10" stroke="${G_ICONO}" fill="none"/>`,
  columns: `<rect x="1" y="2" width="2" height="8" fill="${G_ICONO}"/><rect x="5" y="2" width="2" height="8" fill="${G_ICONO}"/><rect x="9" y="2" width="2" height="8" fill="${G_ICONO}"/>`,
  rows: `<rect x="2" y="1" width="8" height="2" fill="${G_ICONO}"/><rect x="2" y="5" width="8" height="2" fill="${G_ICONO}"/><rect x="2" y="9" width="8" height="2" fill="${G_ICONO}"/>`,
};
function svgIconoProp(key: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">${ICONOS_PROP[key]}</svg>`;
}

// Chip gris para una variable/style en el panel (nombre completo, texto oscuro).
async function chipVariable(nombre: string): Promise<FrameNode> {
  const c = frameHorizontal("ChipVar", 0);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = c.paddingRight = 5;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.92 } }];
  const t = await texto(nombre, 11);
  t.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  c.appendChild(t);
  return c;
}

// Lado derecho de una fila: textos y chips según las partes.
async function valorConChips(partes: ParteValor[]): Promise<FrameNode> {
  const f = frameHorizontal("Valor", 4);
  f.counterAxisAlignItems = "CENTER";
  for (const p of partes) {
    if ("chip" in p) f.appendChild(await chipVariable(p.chip));
    else f.appendChild(await texto(p.texto, 12));
  }
  return f;
}

// Fila del panel: [ícono + label] (ancho fijo) | valor.
async function filaPropiedad(iconoKey: string, label: string, partes: ParteValor[]): Promise<FrameNode> {
  const fila = frameHorizontal(`Prop ${label}`, 8);
  fila.counterAxisAlignItems = "CENTER";
  const izq = frameHorizontal("Label", 6);
  izq.counterAxisAlignItems = "CENTER";
  izq.primaryAxisSizingMode = "FIXED";
  izq.resize(150, 16);
  izq.counterAxisSizingMode = "AUTO";
  izq.appendChild(figma.createNodeFromSvg(svgIconoProp(iconoKey)));
  izq.appendChild(await texto(label, 12));
  fila.appendChild(izq);
  fila.appendChild(await valorConChips(partes));
  return fila;
}

// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 6);
  fila.appendChild(await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16));
  const u = unidadActual();
  const sv = spec.spacingVars;
  fila.appendChild(await filaPropiedad("width", "Width", valorDim(spec.resizingHorizontal, spec.width, u, spec.widthVar)));
  fila.appendChild(await filaPropiedad("height", "Height", valorDim(spec.resizingVertical, spec.height, u, spec.heightVar)));
  if (spec.fill) fila.appendChild(await filaPropiedad("fill", "Fill", valorColor(spec.fill)));
  if (spec.stroke) fila.appendChild(await filaPropiedad("stroke", "Stroke", valorColor(spec.stroke)));

  // Padding: chip si los 4 lados comparten variable y valor; si no, texto colapsado.
  const p = spec.padding;
  const padUniforme = !!sv.paddingLeft && sv.paddingLeft === sv.paddingTop && sv.paddingTop === sv.paddingRight && sv.paddingRight === sv.paddingBottom && p.left === p.top && p.top === p.right && p.right === p.bottom;
  const partesPadding: ParteValor[] = padUniforme ? valorSpacing(p.left, u, sv.paddingLeft) : [{ texto: textoPadding(p, u, sv) }];

  if (spec.direccion === "GRID") {
    fila.appendChild(await filaPropiedad("direction", "Direction", [{ texto: "Grid" }]));
    if (spec.gridColumnas !== undefined) fila.appendChild(await filaPropiedad("columns", "Columns", [{ texto: String(spec.gridColumnas) }]));
    if (spec.gridFilas !== undefined) fila.appendChild(await filaPropiedad("rows", "Rows", [{ texto: String(spec.gridFilas) }]));
    if (spec.gridColumnGap !== undefined) fila.appendChild(await filaPropiedad("gap", "Column gap", [{ texto: etiquetaSpacing(spec.gridColumnGap, u) }]));
    if (spec.gridRowGap !== undefined) fila.appendChild(await filaPropiedad("gap", "Row gap", [{ texto: etiquetaSpacing(spec.gridRowGap, u) }]));
    fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
    if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
    return fila;
  }

  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  fila.appendChild(await filaPropiedad("direction", "Direction", [{ texto: direccion }]));
  fila.appendChild(await filaPropiedad("align", "Alignment", [{ texto: `${spec.alineacionPrimaria} / ${spec.alineacionContraria}` }]));
  fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
  fila.appendChild(await filaPropiedad("gap", "Item spacing", valorSpacing(spec.itemSpacing, u, sv.itemSpacing)));
  if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
  for (const g of spec.grids) fila.appendChild(await filaPropiedad("columns", "Grid", [{ texto: textoGrid(g) }]));
  return fila;
}

// Dibuja un rect de overlay (semitransparente) en el artwork.
function rectOverlay(r: Rect, color: RGB, opacity: number, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity }];
  artwork.appendChild(rect);
}

// Banda overlay con fill claro + borde punteado del color (dimensiones del PRD).
function bandaPunteada(r: Rect, color: RGB, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity: 0.12 }];
  rect.strokes = [{ type: "SOLID", color }];
  rect.strokeWeight = 1;
  rect.dashPattern = [3, 3];
  artwork.appendChild(rect);
}

// Línea fina (rect de 1px) para ticks de las marcas.
function linea(x: number, y: number, w: number, h: number, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = x;
  r.y = y;
  r.resize(Math.max(w, 1), Math.max(h, 1));
  r.fills = [{ type: "SOLID", color }];
  artwork.appendChild(r);
}

// Chip de medida: frame con fondo de color y texto blanco; el caller lo posiciona.
async function chip(valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "Chip";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const t = await texto(valor, 9);
  t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}

const AZUL_HEX = "#F24026"; // las cotas son de dimensión → rojo (igual que el chip CHIP_DIM)
const GRIS_HEX = "#444444";

// Cota horizontal de `largo` px; las puntas codifican el resizing.
function svgCotaH(estilo: "fixed" | "fill" | "hug", largo: number): string {
  const L = largo;
  const base = `<line x1="0" y1="6" x2="${L}" y2="6" stroke="${AZUL_HEX}"/>`;
  const topes = `<line x1="0.5" y1="0" x2="0.5" y2="12" stroke="${AZUL_HEX}"/><line x1="${L - 0.5}" y1="0" x2="${L - 0.5}" y2="12" stroke="${AZUL_HEX}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M6 1 L1 6 L6 11" stroke="${AZUL_HEX}" fill="none"/><path d="M${L - 6} 1 L${L - 1} 6 L${L - 6} 11" stroke="${AZUL_HEX}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M2 1 L7 6 L2 11" stroke="${AZUL_HEX}" fill="none"/><path d="M${L - 2} 1 L${L - 7} 6 L${L - 2} 11" stroke="${AZUL_HEX}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="12">${base}${puntas}</svg>`;
}

// Cota vertical de `largo` px (misma idea, ejes intercambiados).
function svgCotaV(estilo: "fixed" | "fill" | "hug", largo: number): string {
  const L = largo;
  const base = `<line x1="6" y1="0" x2="6" y2="${L}" stroke="${AZUL_HEX}"/>`;
  const topes = `<line x1="0" y1="0.5" x2="12" y2="0.5" stroke="${AZUL_HEX}"/><line x1="0" y1="${L - 0.5}" x2="12" y2="${L - 0.5}" stroke="${AZUL_HEX}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M1 6 L6 1 L11 6" stroke="${AZUL_HEX}" fill="none"/><path d="M1 ${L - 6} L6 ${L - 1} L11 ${L - 6}" stroke="${AZUL_HEX}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M1 2 L6 7 L11 2" stroke="${AZUL_HEX}" fill="none"/><path d="M1 ${L - 2} L6 ${L - 7} L11 ${L - 2}" stroke="${AZUL_HEX}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="${L}">${base}${puntas}</svg>`;
}

// Íconos de dirección (24x24): flecha → / ↓, variante con grilla si hay wrap.
const ICONOS: Record<string, string> = {
  "flecha-h": `<path d="M3 12 H21 M15 6 L21 12 L15 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "flecha-v": `<path d="M12 3 V21 M6 15 L12 21 L18 15" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-h": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M14 17 H21 M18 14 L21 17 L18 20" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-v": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M17 14 V21 M14 18 L17 21 L20 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
};

function svgIcono(nombre: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${ICONOS[nombre]}</svg>`;
}

// Cotas azules de W/H con su valor numérico (resizing en las puntas, medida en
// el texto). Aplica a cualquier contenedor (H/V y GRID).
async function dibujarCotas(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec): Promise<void> {
  const u = unidadActual();
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = MARGEN;
  cotaH.y = MARGEN - 44;
  artwork.appendChild(cotaH);
  const tW = await chip(etiquetaSpacing(spec.width, u), CHIP_DIM, artwork);
  tW.x = MARGEN + clon.width / 2 - tW.width / 2;
  tW.y = MARGEN - 44 - 12;
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = MARGEN - 44;
  cotaV.y = MARGEN;
  artwork.appendChild(cotaV);
  const tH = await chip(etiquetaSpacing(spec.height, u), CHIP_DIM, artwork);
  tH.x = MARGEN - 44 - tH.width - 2;
  tH.y = MARGEN + clon.height / 2 - tH.height / 2;
}

// Cotas de ancho (arriba) y alto (izquierda) de un hijo directo, con su número.
async function dibujarCotaHijo(artwork: FrameNode, hijo: Rect): Promise<void> {
  const u = unidadActual();
  const cw = figma.createNodeFromSvg(svgCotaH("fixed", hijo.width));
  cw.x = hijo.x;
  cw.y = hijo.y - 14;
  artwork.appendChild(cw);
  const tw = await chip(etiquetaSpacing(hijo.width, u), CHIP_DIM, artwork);
  tw.x = hijo.x + hijo.width / 2 - tw.width / 2;
  tw.y = hijo.y - 14 - 12;
  const chh = figma.createNodeFromSvg(svgCotaV("fixed", hijo.height));
  chh.x = hijo.x - 14;
  chh.y = hijo.y;
  artwork.appendChild(chh);
  const th = await chip(etiquetaSpacing(hijo.height, u), CHIP_DIM, artwork);
  th.x = hijo.x - 14 - th.width - 2;
  th.y = hijo.y + hijo.height / 2 - th.height / 2;
}

// Construye el artwork anotado de UN contenedor con Auto Layout: clon del
// subárbol + overlays de ese contenedor (hijos azules, padding verde, gaps
// naranjas). El clon va corrido (MARGEN, MARGEN) para dejar lugar a las
// anotaciones.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec, medirHijos: boolean): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementoNombre}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const clon = contenedor.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN;
  clon.y = MARGEN;
  artwork.resize(clon.width + MARGEN + RESPIRO, clon.height + MARGEN + RESPIRO);

  const frameRect: Rect = { x: MARGEN, y: MARGEN, width: clon.width, height: clon.height };
  const hijosRects: Rect[] = contenedor.children.map((c) => ({
    x: MARGEN + c.x, y: MARGEN + c.y, width: c.width, height: c.height,
  }));
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  if (medirHijos) for (const h of hijosRects) await dibujarCotaHijo(artwork, h);
  for (const r of rectsPadding(frameRect, spec.padding)) bandaPunteada(r, PADDING_BANDA, artwork);
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) bandaPunteada(r, ROJO, artwork);
    for (const r of filas) bandaPunteada(r, ROJO, artwork);
    await dibujarCotas(artwork, clon, spec);
    return artwork;
  }
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  for (const r of gaps) bandaPunteada(r, GAP_BANDA, artwork);
  for (const g of spec.grids) {
    for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, artwork);
  }

  // Marcas numéricas: eje X arriba, eje Y a la izquierda, con ticks en los
  // bordes de cada banda.
  // Chips del artwork: nombre corto + valor (el nombre completo va en el panel).
  const { ejeX, ejeY } = marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars);
  for (const m of ejeX) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    linea(m.desde, MARGEN - 12, 1, 12, color, artwork);
    linea(m.hasta - 1, MARGEN - 12, 1, 12, color, artwork);
    const c = await chip(m.valor, color, artwork);
    c.x = m.x - c.width / 2;
    c.y = MARGEN - 14 - c.height;
  }
  for (const m of ejeY) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    linea(MARGEN - 12, m.desde, 12, 1, color, artwork);
    linea(MARGEN - 12, m.hasta - 1, 12, 1, color, artwork);
    const c = await chip(m.valor, color, artwork);
    c.x = MARGEN - 16 - c.width;
    c.y = m.y - c.height / 2;
  }

  // Cotas azules de W/H con su valor (horizontal arriba, vertical a la izquierda).
  await dibujarCotas(artwork, clon, spec);

  // Ícono de dirección, arriba a la izquierda del artwork.
  const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
  icono.x = 8;
  icono.y = 8;
  artwork.appendChild(icono);

  return artwork;
}

// Artwork de un frame con layout grids pero sin Auto Layout: clon + franjas
// rojas, sin marcadores ni cotas.
async function artworkGrids(frame: FrameNode, grids: GridSpec[]): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${frame.name}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const clon = frame.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width + RESPIRO, clon.height + RESPIRO);
  const frameRect: Rect = { x: 0, y: 0, width: clon.width, height: clon.height };
  for (const g of grids) {
    for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, artwork);
  }
  return artwork;
}

// Exhibit reducido de un frame con grids (nombre · tipo + líneas Grid).
async function exhibitGrids(frame: SceneNode, grids: GridSpec[]): Promise<FrameNode> {
  const fila = frameVertical(frame.name, 4);
  fila.appendChild(await texto(`${frame.name} · ${frame.type}`, 16));
  for (const g of grids) fila.appendChild(await texto(`Grid: ${textoGrid(g)}`, 12));
  return fila;
}

// Genera el output de Layout and Spacing: una fila artwork+exhibit por cada
// contenedor con Auto Layout (raíz + anidados; mismo orden que extraerLayout).
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean, medirHijos: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  const contenedores = recorrerAutoLayout(seleccionado as unknown as NodoLike, itemizar).map((r) => r.nodo) as unknown as FrameNode[];

  // Con hideOuter, se omite la fila del raíz (solo si la selección misma es el
  // primer contenedor; recorrerAutoLayout devuelve los nodos reales).
  const inicio = hideOuter && contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado ? 1 : 0;
  const filas: FrameNode[] = [];
  const n = Math.min(contenedores.length, specs.length);
  for (let i = inicio; i < n; i++) {
    const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
    fila.clipsContent = false; // los chips/cotas del artwork pueden asomar del margen
    fila.appendChild(await artworkDe(contenedores[i], specs[i], medirHijos));
    fila.appendChild(await exhibit(specs[i]));
    filas.push(fila);
  }

  // Raíz con layout grids pero sin Auto Layout: fila propia. No depende de
  // hideOuter: el grid de la pantalla es información propia, no una anotación de
  // layout del contenedor exterior (esas son padding/spacing/resizing).
  const raizEnFilas = contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado;
  // Acceso directo a layoutGrids (no `"layoutGrids" in seleccionado`): el `in`
  // sobre un nodo real de Figma no es confiable; acceder y chequear Array sí.
  const gridsRaizRaw = (seleccionado as { layoutGrids?: ReadonlyArray<Parameters<typeof gridSpecDe>[0]> }).layoutGrids;
  if (!raizEnFilas && Array.isArray(gridsRaizRaw)) {
    const gridsRaiz = gridsRaizRaw.map(gridSpecDe);
    if (gridsRaiz.length > 0) {
      const fila = frameHorizontal(`Layout ${seleccionado.name}`, 48);
      fila.clipsContent = false;
      fila.appendChild(await artworkGrids(seleccionado as FrameNode, gridsRaiz));
      fila.appendChild(await exhibitGrids(seleccionado, gridsRaiz));
      filas.unshift(fila);
    }
  }

  if (filas.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    seccion.appendChild(enColumnas(filas, columnas));
  } else {
    for (const f of filas) seccion.appendChild(f);
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
