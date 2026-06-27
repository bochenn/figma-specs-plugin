import { test } from "node:test";
import assert from "node:assert";
import { gridSpecOf, gridRects, gridText, autolayoutGridStripes } from "../src/plugin/utils/grilla.ts";

test("COLUMNS Stretch: reparte el width entre count con gutter y offset", () => {
  const frame = { x: 0, y: 0, width: 188, height: 100 };
  const grid = { pattern: "COLUMNS" as const, alignment: "STRETCH" as const, count: 4, gutter: 4, offset: 10 };
  assert.deepEqual(gridRects(frame, grid), [
    { x: 10, y: 0, width: 39, height: 100 },
    { x: 53, y: 0, width: 39, height: 100 },
    { x: 96, y: 0, width: 39, height: 100 },
    { x: 139, y: 0, width: 39, height: 100 },
  ]);
});

test("COLUMNS Min y Center con sectionSize", () => {
  const frame = { x: 0, y: 0, width: 200, height: 50 };
  const min = gridRects(frame, { pattern: "COLUMNS", alignment: "MIN", count: 2, sectionSize: 40, gutter: 8, offset: 6 });
  assert.deepEqual(min.map((r) => r.x), [6, 54]);
  const center = gridRects(frame, { pattern: "COLUMNS", alignment: "CENTER", count: 2, sectionSize: 40, gutter: 8 });
  assert.deepEqual(center.map((r) => r.x), [56, 104]);
});

test("ROWS Min: stripes horizontales sobre Y", () => {
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  const rects = gridRects(frame, { pattern: "ROWS", alignment: "MIN", count: 2, sectionSize: 20, gutter: 10, offset: 0 });
  assert.deepEqual(rects, [
    { x: 0, y: 0, width: 100, height: 20 },
    { x: 0, y: 30, width: 100, height: 20 },
  ]);
});

test("GRID: líneas de 1px cada sectionSize en ambos ejes", () => {
  const rects = gridRects({ x: 0, y: 0, width: 30, height: 20 }, { pattern: "GRID", sectionSize: 10 });
  assert.deepEqual(rects, [
    { x: 10, y: 0, width: 1, height: 20 },
    { x: 20, y: 0, width: 1, height: 20 },
    { x: 0, y: 10, width: 30, height: 1 },
  ]);
});

test("count Infinity (Auto) llena lo que entra", () => {
  const frame = { x: 0, y: 0, width: 200, height: 50 };
  const rects = gridRects(frame, { pattern: "COLUMNS", alignment: "MIN", count: Infinity, sectionSize: 40, gutter: 8, offset: 0 });
  assert.deepEqual(rects.map((r) => r.x), [0, 48, 96, 144]);
});

test("datos inválidos → []", () => {
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  assert.deepEqual(gridRects(frame, { pattern: "COLUMNS", alignment: "STRETCH", count: 0, gutter: 0, offset: 0 }), []);
  assert.deepEqual(gridRects(frame, { pattern: "COLUMNS", alignment: "MIN", count: 2, sectionSize: 0, gutter: 0, offset: 0 }), []);
  assert.deepEqual(gridRects(frame, { pattern: "GRID", sectionSize: 0 }), []);
});

test("gridSpecOf mapea GRID y COLUMNS crudos de Figma", () => {
  assert.deepEqual(gridSpecOf({ pattern: "GRID", sectionSize: 8 }), { pattern: "GRID", sectionSize: 8 });
  assert.deepEqual(
    gridSpecOf({ pattern: "COLUMNS", alignment: "STRETCH", gutterSize: 20, count: 12, offset: 16 }),
    { pattern: "COLUMNS", alignment: "STRETCH", count: 12, gutter: 20, sectionSize: undefined, offset: 16 },
  );
});

test("gridText arma la línea del exhibit", () => {
  assert.equal(
    gridText({ pattern: "COLUMNS", alignment: "STRETCH", count: 12, gutter: 20, offset: 16 }),
    "Columns ×12 · gutter 20 · offset 16 · Stretch",
  );
  assert.equal(gridText({ pattern: "GRID", sectionSize: 8 }), "Grid 8px");
  assert.equal(
    gridText({ pattern: "ROWS", alignment: "MIN", count: Infinity, sectionSize: 40, gutter: 0, offset: 0 }),
    "Rows ×Auto · height 40 · Min",
  );
});

test("autolayoutGridStripes: reparte columns en el área de content", () => {
  const { columns, rows } = autolayoutGridStripes(
    { x: 0, y: 0, width: 800, height: 120 },
    { left: 16, top: 16, right: 16, bottom: 16 },
    12, 1, 20, 20,
  );
  assert.equal(columns.length, 12);
  assert.equal(columns[0].x, 16);
  assert.equal(Math.round(columns[0].width), 46); // (768 - 11*20)/12 = 45.67
  assert.equal(columns[0].y, 16);
  assert.equal(columns[0].height, 88); // 120 - 32
  assert.equal(Math.round(columns[1].x), 82); // 16 + 45.67 + 20
  assert.deepEqual(rows, []); // 1 row → sin stripes de row
});

test("autolayoutGridStripes: rows>1 genera stripes horizontales", () => {
  const { rows } = autolayoutGridStripes(
    { x: 0, y: 0, width: 100, height: 100 },
    { left: 0, top: 0, right: 0, bottom: 0 },
    1, 2, 0, 10,
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].y, 0);
  assert.equal(rows[0].height, 45); // (100 - 10)/2
  assert.equal(rows[1].y, 55);
});

test("autolayoutGridStripes: counts o tamaño inválido → vacío", () => {
  const r = autolayoutGridStripes({ x: 0, y: 0, width: 10, height: 10 }, { left: 0, top: 0, right: 0, bottom: 0 }, 0, 0, 0, 0);
  assert.deepEqual(r, { columns: [], rows: [] });
});
