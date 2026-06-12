import { test } from "node:test";
import assert from "node:assert";
import {
  aplicarFormatoRaw, formatoRawActual,
  aplicarMostrarRaw, mostrarRawActual,
  aplicarPreferencia, preferenciaActual,
} from "../src/plugin/utils/valores.ts";

test("defaults: HEX, mostrar true, preferencia VARIABLE", () => {
  assert.equal(formatoRawActual(), "HEX");
  assert.equal(mostrarRawActual(), true);
  assert.equal(preferenciaActual(), "VARIABLE");
});

test("aplicarX cambia el estado y se puede restaurar", () => {
  aplicarFormatoRaw("RGB");
  aplicarMostrarRaw(false);
  aplicarPreferencia("STYLE");
  assert.equal(formatoRawActual(), "RGB");
  assert.equal(mostrarRawActual(), false);
  assert.equal(preferenciaActual(), "STYLE");
  aplicarFormatoRaw("HEX");
  aplicarMostrarRaw(true);
  aplicarPreferencia("VARIABLE");
});
