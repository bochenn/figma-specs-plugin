import { test } from "node:test";
import assert from "node:assert";
import { spacingRects } from "../src/plugin/utils/overlays.ts";

test("dos children horizontales → gap medido entre ellos", () => {
  const rects = spacingRects(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 62, y: 0, width: 50, height: 30 }],
    "HORIZONTAL",
  );
  assert.deepEqual(rects, [{ x: 50, y: 0, width: 12, height: 30 }]);
});

test("dos children verticales → gap vertical", () => {
  const rects = spacingRects(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 0, y: 42, width: 50, height: 30 }],
    "VERTICAL",
  );
  assert.deepEqual(rects, [{ x: 0, y: 30, width: 50, height: 12 }]);
});

test("un solo child → []", () => {
  assert.deepEqual(spacingRects([{ x: 0, y: 0, width: 50, height: 30 }], "HORIZONTAL"), []);
});

test("children pegados (gap 0) → []", () => {
  const rects = spacingRects(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 50, y: 0, width: 50, height: 30 }],
    "HORIZONTAL",
  );
  assert.deepEqual(rects, []);
});
