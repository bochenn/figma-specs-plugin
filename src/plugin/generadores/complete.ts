import type { ElementoAdicional, VarianteLayout } from "../modelo/tipos.ts";
import { frameVertical, texto, enColumnas } from "./frames.ts";
import { agruparPorVariante } from "../utils/agrupar-variante.ts";
import { etiquetaSpacing, unidadActual, textoPadding } from "../utils/espaciado.ts";

// Apila los bloques o los reparte en columnas según el selector.
function agregarBloques(seccion: FrameNode, bloques: FrameNode[], columnas: number): void {
  if (bloques.length === 0) return;
  if (columnas > 1) {
    seccion.appendChild(enColumnas(bloques, columnas));
  } else {
    for (const b of bloques) seccion.appendChild(b);
  }
}

// Genera el output de Complete (Anatomy + Layout): elementos adicionales por
// variante y variantes con Auto Layout de la raíz distinto al default.
export async function generarComplete(
  nombre: string,
  anatomy: ElementoAdicional[],
  layout: VarianteLayout[],
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  for (const sec of await seccionDeComplete(nombre, anatomy, layout, columnas)) spec.appendChild(sec);
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye las dos secciones de Complete (Anatomy + Layout) y las devuelve como
// array, sin Specifications ni título de nodo.
export async function seccionDeComplete(
  nombre: string,
  anatomy: ElementoAdicional[],
  layout: VarianteLayout[],
  columnas: number,
): Promise<FrameNode[]> {
  // Complete Anatomy: un bloque por variante con sus elementos adicionales.
  const secA = frameVertical("Complete Anatomy", 64);
  secA.appendChild(await texto("Complete Anatomy", 48));
  if (anatomy.length === 0) {
    secA.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  const bloquesA: FrameNode[] = [];
  for (const grupo of agruparPorVariante(anatomy)) {
    const bloque = frameVertical(grupo.variante, 4);
    bloque.appendChild(await texto(grupo.variante, 16));
    for (const el of grupo.elementos) {
      bloque.appendChild(await texto(`${el.nombre} · ${el.tipo}`, 12));
    }
    bloquesA.push(bloque);
  }
  agregarBloques(secA, bloquesA, columnas);

  // Complete Layout: un bloque por variante.
  const secL = frameVertical("Complete Layout", 64);
  secL.appendChild(await texto("Complete Layout", 48));
  if (layout.length === 0) {
    secL.appendChild(await texto("No se detectaron layouts adicionales en otras variantes.", 16));
  }
  const bloquesL: FrameNode[] = [];
  for (const v of layout) {
    const s = v.spec;
    const dir = s.direccion === "HORIZONTAL" ? "Horizontal" : s.direccion === "GRID" ? "Grid" : "Vertical";
    const sv = s.spacingVars;
    const bloque = frameVertical(v.variante, 4);
    bloque.appendChild(await texto(v.variante, 16));
    bloque.appendChild(await texto(
      `Direction: ${dir} · Align: ${s.alineacionPrimaria}/${s.alineacionContraria} · Resize: ${s.resizingHorizontal}×${s.resizingVertical} · Padding: ${textoPadding(s.padding, unidadActual(), sv)} · Item spacing: ${etiquetaSpacing(s.itemSpacing, unidadActual(), sv.itemSpacing)}`,
      12,
    ));
    bloquesL.push(bloque);
  }
  agregarBloques(secL, bloquesL, columnas);

  return [secA, secL];
}
