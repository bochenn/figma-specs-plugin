import { test } from "node:test";
import assert from "node:assert";
import { depthPrefix } from "../src/plugin/utils/jerarquia.ts";

test("depth 0 → sin prefix", () => {
  assert.equal(depthPrefix(0), "");
});

test("depth >0 → sangría + flecha por nivel", () => {
  assert.equal(depthPrefix(1), "  ↳ ");
  assert.equal(depthPrefix(2), "    ↳ ");
});
