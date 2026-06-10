import { test } from "node:test";
import assert from "node:assert";
import { rectsPadding } from "../src/plugin/utils/overlays.ts";

test("padding uniforme → 4 bandas (top, bottom, left, right)", () => {
  const rects = rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 10, top: 10, right: 10, bottom: 10 });
  assert.deepEqual(rects, [
    { x: 0, y: 0, width: 100, height: 10 },     // top
    { x: 0, y: 90, width: 100, height: 10 },    // bottom
    { x: 0, y: 10, width: 10, height: 80 },     // left
    { x: 90, y: 10, width: 10, height: 80 },    // right
  ]);
});

test("solo top → 1 banda", () => {
  const rects = rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 0, top: 10, right: 0, bottom: 0 });
  assert.deepEqual(rects, [{ x: 0, y: 0, width: 100, height: 10 }]);
});

test("padding 0 → []", () => {
  assert.deepEqual(rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 0, top: 0, right: 0, bottom: 0 }), []);
});
