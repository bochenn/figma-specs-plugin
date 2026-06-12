import type { FormatoColor, Preferencia } from "../modelo/tipos.ts";

// Opciones de Custom Value Formats: formato del valor resuelto de
// variables/styles, si se muestra, y cuál gana si hay variable y style.

let formatoRaw: FormatoColor = "HEX";
let mostrarRaw = true;
let preferencia: Preferencia = "VARIABLE";

export function aplicarFormatoRaw(f: FormatoColor): void {
  formatoRaw = f;
}

export function formatoRawActual(): FormatoColor {
  return formatoRaw;
}

export function aplicarMostrarRaw(b: boolean): void {
  mostrarRaw = b;
}

export function mostrarRawActual(): boolean {
  return mostrarRaw;
}

export function aplicarPreferencia(p: Preferencia): void {
  preferencia = p;
}

export function preferenciaActual(): Preferencia {
  return preferencia;
}
