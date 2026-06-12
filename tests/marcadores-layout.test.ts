import { test } from "node:test";
import assert from "node:assert";
import { marcasLayout } from "../src/plugin/utils/marcadores-layout.ts";
import { aplicarUnidad } from "../src/plugin/utils/espaciado.ts";

test("padding asimétrico + gap horizontal → marcas en ambos ejes", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 8, right: 24, bottom: 0 };
  const gaps = [{ x: 60, y: 8, width: 12, height: 84 }];
  const { ejeX, ejeY } = marcasLayout(frame, padding, gaps, "HORIZONTAL", false);
  assert.deepEqual(ejeX, [
    { x: 8, desde: 0, hasta: 16, valor: "16", tipo: "padding" },
    { x: 188, desde: 176, hasta: 200, valor: "24", tipo: "padding" },
    { x: 66, desde: 60, hasta: 72, valor: "12", tipo: "spacing" },
  ]);
  assert.deepEqual(ejeY, [
    { y: 4, desde: 0, hasta: 8, valor: "8", tipo: "padding" },
  ]);
});

test("gaps verticales van al eje Y", () => {
  const frame = { x: 0, y: 0, width: 100, height: 200 };
  const padding = { left: 0, top: 0, right: 0, bottom: 0 };
  const gaps = [{ x: 0, y: 50, width: 100, height: 20 }];
  const { ejeX, ejeY } = marcasLayout(frame, padding, gaps, "VERTICAL", false);
  assert.deepEqual(ejeX, []);
  assert.deepEqual(ejeY, [
    { y: 60, desde: 50, hasta: 70, valor: "20", tipo: "spacing" },
  ]);
});

test("spacingAuto → las marcas de spacing dicen Auto (el padding no)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 0, right: 0, bottom: 0 };
  const gaps = [{ x: 60, y: 0, width: 30, height: 100 }];
  const { ejeX } = marcasLayout(frame, padding, gaps, "HORIZONTAL", true);
  assert.equal(ejeX[0].valor, "16");
  assert.equal(ejeX[1].valor, "Auto");
});

test("respeta el offset del frame", () => {
  const frame = { x: 56, y: 56, width: 100, height: 100 };
  const padding = { left: 10, top: 0, right: 0, bottom: 0 };
  const { ejeX } = marcasLayout(frame, padding, [], "HORIZONTAL", false);
  assert.deepEqual(ejeX, [
    { x: 61, desde: 56, hasta: 66, valor: "10", tipo: "padding" },
  ]);
});

test("formatea con la unidad actual (rem)", () => {
  aplicarUnidad("rem");
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  const { ejeX } = marcasLayout(frame, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(ejeX[0].valor, "1rem");
  aplicarUnidad("px");
});
