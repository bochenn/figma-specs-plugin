import type { ColorFormat } from "../modelo/tipos.ts";

// Convierte "#RRGGBB" a RGB (canales 0..1).
export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// Convierte RGB (canales 0..1) a HSL (h: 0..360, s/l: 0..100), redondeado.
function rgbAHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Formats a hex "#RRGGBB" to the chosen format (HEX / RGB / HSL).
export function formatColor(hex: string, format: ColorFormat): string {
  if (format === "HEX") return hex.toUpperCase();
  const { r, g, b } = hexToRgb(hex);
  const R = Math.round(r * 255);
  const G = Math.round(g * 255);
  const B = Math.round(b * 255);
  if (format === "RGB") return `rgb(${R}, ${G}, ${B})`;
  const { h, s, l } = rgbAHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

let format: ColorFormat = "HEX";

// Sets the current color format (default HEX).
export function applyColorFormat(f: ColorFormat): void {
  format = f;
}

// Returns the current color format.
export function currentColorFormat(): ColorFormat {
  return format;
}
