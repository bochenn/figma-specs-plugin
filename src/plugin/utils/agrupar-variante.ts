import type { ElementoAdicional } from "../modelo/tipos.ts";

export interface GrupoVariante {
  variante: string;
  elementos: ElementoAdicional[];
}

// Agrupa los elementos adicionales por variante, preservando el orden de
// primera aparición.
export function agruparPorVariante(elementos: ElementoAdicional[]): GrupoVariante[] {
  const grupos: GrupoVariante[] = [];
  for (const el of elementos) {
    const grupo = grupos.find((g) => g.variante === el.variante);
    if (grupo) grupo.elementos.push(el);
    else grupos.push({ variante: el.variante, elementos: [el] });
  }
  return grupos;
}
