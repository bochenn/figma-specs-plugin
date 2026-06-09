import type { LayoutSpec } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 4);
  fila.appendChild(await texto(`${spec.elementoNombre} · ${spec.tipo}`, 16));
  const direccion = spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
  fila.appendChild(await texto(`Direction: ${direccion}`, 12));
  fila.appendChild(await texto(`Alignment: ${spec.alineacionPrimaria} / ${spec.alineacionContraria}`, 12));
  fila.appendChild(await texto(`Resizing: ${spec.resizingHorizontal} × ${spec.resizingVertical}`, 12));
  const p = spec.padding;
  fila.appendChild(await texto(`Padding: L${p.left} T${p.top} R${p.right} B${p.bottom}`, 12));
  fila.appendChild(await texto(`Item spacing: ${spec.itemSpacing}`, 12));
  return fila;
}

// Genera el output de Layout and Spacing. Devuelve el frame Specifications.
export async function generarLayout(nombre: string, specs: LayoutSpec[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  }
  for (const s of specs) {
    seccion.appendChild(await exhibit(s));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
