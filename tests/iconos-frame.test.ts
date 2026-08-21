import { test } from "node:test";
import assert from "node:assert";
import { frameIconKey } from "../src/plugin/utils/iconos-frame.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

function frame(parcial: Partial<NodeLike>): NodeLike {
  return { id: "f", name: "f", type: "FRAME", ...parcial };
}

test("frameIconKey: horizontal usa la alineación del eje contrario (top/center/bottom)", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", counterAxisAlignItems: "MIN" })), "al-h-top");
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", counterAxisAlignItems: "CENTER" })), "al-h-center");
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", counterAxisAlignItems: "MAX" })), "al-h-bottom");
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", counterAxisAlignItems: "BASELINE" })), "align-baseline");
});

test("frameIconKey: vertical usa left/center/right", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "VERTICAL", counterAxisAlignItems: "MIN" })), "al-v-left");
  assert.equal(frameIconKey(frame({ layoutMode: "VERTICAL", counterAxisAlignItems: "CENTER" })), "al-v-center");
  assert.equal(frameIconKey(frame({ layoutMode: "VERTICAL", counterAxisAlignItems: "MAX" })), "al-v-right");
});

test("frameIconKey: wrap usa la alineación del eje principal", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", layoutWrap: "WRAP", primaryAxisAlignItems: "CENTER" })), "al-wrap-center");
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", layoutWrap: "WRAP", primaryAxisAlignItems: "MAX" })), "al-wrap-right");
  // SPACE_BETWEEN no tiene icono propio: cae en wrap-left
  assert.equal(frameIconKey(frame({ layoutMode: "HORIZONTAL", layoutWrap: "WRAP", primaryAxisAlignItems: "SPACE_BETWEEN" })), "al-wrap-left");
});

test("frameIconKey: posición absoluta gana sobre el Auto Layout", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "VERTICAL", counterAxisAlignItems: "MIN", layoutPositioning: "ABSOLUTE" })), "al-absolute");
});

test("frameIconKey: frame sin Auto Layout y no-frames → sin icono propio", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "NONE" })), undefined);
  assert.equal(frameIconKey(frame({})), undefined);
  assert.equal(frameIconKey({ id: "t", name: "t", type: "TEXT" }), undefined);
});

test("frameIconKey: grid mantiene el icono de grilla", () => {
  assert.equal(frameIconKey(frame({ layoutMode: "GRID" })), "dir-grid");
});
