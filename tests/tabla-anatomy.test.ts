import { test } from "node:test";
import assert from "node:assert";
import { anatomyRow, HEADERS_ANATOMY } from "../src/plugin/utils/tabla-anatomy.ts";
import type { AnatomyElement } from "../src/plugin/modelo/tipos.ts";

test("HEADERS_ANATOMY incluye la columna Attributes", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type", "Attributes"]);
});

test("anatomyRow sin attributes → celda de attributes vacía", () => {
  const el: AnatomyElement = { id: "1", name: "Label", type: "TEXT", isInstance: false, attributes: [] };
  assert.deepEqual(anatomyRow(1, el), ["1", "Label", "TEXT", ""]);
});

test("anatomyRow aplana los attributes como key: value", () => {
  const el: AnatomyElement = {
    id: "2",
    name: "Box",
    type: "FRAME",
    isInstance: false,
    attributes: [
      { key: "width", value: "120", format: "HARDCODED" },
      { key: "opacity", value: "50%", format: "HARDCODED" },
    ],
  };
  assert.deepEqual(anatomyRow(1, el), ["1", "Box", "FRAME", "width: 120, opacity: 50%"]);
});

test("anatomyRow incluye el value resuelto (rawValue) de variables/styles", () => {
  const el: AnatomyElement = {
    id: "3",
    name: "Card",
    type: "INSTANCE",
    isInstance: true,
    attributes: [
      { key: "background-color", value: "color/surface", format: "VARIABLE", rawValue: "#FFFFFF" },
      { key: "width", value: "sizing/card-width", format: "VARIABLE", rawValue: "240" },
    ],
  };
  assert.deepEqual(anatomyRow(1, el), [
    "1", "Card", "INSTANCE",
    "background-color: color/surface (#FFFFFF), width: sizing/card-width (240)",
  ]);
});
