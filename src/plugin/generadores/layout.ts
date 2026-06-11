import type { LayoutSpec } from "../modelo/tipos.ts";
import { frameVertical, texto, enColumnas } from "./frames.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };

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

// Recorre el clon (offset acumulado relativo a la raíz) dibujando overlays por
// cada frame con Auto Layout; frena en instancias.
function dibujarOverlays(node: SceneNode, offX: number, offY: number, artwork: FrameNode): void {
  if ("layoutMode" in node && (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL")) {
    const frameRect: Rect = { x: offX, y: offY, width: node.width, height: node.height };
    rectOverlay(frameRect, AZUL, 0.12, artwork);
    const padding = { left: node.paddingLeft, top: node.paddingTop, right: node.paddingRight, bottom: node.paddingBottom };
    for (const r of rectsPadding(frameRect, padding)) rectOverlay(r, VERDE, 0.35, artwork);
    const childrenRects: Rect[] = node.children.map((c) => ({ x: offX + c.x, y: offY + c.y, width: c.width, height: c.height }));
    for (const r of rectsSpacing(childrenRects, node.layoutMode)) rectOverlay(r, NARANJA, 0.5, artwork);
  }
  if (node.type === "INSTANCE") return;
  if ("children" in node) {
    for (const c of node.children) dibujarOverlays(c, offX + c.x, offY + c.y, artwork);
  }
}

// Genera el output de Layout and Spacing: artwork con overlays + exhibits de texto.
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  // Artwork: clon + overlays.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);
  dibujarOverlays(clon, 0, 0, artwork);
  seccion.appendChild(artwork);

  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    const exhibits: FrameNode[] = [];
    for (const s of specs) exhibits.push(await exhibit(s));
    seccion.appendChild(enColumnas(exhibits, columnas));
  } else {
    for (const s of specs) {
      seccion.appendChild(await exhibit(s));
    }
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
