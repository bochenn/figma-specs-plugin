import type { ElementoAdicional, VarianteLayout } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Genera el output de Complete (Anatomy + Layout): elementos adicionales por
// variante y variantes con Auto Layout de la raíz distinto al default.
export async function generarComplete(
  nombre: string,
  anatomy: ElementoAdicional[],
  layout: VarianteLayout[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));

  // Complete Anatomy
  const secA = frameVertical("Complete Anatomy", 64);
  spec.appendChild(secA);
  secA.appendChild(await texto("Complete Anatomy", 48));
  if (anatomy.length === 0) {
    secA.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  for (const a of anatomy) {
    secA.appendChild(await texto(`${a.variante}: ${a.nombre} · ${a.tipo}`, 12));
  }

  // Complete Layout
  const secL = frameVertical("Complete Layout", 64);
  spec.appendChild(secL);
  secL.appendChild(await texto("Complete Layout", 48));
  if (layout.length === 0) {
    secL.appendChild(await texto("No se detectaron layouts adicionales en otras variantes.", 16));
  }
  for (const v of layout) {
    const s = v.spec;
    const dir = s.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
    const bloque = frameVertical(v.variante, 4);
    bloque.appendChild(await texto(v.variante, 16));
    bloque.appendChild(await texto(
      `Direction: ${dir} · Align: ${s.alineacionPrimaria}/${s.alineacionContraria} · Resize: ${s.resizingHorizontal}×${s.resizingVertical} · Padding: L${s.padding.left} T${s.padding.top} R${s.padding.right} B${s.padding.bottom} · Item spacing: ${s.itemSpacing}`,
      12,
    ));
    secL.appendChild(bloque);
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
