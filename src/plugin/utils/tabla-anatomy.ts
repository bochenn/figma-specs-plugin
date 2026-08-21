import type { AnatomyElement } from "../modelo/tipos.ts";
import { depthPrefix } from "./jerarquia.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type", "Attributes"];

// Maps an element to a row of the Anatomy table (with its attributes
// flattened). Includes the resolved value (rawValue) of variables/styles, same as
// than the normal list.
export function anatomyRow(badgeNum: number, element: AnatomyElement): string[] {
  const attrs = element.attributes
    .map((a) => {
      let base = a.rawValue ? `${a.key}: ${a.value} (${a.rawValue})` : `${a.key}: ${a.value}`;
      if (a.detail) base += ` · ${a.detail}`;
      return a.visibilityOff ? `${base} · Visibility Off` : base;
    })
    .join(", ");
  const renombrada = element.instanceOf ? ` (Instance of: ${element.instanceOf})` : "";
  const name = depthPrefix(element.depth ?? 0) + element.name + renombrada;
  return [String(badgeNum), name, element.type, attrs];
}
