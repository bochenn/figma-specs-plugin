// Convierte un color (canales 0..1) a hex #RRGGBB en mayúsculas.
export function hexDeColor(rgb: { r: number; g: number; b: number }): string {
  const canal = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
  return "#" + canal(rgb.r) + canal(rgb.g) + canal(rgb.b);
}
