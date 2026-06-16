import { test } from "node:test";
import assert from "node:assert";
import { prefijoProfundidad } from "../src/plugin/utils/jerarquia.ts";

test("profundidad 0 → sin prefijo", () => {
  assert.equal(prefijoProfundidad(0), "");
});

test("profundidad >0 → sangría + flecha por nivel", () => {
  assert.equal(prefijoProfundidad(1), "  ↳ ");
  assert.equal(prefijoProfundidad(2), "    ↳ ");
});
