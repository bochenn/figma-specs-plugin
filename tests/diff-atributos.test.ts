import { test } from "node:test";
import assert from "node:assert";
import { diffAttributes } from "../src/plugin/comparacion/variantes.ts";
import type { Attribute } from "../src/plugin/modelo/tipos.ts";

function attr(key: string, value: string): Attribute {
  return { key, value, format: "HARDCODED" };
}

test("attribute que cambia → incluido con ambos values", () => {
  const changes = diffAttributes([attr("background-color", "#888888")], [attr("background-color", "#0E68D4")]);
  assert.deepEqual(changes, [
    { key: "background-color", defaultValue: "#888888", optionValue: "#0E68D4" },
  ]);
});

test("attribute igual → omitido", () => {
  const changes = diffAttributes([attr("width", "100")], [attr("width", "100")]);
  assert.deepEqual(changes, []);
});

test("attribute presente solo en el default → incluido sin optionValue", () => {
  const changes = diffAttributes([attr("opacity", "50%")], []);
  assert.deepEqual(changes, [{ key: "opacity", defaultValue: "50%", optionValue: undefined }]);
});

test("attribute presente solo en la option → incluido sin defaultValue", () => {
  const changes = diffAttributes([], [attr("opacity", "50%")]);
  assert.deepEqual(changes, [{ key: "opacity", defaultValue: undefined, optionValue: "50%" }]);
});

test("attributes de color con swatchHex distintos → change con swatchHex de la opción", () => {
  const def: Attribute[] = [{ key: "background-color", value: "#808080", format: "HARDCODED", swatchHex: "#808080" }];
  const opc: Attribute[] = [{ key: "background-color", value: "#000000", format: "HARDCODED", swatchHex: "#000000" }];
  assert.deepEqual(diffAttributes(def, opc), [
    { key: "background-color", defaultValue: "#808080", optionValue: "#000000", swatchHex: "#000000" },
  ]);
});

test("change no-color → sin swatchHex", () => {
  const def: Attribute[] = [{ key: "width", value: "100", format: "HARDCODED" }];
  const opc: Attribute[] = [{ key: "width", value: "200", format: "HARDCODED" }];
  assert.deepEqual(diffAttributes(def, opc), [
    { key: "width", defaultValue: "100", optionValue: "200" },
  ]);
});

test("attributes VARIABLE con rawValue → change incluye el value resuelto de ambos lados", () => {
  const def: Attribute[] = [{ key: "background-color", value: "color/border", format: "VARIABLE", rawValue: "#A6ACB0", swatchHex: "#A6ACB0" }];
  const opc: Attribute[] = [{ key: "background-color", value: "color/surface", format: "VARIABLE", rawValue: "#FFFFFF", swatchHex: "#FFFFFF" }];
  assert.deepEqual(diffAttributes(def, opc), [
    {
      key: "background-color",
      defaultValue: "color/border", optionValue: "color/surface",
      rawValueDefault: "#A6ACB0", rawValueOption: "#FFFFFF",
      swatchHex: "#FFFFFF",
      formatDefault: "VARIABLE", formatOption: "VARIABLE",
    },
  ]);
});
