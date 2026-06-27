import type { Unit } from "../modelo/tipos.ts";

// Rounds to at most 2 decimals (no trailing zeros).
function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Formats a value in px to the chosen format. `showUnit` adds "px" (rem always
// carries its unit). px without unit = bare number (for the artwork callouts).
export function formatSpacing(n: number, unit: Unit, showUnit = false): string {
  if (unit === "rem") return `${redondear2(n / 16)}rem`;
  const v = redondear2(n);
  return showUnit ? `${v}px` : `${v}`;
}

// "16" / "1rem" without variable; "DS Space/padding/1x (16)" with variable.
export function spacingLabel(px: number, unit: Unit, varName?: string): string {
  const v = formatSpacing(px, unit);
  return varName ? `${varName} (${v})` : v;
}

// Readable padding in CSS style: collapses equal sides. 4 equal → one value;
// vertical/horizontal pairs → "V H"; all different → "T R B L". Each side is
// formats with spacingLabel (respects unit and variable name).
export function paddingText(
  p: { left: number; top: number; right: number; bottom: number },
  unit: Unit,
  sv: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string } = {},
): string {
  const T = spacingLabel(p.top, unit, sv.paddingTop);
  const R = spacingLabel(p.right, unit, sv.paddingRight);
  const B = spacingLabel(p.bottom, unit, sv.paddingBottom);
  const L = spacingLabel(p.left, unit, sv.paddingLeft);
  if (T === R && R === B && B === L) return T;
  if (T === B && L === R) return `${T} ${R}`;
  return `${T} ${R} ${B} ${L}`;
}

let unit: Unit = "px";

// Sets the current unit (default px).
export function applyUnit(u: Unit): void {
  unit = u;
}

// Returns the current unit.
export function currentUnit(): Unit {
  return unit;
}
