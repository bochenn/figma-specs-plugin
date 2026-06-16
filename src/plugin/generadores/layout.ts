import type { LayoutSpec, NodoLike } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { unidadActual, etiquetaSpacing, textoPadding } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
import { marcasLayout, estiloCota, iconoDireccion, textoDimension } from "../utils/marcadores-layout.ts";
import { rectsGrid, textoGrid, gridSpecDe, franjasGridAutolayout } from "../utils/grilla.ts";
import { prefijoProfundidad } from "../utils/jerarquia.ts";
import type { GridSpec } from "../modelo/tipos.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };
const ROJO: RGB = { r: 1, g: 0.1, b: 0.3 };

// Versiones oscuras para los textos de las marcas (legibles sobre el gris).
const VERDE_TEXTO: RGB = { r: 0.05, g: 0.5, b: 0.2 };
const NARANJA_TEXTO: RGB = { r: 0.85, g: 0.4, b: 0 };

// Margen del artwork reservado para las anotaciones (arriba e izquierda).
// 80px: la cota vertical (44) + el número de la medida (hasta ~3 dígitos) deben
// entrar sin cortarse contra el borde izquierdo.
const MARGEN = 80;
const RESPIRO = 16; // borde derecho e inferior

// Texto de un atributo de color para el exhibit: "valor (raw)" o "valor".
function lineaColor(attr: { valor: string; rawValue?: string }): string {
  return attr.rawValue ? `${attr.valor} (${attr.rawValue})` : attr.valor;
}

// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 4);
  fila.appendChild(await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16));
  const u = unidadActual();
  fila.appendChild(await texto(`Width: ${textoDimension(spec.resizingHorizontal, spec.width, u, spec.widthVar)}`, 12));
  fila.appendChild(await texto(`Height: ${textoDimension(spec.resizingVertical, spec.height, u, spec.heightVar)}`, 12));
  if (spec.fill) fila.appendChild(await texto(`Fill: ${lineaColor(spec.fill)}`, 12));
  if (spec.stroke) fila.appendChild(await texto(`Stroke: ${lineaColor(spec.stroke)}`, 12));
  if (spec.direccion === "GRID") {
    fila.appendChild(await texto("Direction: Grid", 12));
    if (spec.gridColumnas !== undefined) fila.appendChild(await texto(`Columns: ${spec.gridColumnas}`, 12));
    if (spec.gridFilas !== undefined) fila.appendChild(await texto(`Rows: ${spec.gridFilas}`, 12));
    if (spec.gridColumnGap !== undefined) fila.appendChild(await texto(`Column gap: ${etiquetaSpacing(spec.gridColumnGap, u)}`, 12));
    if (spec.gridRowGap !== undefined) fila.appendChild(await texto(`Row gap: ${etiquetaSpacing(spec.gridRowGap, u)}`, 12));
    fila.appendChild(await texto(`Padding: ${textoPadding(spec.padding, u, spec.spacingVars)}`, 12));
    if (spec.cornerRadius) fila.appendChild(await texto(`Corner radius: ${etiquetaSpacing(spec.cornerRadius, u)}`, 12));
    return fila;
  }
  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  fila.appendChild(await texto(`Direction: ${direccion}`, 12));
  fila.appendChild(await texto(`Alignment: ${spec.alineacionPrimaria} / ${spec.alineacionContraria}`, 12));
  const sv = spec.spacingVars;
  fila.appendChild(await texto(`Padding: ${textoPadding(spec.padding, u, sv)}`, 12));
  fila.appendChild(await texto(`Item spacing: ${etiquetaSpacing(spec.itemSpacing, u, sv.itemSpacing)}`, 12));
  if (spec.cornerRadius) fila.appendChild(await texto(`Corner radius: ${etiquetaSpacing(spec.cornerRadius, u)}`, 12));
  for (const g of spec.grids) fila.appendChild(await texto(`Grid: ${textoGrid(g)}`, 12));
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

// Línea fina (rect de 1px) para ticks de las marcas.
function linea(x: number, y: number, w: number, h: number, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = x;
  r.y = y;
  r.resize(Math.max(w, 1), Math.max(h, 1));
  r.fills = [{ type: "SOLID", color }];
  artwork.appendChild(r);
}

// Texto chico de marca, coloreado; el caller lo posiciona después (necesita width/height).
async function textoMarca(valor: string, color: RGB, artwork: FrameNode): Promise<TextNode> {
  const t = await texto(valor, 10);
  t.fills = [{ type: "SOLID", color }];
  artwork.appendChild(t);
  return t;
}

// Texto del valor de una cota (azul), agregado al artwork; el caller lo posiciona.
async function textoCota(valor: string, artwork: FrameNode): Promise<TextNode> {
  const t = await texto(valor, 10);
  t.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.4, b: 0.85 } }];
  artwork.appendChild(t);
  return t;
}

const AZUL_HEX = "#0D66D9";
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
  const tW = await textoCota(etiquetaSpacing(spec.width, u, spec.widthVar), artwork);
  tW.x = MARGEN + clon.width / 2 - tW.width / 2;
  tW.y = MARGEN - 44 - 12;
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = MARGEN - 44;
  cotaV.y = MARGEN;
  artwork.appendChild(cotaV);
  const tH = await textoCota(etiquetaSpacing(spec.height, u, spec.heightVar), artwork);
  tH.x = MARGEN - 44 - tH.width - 2;
  tH.y = MARGEN + clon.height / 2 - tH.height / 2;
}

// Construye el artwork anotado de UN contenedor con Auto Layout: clon del
// subárbol + overlays de ese contenedor (hijos azules, padding verde, gaps
// naranjas). El clon va corrido (MARGEN, MARGEN) para dejar lugar a las
// anotaciones.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec): Promise<FrameNode> {
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
  for (const r of rectsPadding(frameRect, spec.padding)) rectOverlay(r, VERDE, 0.35, artwork);
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) rectOverlay(r, ROJO, 0.12, artwork);
    for (const r of filas) rectOverlay(r, ROJO, 0.12, artwork);
    await dibujarCotas(artwork, clon, spec);
    return artwork;
  }
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  for (const r of gaps) rectOverlay(r, NARANJA, 0.5, artwork);
  for (const g of spec.grids) {
    for (const r of rectsGrid(frameRect, g)) rectOverlay(r, ROJO, 0.12, artwork);
  }

  // Marcas numéricas: eje X arriba, eje Y a la izquierda, con ticks en los
  // bordes de cada banda.
  const { ejeX, ejeY } = marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto);
  for (const m of ejeX) {
    const color = m.tipo === "padding" ? VERDE_TEXTO : NARANJA_TEXTO;
    linea(m.desde, MARGEN - 12, 1, 12, color, artwork);
    linea(m.hasta - 1, MARGEN - 12, 1, 12, color, artwork);
    const t = await textoMarca(m.valor, color, artwork);
    t.x = m.x - t.width / 2;
    t.y = MARGEN - 26;
  }
  for (const m of ejeY) {
    const color = m.tipo === "padding" ? VERDE_TEXTO : NARANJA_TEXTO;
    linea(MARGEN - 12, m.desde, 12, 1, color, artwork);
    linea(MARGEN - 12, m.hasta - 1, 12, 1, color, artwork);
    const t = await textoMarca(m.valor, color, artwork);
    t.x = MARGEN - 16 - t.width;
    t.y = m.y - t.height / 2;
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
    for (const r of rectsGrid(frameRect, g)) rectOverlay(r, ROJO, 0.12, artwork);
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
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean): Promise<FrameNode> {
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
    fila.appendChild(await artworkDe(contenedores[i], specs[i]));
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
