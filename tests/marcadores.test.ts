import { test } from "node:test";
import assert from "node:assert";
import { badgePosition, BADGE_OFFSET, BADGE_SIZE } from "../src/plugin/utils/marcadores.ts";

test("ubica el marker a la left del artwork, centrado verticalmente con el element", () => {
  // element de height 20 que empieza en y=40 → su center vertical es 50
  const box = { x: 30, y: 40, width: 100, height: 20 };
  const pos = badgePosition(box);
  // x: pegado al border leftSide, empujado to afuera por OFFSET + tamaño del marker
  assert.equal(pos.x, -(BADGE_OFFSET + BADGE_SIZE));
  // y: center del element (50) menos medio marker
  assert.equal(pos.y, 50 - BADGE_SIZE / 2);
});

test("dos elements a distinta altura dan distinta y, misma x", () => {
  const a = badgePosition({ x: 0, y: 0, width: 10, height: 10 });
  const b = badgePosition({ x: 0, y: 100, width: 10, height: 10 });
  assert.equal(a.x, b.x);
  assert.notEqual(a.y, b.y);
});
