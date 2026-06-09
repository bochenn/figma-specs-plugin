import type { NodoLike, Atributo } from "../modelo/tipos.ts";

// Convierte un canal de color (0..1) a dos dígitos hex.
function canalHex(canal: number): string {
  return Math.round(canal * 255).toString(16).padStart(2, "0").toUpperCase();
}

function aHex(color: { r: number; g: number; b: number }): string {
  return "#" + canalHex(color.r) + canalHex(color.g) + canalHex(color.b);
}

// Lee los atributos visuales presentes en un nodo.
export function leerAtributos(nodo: NodoLike): Atributo[] {
  const atributos: Atributo[] = [];

  const fillSolido = nodo.fills?.find((f) => f.type === "SOLID" && f.color);
  if (fillSolido && fillSolido.color) {
    atributos.push({
      clave: "background-color",
      valor: aHex(fillSolido.color),
      formato: "HARDCODED",
    });
  }

  if (typeof nodo.width === "number") {
    atributos.push({ clave: "width", valor: String(nodo.width), formato: "HARDCODED" });
  }

  if (typeof nodo.opacity === "number" && nodo.opacity < 1) {
    atributos.push({
      clave: "opacity",
      valor: Math.round(nodo.opacity * 100) + "%",
      formato: "HARDCODED",
    });
  }

  return atributos;
}
