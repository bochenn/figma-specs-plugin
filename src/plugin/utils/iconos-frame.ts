import type { NodeLike } from "../modelo/tipos.ts";

// Counter-axis alignment → icon, for a HORIZONTAL Auto Layout (items sit top/center/bottom).
const HORIZONTAL: Record<string, string> = {
  MIN: "al-h-top", CENTER: "al-h-center", MAX: "al-h-bottom", BASELINE: "align-baseline",
};

// Counter-axis alignment → icon, for a VERTICAL Auto Layout (items sit left/center/right).
const VERTICAL: Record<string, string> = {
  MIN: "al-v-left", CENTER: "al-v-center", MAX: "al-v-right",
};

// Primary-axis alignment → icon, for a wrapping Auto Layout (rows sit left/center/right).
const WRAP: Record<string, string> = {
  MIN: "al-wrap-left", CENTER: "al-wrap-center", MAX: "al-wrap-right",
};

// Icon key that describes what kind of frame this is: absolute position, or the
// Auto Layout direction together with its alignment. Returns undefined for
// non-frames and for plain frames (they keep the generic frame icon).
export function frameIconKey(node: NodeLike): string | undefined {
  if (node.type !== "FRAME") return undefined;
  if (node.layoutPositioning === "ABSOLUTE") return "al-absolute";
  if (node.layoutMode === "GRID") return "dir-grid";
  if (node.layoutWrap === "WRAP") return WRAP[node.primaryAxisAlignItems ?? ""] ?? "al-wrap-left";
  if (node.layoutMode === "HORIZONTAL") return HORIZONTAL[node.counterAxisAlignItems ?? ""] ?? "dir-horizontal";
  if (node.layoutMode === "VERTICAL") return VERTICAL[node.counterAxisAlignItems ?? ""] ?? "dir-vertical";
  return undefined;
}
