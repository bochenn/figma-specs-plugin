import { test } from "node:test";
import assert from "node:assert";
import { colorAtributo } from "../src/plugin/utils/atributos.ts";
import { aplicarFormatoRaw, aplicarMostrarRaw, aplicarPreferencia } from "../src/plugin/utils/valores.ts";

test("solo hex → HARDCODED con swatchHex, sin rawValue", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#000000" }), {
    clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000",
  });
});

test("hex + variableName → VARIABLE con rawValue", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" }), {
    clave: "background-color", valor: "Color/Action", formato: "VARIABLE", rawValue: "#0E68D4", swatchHex: "#0E68D4",
  });
});

test("hex + styleName (sin variable) → STYLE", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#FFFFFF", styleName: "Brand/Surface" }), {
    clave: "background-color", valor: "Brand/Surface", formato: "STYLE", rawValue: "#FFFFFF", swatchHex: "#FFFFFF",
  });
});

test("variable + style → gana la variable", () => {
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.formato, "VARIABLE");
  assert.equal(a?.valor, "Color/Action");
});

test("sin hex → undefined", () => {
  assert.equal(colorAtributo("background-color", { variableName: "Color/Action" }), undefined);
});

test("rawValue respeta el formato raw (RGB)", () => {
  aplicarFormatoRaw("RGB");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, "rgb(14, 104, 212)");
  assert.equal(a?.swatchHex, "#0E68D4"); // el swatch sigue en hex crudo
  aplicarFormatoRaw("HEX");
});

test("mostrarRaw false → sin rawValue (pero con swatchHex)", () => {
  aplicarMostrarRaw(false);
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, undefined);
  assert.equal(a?.swatchHex, "#0E68D4");
  aplicarMostrarRaw(true);
});

test("preferencia STYLE + variable y style → gana el style", () => {
  aplicarPreferencia("STYLE");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.formato, "STYLE");
  assert.equal(a?.valor, "Brand/Surface");
  aplicarPreferencia("VARIABLE");
});

test("preferencia STYLE + solo variable → variable igual", () => {
  aplicarPreferencia("STYLE");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.formato, "VARIABLE");
  aplicarPreferencia("VARIABLE");
});
