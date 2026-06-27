// Prefix for a layer that came from inside N instances: indent + "↳".
// depth 0 → "" (the component's own layer).
export function depthPrefix(depth: number): string {
  return depth > 0 ? "  ".repeat(depth) + "↳ " : "";
}
