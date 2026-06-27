import type { ExtraElement } from "../modelo/tipos.ts";

export interface VariantGroup {
  variant: string;
  elements: ExtraElement[];
}

// Groups the extra elements by variant, preserving the order of
// first appearance.
export function groupByVariant(elements: ExtraElement[]): VariantGroup[] {
  const groups: VariantGroup[] = [];
  for (const el of elements) {
    const group = groups.find((g) => g.variant === el.variant);
    if (group) group.elements.push(el);
    else groups.push({ variant: el.variant, elements: [el] });
  }
  return groups;
}
