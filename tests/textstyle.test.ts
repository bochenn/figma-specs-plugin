import { test } from "node:test";
import assert from "node:assert";
import { textStyleOf } from "../src/plugin/extraccion/layout.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("textStyleOf: child TEXT con text style → name", () => {
  const n: NodeLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", textStyleName: "Heading/H1" },
  ] };
  assert.deepEqual(textStyleOf(n), { name: "Heading/H1" });
});

test("textStyleOf: child TEXT sin style → summary de fuente", () => {
  const n: NodeLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", fontFamily: "Inter", fontStyle: "Semi Bold", fontSize: 16 },
  ] };
  assert.deepEqual(textStyleOf(n), { summary: "Inter Semi Bold · 16" });
});

test("textStyleOf: sin child text → undefined", () => {
  const n: NodeLike = { id: "f", name: "box", type: "FRAME", children: [
    { id: "r", name: "rect", type: "RECTANGLE" },
  ] };
  assert.equal(textStyleOf(n), undefined);
});
