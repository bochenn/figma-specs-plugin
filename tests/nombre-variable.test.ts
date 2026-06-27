import { test } from "node:test";
import assert from "node:assert";
import { stripCollectionPrefix } from "../src/plugin/utils/nombre-variable.ts";

test("quita el prefix 'N. ' inicial", () => {
  assert.equal(stripCollectionPrefix("1. Color modes"), "Color modes");
  assert.equal(stripCollectionPrefix("3. Spacing"), "Spacing");
  assert.equal(stripCollectionPrefix("10. Tokens"), "Tokens");
});

test("no toca names sin prefix numérico", () => {
  assert.equal(stripCollectionPrefix("Color modes"), "Color modes");
  assert.equal(stripCollectionPrefix("Spacing/2xl"), "Spacing/2xl");
});
