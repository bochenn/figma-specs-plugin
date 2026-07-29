import { test } from "node:test";
import assert from "node:assert";
import { readAttributes, borderIconKey, borderDetail } from "../src/plugin/utils/atributos.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("fill SOLID hardcoded → background-color HARDCODED con swatchHex", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "background-color"),
    { key: "background-color", value: "#FFFFFF", format: "HARDCODED", swatchHex: "#FFFFFF" },
  );
});

test("fill con variable → background-color VARIABLE con rawValue", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    fillVariableName: "Color/Action",
  };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "background-color"),
    { key: "background-color", value: "Color/Action", format: "VARIABLE", rawValue: "#000000", swatchHex: "#000000" },
  );
});

test("stroke SOLID → border-color", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
  };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "border-color"),
    { key: "border-color", value: "#000000", format: "HARDCODED", swatchHex: "#000000" },
  );
});

test("incluye width cuando está presente (sin swatch)", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "240px", format: "HARDCODED" },
  );
});

test("width con variable atada → VARIABLE + rawValue", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 343, widthVariableName: "DS Sizing/iOS width" };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "DS Sizing/iOS width", format: "VARIABLE", rawValue: "343px" },
  );
});

test("height sin variable → no aparece", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 200 };
  assert.equal(readAttributes(node).find((a) => a.key === "height"), undefined);
});

test("height con variable atada → aparece como VARIABLE", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 48, heightVariableName: "DS Sizing/button" };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "height"),
    { key: "height", value: "DS Sizing/button", format: "VARIABLE", rawValue: "48px" },
  );
});

test("incluye opacity como porcentaje cuando es menor a 1", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", opacity: 0.8 };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "opacity"),
    { key: "opacity", value: "80%", format: "HARDCODED" },
  );
});

test("opacity 1 (totalmente opaco) no se incluye", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", opacity: 1 };
  assert.equal(readAttributes(node).find((a) => a.key === "opacity"), undefined);
});

test("typography con style aplicado → row 'Text Style' (name) + properties de la fuente", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
    textStyleName: "Text SM/Medium",
  };
  const attrs = readAttributes(node);
  assert.deepEqual(
    attrs.find((a) => a.key === "Text Style"),
    { key: "Text Style", value: "Text SM/Medium", format: "STYLE" },
  );
  assert.deepEqual(
    attrs.find((a) => a.key === "Font Family"),
    { key: "Font Family", value: "Inter", format: "HARDCODED" },
  );
  assert.deepEqual(
    attrs.find((a) => a.key === "Font Weight"),
    { key: "Font Weight", value: "Medium", format: "HARDCODED" },
  );
  assert.equal(attrs.find((a) => a.key === "Font Size")?.value, "14px");
});

test("typography sin style → Text Style N/A + properties de la fuente", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
  };
  const attrs = readAttributes(node);
  assert.deepEqual(
    attrs.find((a) => a.key === "Text Style"),
    { key: "Text Style", value: "N/A", format: "HARDCODED" },
  );
  assert.equal(attrs.find((a) => a.key === "Font Family")?.value, "Inter");
});

test("width con layoutSizing FIXED → incluye prefix Fixed", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 67, layoutSizingHorizontal: "FIXED" };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "67px", format: "HARDCODED", prefix: "Fixed" },
  );
});

test("width con layoutSizing HUG → incluye prefix Hug", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 88, layoutSizingHorizontal: "HUG" };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "88px", format: "HARDCODED", prefix: "Hug" },
  );
});

test("width sin layoutSizing → sin prefix (igual que antes)", () => {
  const node: NodeLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "240px", format: "HARDCODED" },
  );
});

test("text con layoutSizing HUG → su width incluye prefix Hug", () => {
  const node: NodeLike = { id: "t", name: "t", type: "TEXT", width: 86, fontFamily: "Inter", fontSize: 14, layoutSizingHorizontal: "HUG" };
  assert.deepEqual(
    readAttributes(node).find((a) => a.key === "width"),
    { key: "width", value: "86px", format: "HARDCODED", prefix: "Hug" },
  );
});

test("text: agrega rows Alignment y Case", () => {
  const node: NodeLike = { id: "t", name: "t", type: "TEXT", fontFamily: "Inter", fontSize: 14, textAlign: "CENTER", textCase: "UPPER" };
  const attrs = readAttributes(node);
  assert.equal(attrs.find((a) => a.key === "Alignment")?.value, "Center");
  assert.equal(attrs.find((a) => a.key === "Case")?.value, "Uppercase");
});

