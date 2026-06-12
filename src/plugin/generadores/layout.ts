import type { LayoutSpec, NodoLike } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, enColumnas } from "./frames.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };

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
