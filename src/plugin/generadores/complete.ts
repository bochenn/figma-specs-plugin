import type { ElementoAdicional } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Genera el output de Complete Anatomy: una línea por elemento adicional.
export async function generarCompleteAnatomy(nombre: string, adicionales: ElementoAdicional[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Complete Anatomy", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Complete Anatomy", 48));

  if (adicionales.length === 0) {
    seccion.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  for (const a of adicionales) {
    seccion.appendChild(await texto(`${a.variante}: ${a.nombre} · ${a.tipo}`, 12));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
