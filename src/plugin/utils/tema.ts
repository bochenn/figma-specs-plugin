interface Tema {
  texto: RGB;        // color del texto generado
  fondo: RGB | null; // fondo del frame Specifications (null = transparente, light)
}

const LIGHT: Tema = { texto: { r: 0, g: 0, b: 0 }, fondo: null };
const DARK: Tema = { texto: { r: 0.95, g: 0.95, b: 0.95 }, fondo: { r: 0.12, g: 0.12, b: 0.14 } };

let actual: Tema = LIGHT;

// Setea el tema actual (light por default, dark si dark === true).
export function aplicarTema(dark: boolean): void {
  actual = dark ? DARK : LIGHT;
}

// Devuelve el tema actual.
export function temaActual(): Tema {
  return actual;
}
