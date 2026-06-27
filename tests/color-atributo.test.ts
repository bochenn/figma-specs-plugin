import { test } from "node:test";
import assert from "node:assert";
import { attributeColor } from "../src/plugin/utils/atributos.ts";
import { applyRawFormat, applyShowRaw, applyPreference } from "../src/plugin/utils/valores.ts";

test("solo hex → HARDCODED con swatchHex, sin rawValue", () => {
  assert.deepEqual(attributeColor("background-color", { hex: "#000000" }), {
    key: "background-color", value: "#000000", format: "HARDCODED", swatchHex: "#000000",
  });
});

test("hex + variableName → VARIABLE con rawValue", () => {
  assert.deepEqual(attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action" }), {
    key: "background-color", value: "Color/Action", format: "VARIABLE", rawValue: "#0E68D4", swatchHex: "#0E68D4",
  });
});

test("hex + styleName (sin variable) → STYLE", () => {
  assert.deepEqual(attributeColor("background-color", { hex: "#FFFFFF", styleName: "Brand/Surface" }), {
    key: "background-color", value: "Brand/Surface", format: "STYLE", rawValue: "#FFFFFF", swatchHex: "#FFFFFF",
  });
});

test("variable + style → gana la variable", () => {
  const a = attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.format, "VARIABLE");
  assert.equal(a?.value, "Color/Action");
});

test("sin hex → undefined", () => {
  assert.equal(attributeColor("background-color", { variableName: "Color/Action" }), undefined);
});

test("rawValue respeta el format raw (RGB)", () => {
  applyRawFormat("RGB");
  const a = attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, "rgb(14, 104, 212)");
  assert.equal(a?.swatchHex, "#0E68D4"); // el swatch sigue en hex crudo
  applyRawFormat("HEX");
});

test("showRaw false → sin rawValue (pero con swatchHex)", () => {
  applyShowRaw(false);
  const a = attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, undefined);
  assert.equal(a?.swatchHex, "#0E68D4");
  applyShowRaw(true);
});

test("preference STYLE + variable y style → gana el style", () => {
  applyPreference("STYLE");
  const a = attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.format, "STYLE");
  assert.equal(a?.value, "Brand/Surface");
  applyPreference("VARIABLE");
});

test("preference STYLE + solo variable → variable igual", () => {
  applyPreference("STYLE");
  const a = attributeColor("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.format, "VARIABLE");
  applyPreference("VARIABLE");
});
