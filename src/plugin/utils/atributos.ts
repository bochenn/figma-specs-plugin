import type { NodoLike, Atributo, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";
import { formatearColor, formatoColorActual } from "./color.ts";
import { formatoRawActual, mostrarRawActual, preferenciaActual } from "./valores.ts";
import { formatearEspaciado, unidadActual } from "./espaciado.ts";

// Altura de línea para una fila propia: "Auto", "150%" o "20px".
function alturaLineaTexto(lh?: AlturaLinea): string | undefined {
  if (!lh) return undefined;
  if (lh.unidad === "auto") return "Auto";
  if (lh.unidad === "percent") return `${lh.valor}%`;
  return formatearEspaciado(lh.valor, unidadActual(), true);
}

// Tracking (letter-spacing) para una fila propia: "0%" o "0.5px".
function espaciadoLetraTexto(ls?: EspaciadoLetra): string | undefined {
  if (!ls) return undefined;
  if (ls.unidad === "percent") return `${ls.valor}%`;
  return formatearEspaciado(ls.valor, unidadActual(), true);
}

// Alineación horizontal del texto en texto legible.
function alineacionTexto(valor: string): string {
  if (valor === "CENTER") return "Center";
  if (valor === "RIGHT") return "Right";
  if (valor === "JUSTIFIED") return "Justified";
  return "Left"; // "LEFT"
}

// Transformación de caja (text case) en texto legible.
function casoTexto(valor: string): string {
  if (valor === "UPPER") return "Uppercase";
  if (valor === "LOWER") return "Lowercase";
  if (valor === "TITLE") return "Title case";
  if (valor === "SMALL_CAPS" || valor === "SMALL_CAPS_FORCED") return "Small caps";
  return "Original"; // "ORIGINAL"
}

// Convierte un canal de color (0..1) a dos dígitos hex.
function canalHex(canal: number): string {
  return Math.round(canal * 255).toString(16).padStart(2, "0").toUpperCase();
}

function aHex(color: { r: number; g: number; b: number }): string {
  return "#" + canalHex(color.r) + canalHex(color.g) + canalHex(color.b);
}

// Atributo de color: variable o style (según la preferencia cuando hay ambos),
// con el valor resuelto formateado según las opciones de Custom Value Formats;
// hardcoded si no hay ninguno. Devuelve undefined si no hay un color resuelto.
export function colorAtributo(
  clave: string,
  opts: { hex?: string; variableName?: string; styleName?: string },
): Atributo | undefined {
  const hex = opts.hex;
  if (!hex) return undefined;
  const nombrado = (valor: string, formato: "VARIABLE" | "STYLE"): Atributo => {
    const a: Atributo = { clave, valor, formato, swatchHex: hex };
    if (mostrarRawActual()) a.rawValue = formatearColor(hex, formatoRawActual());
    return a;
  };
  if (preferenciaActual() === "STYLE" && opts.styleName) return nombrado(opts.styleName, "STYLE");
  if (opts.variableName) return nombrado(opts.variableName, "VARIABLE");
  if (opts.styleName) return nombrado(opts.styleName, "STYLE");
  return { clave, valor: formatearColor(hex, formatoColorActual()), formato: "HARDCODED", swatchHex: hex };
}

// Devuelve el hex del primer paint SOLID de una lista, o undefined.
export function hexSolido(
  paints: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }> | undefined,
): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? aHex(p.color) : undefined;
}

// Mapea el modo de resizing de Figma a su etiqueta ("FIXED" → "Fixed", etc.).
function modoDeSizing(s?: string): string | undefined {
  if (s === "HUG") return "Hug";
  if (s === "FILL") return "Fill";
  if (s === "FIXED") return "Fixed";
  return undefined;
}

// Atributo de dimensión: VARIABLE (nombre + rawValue) si hay variable atada;
// HARDCODED (valor pelado) si no. `modo` agrega el prefijo de resizing si está.
function dimensionAtributo(clave: string, px: number, nombreVar?: string, modo?: string): Atributo {
  const valorFmt = formatearEspaciado(px, unidadActual(), true);
  const a: Atributo = nombreVar
    ? { clave, valor: nombreVar, formato: "VARIABLE", rawValue: valorFmt }
    : { clave, valor: valorFmt, formato: "HARDCODED" };
  const prefijo = modoDeSizing(modo);
  if (prefijo) a.prefijo = prefijo;
  return a;
}

// Lee los atributos visuales presentes en un nodo.
export function leerAtributos(nodo: NodoLike): Atributo[] {
  const atributos: Atributo[] = [];

  const bg = colorAtributo("background-color", {
    hex: hexSolido(nodo.fills),
    variableName: nodo.fillVariableName,
    styleName: nodo.fillStyleName,
  });
  if (bg) atributos.push(bg);

  const bd = colorAtributo("border-color", {
    hex: hexSolido(nodo.strokes),
    variableName: nodo.strokeVariableName,
    styleName: nodo.strokeStyleName,
  });
  if (bd) atributos.push(bd);

  if (typeof nodo.width === "number") {
    atributos.push(dimensionAtributo("width", nodo.width, nodo.widthVariableName, nodo.layoutSizingHorizontal));
  }

  if (typeof nodo.height === "number" && nodo.heightVariableName) {
    atributos.push(dimensionAtributo("height", nodo.height, nodo.heightVariableName, nodo.layoutSizingVertical));
  }

  if (typeof nodo.opacity === "number" && nodo.opacity < 1) {
    atributos.push({ clave: "opacity", valor: Math.round(nodo.opacity * 100) + "%", formato: "HARDCODED" });
  }

  if (nodo.fontFamily && typeof nodo.fontSize === "number") {
    // Text Style: el token aplicado, o "N/A" si el texto no tiene estilo asignado.
    atributos.push(nodo.textStyleName
      ? { clave: "Text Style", valor: nodo.textStyleName, formato: "STYLE" }
      : { clave: "Text Style", valor: "N/A", formato: "HARDCODED" });
    // Detalle de la tipografía: una propiedad por fila.
    atributos.push({ clave: "Font Family", valor: nodo.fontFamily, formato: "HARDCODED" });
    if (nodo.fontStyle) atributos.push({ clave: "Font Weight", valor: nodo.fontStyle, formato: "HARDCODED" });
    atributos.push({ clave: "Font Size", valor: formatearEspaciado(nodo.fontSize, unidadActual(), true), formato: "HARDCODED" });
    const lh = alturaLineaTexto(nodo.lineHeight);
    if (lh) atributos.push({ clave: "Line Height", valor: lh, formato: "HARDCODED" });
    const ls = espaciadoLetraTexto(nodo.letterSpacing);
    if (ls) atributos.push({ clave: "Letter Spacing", valor: ls, formato: "HARDCODED" });
    if (nodo.textAlign) atributos.push({ clave: "Alignment", valor: alineacionTexto(nodo.textAlign), formato: "HARDCODED" });
    if (nodo.textCase) atributos.push({ clave: "Case", valor: casoTexto(nodo.textCase), formato: "HARDCODED" });
  }

  return atributos;
}
