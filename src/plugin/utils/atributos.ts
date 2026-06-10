import type { NodoLike, Atributo } from "../modelo/tipos.ts";

// Convierte un canal de color (0..1) a dos dígitos hex.
function canalHex(canal: number): string {
  return Math.round(canal * 255).toString(16).padStart(2, "0").toUpperCase();
}

function aHex(color: { r: number; g: number; b: number }): string {
  return "#" + canalHex(color.r) + canalHex(color.g) + canalHex(color.b);
}

// Aplica la prioridad variable > style > hardcoded para un atributo de color.
// Devuelve undefined si no hay un color resuelto (hex).
export function colorAtributo(
  clave: string,
  opts: { hex?: string; variableName?: string; styleName?: string },
): Atributo | undefined {
  if (!opts.hex) return undefined;
  if (opts.variableName) {
    return { clave, valor: opts.variableName, formato: "VARIABLE", rawValue: opts.hex, swatchHex: opts.hex };
  }
  if (opts.styleName) {
    return { clave, valor: opts.styleName, formato: "STYLE", rawValue: opts.hex, swatchHex: opts.hex };
  }
  return { clave, valor: opts.hex, formato: "HARDCODED", swatchHex: opts.hex };
}

// Devuelve el hex del primer paint SOLID de una lista, o undefined.
function hexSolido(
  paints: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }> | undefined,
): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? aHex(p.color) : undefined;
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
    atributos.push({ clave: "width", valor: String(nodo.width), formato: "HARDCODED" });
  }

  if (typeof nodo.opacity === "number" && nodo.opacity < 1) {
    atributos.push({ clave: "opacity", valor: Math.round(nodo.opacity * 100) + "%", formato: "HARDCODED" });
  }

  return atributos;
}
