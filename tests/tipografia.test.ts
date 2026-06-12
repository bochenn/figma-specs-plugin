import { test } from "node:test";
import assert from "node:assert";
import { formatearTipografia } from "../src/plugin/utils/tipografia.ts";

test("formatearTipografia en Plain y CSS", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16 }, "Plain"), "Inter Regular 16");
  assert.equal(formatearTipografia({ family: "Inter", style: "Bold", size: 24 }, "CSS"), "24px Bold Inter");
});
