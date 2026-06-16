// Prefijo para una capa que vino de adentro de N instancias: sangría + "↳".
// profundidad 0 → "" (capa propia del componente).
export function prefijoProfundidad(profundidad: number): string {
  return profundidad > 0 ? "  ".repeat(profundidad) + "↳ " : "";
}
