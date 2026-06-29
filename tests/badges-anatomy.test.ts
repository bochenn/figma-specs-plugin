import { test } from "node:test";
import assert from "node:assert";
import { placeBadges, type BBox } from "../src/plugin/utils/badges-anatomy.ts";

test("placeBadges: reproduce 'Mi Version' del caso pluginBox", () => {
  // pluginBox (root) con icon arriba-izquierda y spectTitle (que contiene Anatomy
  // y Elements) en la mitad inferior. Índices: 0 pluginBox, 1 icon, 2 spectTitle,
  // 3 Anatomy, 4 Elements. Esperado: pluginBox→top, icon→top, spectTitle→right,
  // Anatomy→left, Elements→bottom.
  const root: BBox = { x: 0, y: 0, w: 181, h: 88 };
  const boxes: (BBox | null)[] = [
    { x: 0, y: 0, w: 181, h: 88 },   // 0 pluginBox (== root)
    { x: 8, y: 8, w: 24, h: 24 },    // 1 icon (top-left)
    { x: 8, y: 40, w: 165, h: 40 },  // 2 spectTitle (lower half, full width)
    { x: 8, y: 40, w: 48, h: 16 },   // 3 Anatomy (left)
    { x: 8, y: 64, w: 165, h: 16 },  // 4 Elements (bottom)
  ];
  const sides = placeBadges(root, boxes, 24, 48).map((p) => p?.side);
  assert.deepEqual(sides, ["top", "top", "right", "left", "bottom"]);
});

test("placeBadges: índice sin box → null", () => {
  const root: BBox = { x: 0, y: 0, w: 100, h: 100 };
  const r = placeBadges(root, [null, { x: 10, y: 10, w: 20, h: 20 }], 24, 48);
  assert.equal(r[0], null);
  assert.ok(r[1]);
});
