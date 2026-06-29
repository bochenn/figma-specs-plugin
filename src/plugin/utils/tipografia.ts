import type { TypeFormat, LineHeightVal, LetterSpacingVal } from "../modelo/tipos.ts";
import { formatSpacing, currentUnit } from "./espaciado.ts";

// Value in px formatted per the current unit:
// px → "16" (Plain) o "16px" (CSS); rem → "1rem" en ambos.
function pxValue(n: number, withSuffix: boolean): string {
  if (currentUnit() === "rem") return formatSpacing(n, "rem");
  return withSuffix ? `${n}px` : String(n);
}

// Formats a node's typography (line-height and letter-spacing included) per the chosen format.
export function formatTypography(
  t: { family: string; style: string; size: number; lineHeight?: LineHeightVal; letterSpacing?: LetterSpacingVal },
  format: TypeFormat,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (format === "CSS") {
    let measure = pxValue(t.size, true);
    if (lh && lh.unit === "px") measure += `/${pxValue(lh.value ?? 0, true)}`;
    else if (lh && lh.unit === "percent") measure += `/${lh.value}%`;
    let s = `${measure} ${t.style} ${t.family}`;
    if (ls && ls.value !== 0) s += ` · LS ${ls.unit === "percent" ? `${ls.value}%` : pxValue(ls.value, true)}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${pxValue(t.size, false)}`;
  if (lh) {
    const lhStr = lh.unit === "auto" ? "auto" : lh.unit === "percent" ? `${lh.value}%` : pxValue(lh.value ?? 0, false);
    s += ` / ${lhStr}`;
  }
  if (ls && ls.value !== 0) s += ` · LS ${ls.unit === "percent" ? `${ls.value}%` : pxValue(ls.value, false)}`;
  return s;
}

let format: TypeFormat = "Plain";

// Sets the current typography format (default Plain).
export function applyTypeFormat(f: TypeFormat): void {
  format = f;
}

// Returns the current typography format.
export function currentTypeFormat(): TypeFormat {
  return format;
}
