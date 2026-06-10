import { test } from "node:test";
import assert from "node:assert";
import { colorAtributo } from "../src/plugin/utils/atributos.ts";

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