test("text con letter-spacing 0 → muestra la row Letter Spacing", () => {
  const node: NodeLike = { id: "t", name: "t", type: "TEXT", fontFamily: "Inter", fontSize: 14, letterSpacing: { unit: "px", value: 0 } };
  assert.equal(readAttributes(node).find((a) => a.key === "Letter Spacing")?.value, "0px");
});

test("fill con visibility off → visibilityOff true", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, visible: false }],
  };
  const bg = readAttributes(node).find((a) => a.key === "background-color");
  assert.equal(bg?.visibilityOff, true);
  assert.equal(bg?.value, "#FF0000");
});

test("stroke con visibility off → visibilityOff true", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, visible: false }],
  };
  assert.equal(readAttributes(node).find((a) => a.key === "border-color")?.visibilityOff, true);
});

test("fill visible (o mixto) → sin visibilityOff", () => {
  const visible: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  assert.equal(readAttributes(visible).find((a) => a.key === "background-color")?.visibilityOff, undefined);
  const mixto: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    fills: [
      { type: "SOLID", color: { r: 1, g: 1, b: 1 }, visible: false },
      { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
    ],
  };
  assert.equal(readAttributes(mixto).find((a) => a.key === "background-color")?.visibilityOff, undefined);
});

test("borderIconKey: mapea lados activos al icono UI3", () => {
  const w = (top: number, right: number, bottom: number, left: number) => ({ top, right, bottom, left });
  assert.equal(borderIconKey(w(1, 1, 1, 1)), "border");
  assert.equal(borderIconKey(w(0, 0, 0, 0)), "border-none");
  assert.equal(borderIconKey(w(1, 0, 0, 0)), "border-top");
  assert.equal(borderIconKey(w(0, 1, 0, 0)), "border-right");
  assert.equal(borderIconKey(w(0, 0, 1, 0)), "border-bottom");
  assert.equal(borderIconKey(w(0, 0, 0, 1)), "border-left");
  assert.equal(borderIconKey(w(1, 1, 0, 0)), "border-top-right");
  assert.equal(borderIconKey(w(1, 0, 1, 0)), "border-top-bottom");
  assert.equal(borderIconKey(w(1, 0, 0, 1)), "border-top-left");
  assert.equal(borderIconKey(w(0, 1, 1, 0)), "border-bottom-right");
  assert.equal(borderIconKey(w(0, 1, 0, 1)), "border-left-right");
  assert.equal(borderIconKey(w(0, 0, 1, 1)), "border-bottom-left");
  assert.equal(borderIconKey(w(1, 1, 1, 0)), "border-top-right-bottom");
  assert.equal(borderIconKey(w(1, 1, 0, 1)), "border-top-left-right");
  assert.equal(borderIconKey(w(1, 0, 1, 1)), "border-top-left-bottom");
  assert.equal(borderIconKey(w(0, 1, 1, 1)), "border-bottom-left-right");
});

test("borderDetail: uniforme, por lado y dashed", () => {
  assert.equal(borderDetail({ top: 1, right: 1, bottom: 1, left: 1 }), "1px");
  assert.equal(borderDetail({ top: 1, right: 0, bottom: 0, left: 2 }), "top 1px · left 2px");
  assert.equal(borderDetail({ top: 2, right: 2, bottom: 2, left: 2 }, true), "2px · Dashed");
  assert.equal(borderDetail({ top: 0, right: 0, bottom: 0, left: 0 }, true), "Dashed");
  assert.equal(borderDetail({ top: 0, right: 0, bottom: 0, left: 0 }), "");
});

test("readAttributes: stroke con weights por lado → icon y detail en border-color", () => {
  const node: NodeLike = {
    id: "x", name: "x", type: "FRAME",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    strokeWeights: { top: 1, right: 0, bottom: 0, left: 0 },
    strokeDashed: true,
  };
  const bd = readAttributes(node).find((a) => a.key === "border-color");
  assert.equal(bd?.icon, "border-top");
  // un solo lado activo: el icono ya dice cuál; el detail solo lleva el espesor.
  assert.equal(bd?.detail, "1px · Dashed");
});
