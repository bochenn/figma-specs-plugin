import { test } from "node:test";
import assert from "node:assert";
import { gridSpecDe, rectsGrid, textoGrid } from "../src/plugin/utils/grilla.ts";

test("COLUMNS Stretch: reparte el ancho entre count con gutter y offset", () => {
  const frame = { x: 0, y: 0, width: 188, height: 100 };
  const grid = { patron: "COLUMNS" as const, alineacion: "STRETCH" as const, count: 4, gutter: 4, offset: 10 };
  assert.deepEqual(rectsGrid(frame, grid), [
    { x: 10, y: 0, width: 39, height: 100 },
    { x: 53, y: 0, width: 39, height: 100 },
    { x: 96, y: 0, width: 39, height: 100 },
    { x: 139, y: 0, width: 39, height: 100 },
  ]);
});

test("COLUMNS Min y Center con sectionSize", () => {
  const frame = { x: 0, y: 0, width: 200, height: 50 };
  const min = rectsGrid(frame, { patron: "COLUMNS", alineacion: "MIN", count: 2, sectionSize: 40, gutter: 8, offset: 6 });
  assert.deepEqual(min.map((r) => r.x), [6, 54]);
  const center = rectsGrid(frame, { patron: "COLUMNS", alineacion: "CENTER", count: 2, sectionSize: 40, gutter: 8 });
  assert.deepEqual(center.map((r) => r.x), [56, 104]);
});

test("ROWS Min: franjas horizontales sobre Y", () => {
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  const rects = rectsGrid(frame, { patron: "ROWS", alineacion: "MIN", count: 2, sectionSize: 20, gutter: 10, offset: 0 });
  assert.deepEqual(rects, [
    { x: 0, y: 0, width: 100, height: 20 },
    { x: 0, y: 30, width: 100, height: 20 },
  ]);
});

test("GRID: líneas de 1px cada sectionSize en ambos ejes", () => {
  const rects = rectsGrid({ x: 0, y: 0, width: 30, height: 20 }, { patron: "GRID", sectionSize: 10 });
  assert.deepEqual(rects, [
    { x: 10, y: 0, width: 1, height: 20 },
    { x: 20, y: 0, width: 1, height: 20 },
    { x: 0, y: 10, width: 30, height: 1 },
  ]);
});

test("count Infinity (Auto) llena lo que entra", () => {
  const frame = { x: 0, y: 0, width: 200, height: 50 };
  const rects = rectsGrid(frame, { patron: "COLUMNS", alineacion: "MIN", count: Infinity, sectionSize: 40, gutter: 8, offset: 0 });
  assert.deepEqual(rects.map((r) => r.x), [0, 48, 96, 144]);
});

test("datos inválidos → []", () => {
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  assert.deepEqual(rectsGrid(frame, { patron: "COLUMNS", alineacion: "STRETCH", count: 0, gutter: 0, offset: 0 }), []);
  assert.deepEqual(rectsGrid(frame, { patron: "COLUMNS", alineacion: "MIN", count: 2, sectionSize: 0, gutter: 0, offset: 0 }), []);
  assert.deepEqual(rectsGrid(frame, { patron: "GRID", sectionSize: 0 }), []);
});

test("gridSpecDe mapea GRID y COLUMNS crudos de Figma", () => {
  assert.deepEqual(gridSpecDe({ pattern: "GRID", sectionSize: 8 }), { patron: "GRID", sectionSize: 8 });
  assert.deepEqual(
    gridSpecDe({ pattern: "COLUMNS", alignment: "STRETCH", gutterSize: 20, count: 12, offset: 16 }),
    { patron: "COLUMNS", alineacion: "STRETCH", count: 12, gutter: 20, sectionSize: undefined, offset: 16 },
  );
});

test("textoGrid arma la línea del exhibit", () => {
  assert.equal(
    textoGrid({ patron: "COLUMNS", alineacion: "STRETCH", count: 12, gutter: 20, offset: 16 }),
    "Columns ×12 · gutter 20 · offset 16 · Stretch",
  );
  assert.equal(textoGrid({ patron: "GRID", sectionSize: 8 }), "Grid 8px");
  assert.equal(
    textoGrid({ patron: "ROWS", alineacion: "MIN", count: Infinity, sectionSize: 40, gutter: 0, offset: 0 }),
    "Rows ×Auto · alto 40 · Min",
  );
});
