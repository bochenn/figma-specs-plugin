import type { LayoutSpec, NodoLike } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, enColumnas } from "./frames.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
import { marcasLayout, estiloCota, iconoDireccion } from "../utils/marcadores-layout.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };

// Versiones oscuras para los textos de las marcas (legibles sobre el gris).
const VERDE_TEXTO: RGB = { r: 0.05, g: 0.5, b: 0.2 };
const NARANJA_TEXTO: RGB = { r: 0.85, g: 0.4, b: 0 };

// Margen del artwork reservado para las anotaciones (arriba e izquierda).
const MARGEN = 56;
const RESPIRO = 16; // borde derecho e inferior

// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 4);
  fila.appendChild(await texto(`${spec.elementoNombre} · ${spec.tipo}`, 16));
  const direccion = spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
  fila.appendChild(await texto(`Direction: ${direccion}`, 12));
  fila.appendChild(await texto(`Alignment: ${spec.alineacionPrimaria} / ${spec.alineacionContraria}`, 12));
  fila.appendChild(await texto(`Resizing: ${spec.resizingHorizontal} × ${spec.resizingVertical}`, 12));
  const p = spec.padding;
  const E = (n: number) => formatearEspaciado(n, unidadActual());
  fila.appendChild(await texto(`Padding: L${E(p.left)} T${E(p.top)} R${E(p.right)} B${E(p.bottom)}`, 12));
  fila.appendChild(await texto(`Item spacing: ${E(spec.itemSpacing)}`, 12));
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

// Construye el artwork anotado de UN contenedor con Auto Layout: clon del
// subárbol + overlays de ese contenedor (hijos azules, padding verde, gaps
// naranjas). El clon va corrido (MARGEN, MARGEN) para dejar lugar a las
// anotaciones.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementoNombre}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];
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
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  for (const r of gaps) rectOverlay(r, NARANJA, 0.5, artwork);

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

  // Cotas azules de resizing (sin número): horizontal arriba, vertical a la izquierda.
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = MARGEN;
  cotaH.y = MARGEN - 44;
  artwork.appendChild(cotaH);
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = MARGEN - 44;
  cotaV.y = MARGEN;
  artwork.appendChild(cotaV);

  // Ícono de dirección, arriba a la izquierda del artwork.
  const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
  icono.x = 8;
  icono.y = 8;
  artwork.appendChild(icono);

  return artwork;
}

// Genera el output de Layout and Spacing: una fila artwork+exhibit por cada
// contenedor con Auto Layout (raíz + anidados; mismo orden que extraerLayout).
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  const contenedores = recorrerAutoLayout(seleccionado as unknown as NodoLike) as unknown as FrameNode[];

  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else {
    const filas: FrameNode[] = [];
    const n = Math.min(contenedores.length, specs.length);
    for (let i = 0; i < n; i++) {
      const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
      fila.appendChild(await artworkDe(contenedores[i], specs[i]));
      fila.appendChild(await exhibit(specs[i]));
      filas.push(fila);
    }
    if (columnas > 1) {
      seccion.appendChild(enColumnas(filas, columnas));
    } else {
      for (const f of filas) seccion.appendChild(f);
    }
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
