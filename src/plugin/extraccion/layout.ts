// Traduce el valor de alineación de Figma a texto legible.
export function alineacion(valor: string | undefined): string {
  switch (valor) {
    case "CENTER": return "Center";
    case "MAX": return "End";
    case "SPACE_BETWEEN": return "Space between";
    case "BASELINE": return "Baseline";
    default: return "Start"; // "MIN" y ausentes
  }
}

// Traduce el valor de resizing de Figma a texto legible.
export function resizing(valor: string | undefined): string {
  switch (valor) {
    case "FILL": return "Fill";
    case "HUG": return "Hug";
    default: return "Fixed"; // "FIXED" y ausentes
  }
}
