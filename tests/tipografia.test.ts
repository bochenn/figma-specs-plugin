import { test } from "node:test";
import assert from "node:assert";
import { formatTypography } from "../src/plugin/utils/tipografia.ts";
import { readAttributes } from "../src/plugin/utils/atributos.ts";
import { applyUnit } from "../src/plugin/utils/espaciado.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("formatTypography en Plain y CSS", () => {
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16 }, "Plain"), "Inter Regular 16");
  assert.equal(formatTypography({ family: "Inter", style: "Bold", size: 24 }, "CSS"), "24px Bold Inter");
});

test("formatTypography con line-height", () => {
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "px", value: 24 } }, "Plain"), "Inter Regular 16 / 24");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "px", value: 24 } }, "CSS"), "16px/24px Regular Inter");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "percent", value: 150 } }, "Plain"), "Inter Regular 16 / 150%");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "auto" } }, "CSS"), "16px Regular Inter");
});

test("formatTypography con letter-spacing", () => {
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unit: "px", value: 0.5 } }, "Plain"), "Inter Regular 16 · LS 0.5");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unit: "px", value: 0.5 } }, "CSS"), "16px Regular Inter · LS 0.5px");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unit: "percent", value: 5 } }, "Plain"), "Inter Regular 16 · LS 5%");
  assert.equal(formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "px", value: 24 }, letterSpacing: { unit: "px", value: 0.5 } }, "Plain"), "Inter Regular 16 / 24 · LS 0.5");
});

test("readAttributes agrega las properties de tipografía para nodes con fuente", () => {
  const node: NodeLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16 };
  const attrs = readAttributes(node);
  assert.equal(attrs.find((a) => a.key === "Font Family")?.value, "Inter");
  assert.equal(attrs.find((a) => a.key === "Font Weight")?.value, "Regular");
  assert.equal(attrs.find((a) => a.key === "Font Size")?.value, "16px");
});

test("readAttributes no agrega tipografía sin fuente", () => {
  const node: NodeLike = { id: "f", name: "Frame", type: "FRAME" };
  assert.equal(readAttributes(node).find((a) => a.key === "Font Family"), undefined);
  assert.equal(readAttributes(node).find((a) => a.key === "Text Style"), undefined);
});

test("readAttributes incluye el line-height como row propia", () => {
  const node: NodeLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, lineHeight: { unit: "px", value: 24 } };
  assert.equal(readAttributes(node).find((a) => a.key === "Line Height")?.value, "24px");
});

test("readAttributes incluye el letter-spacing como row propia", () => {
  const node: NodeLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, letterSpacing: { unit: "px", value: 0.5 } };
  assert.equal(readAttributes(node).find((a) => a.key === "Letter Spacing")?.value, "0.5px");
});

test("con Units=rem, Plain convierte size, line-height y letter-spacing", () => {
  applyUnit("rem");
  assert.equal(
    formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "px", value: 24 }, letterSpacing: { unit: "px", value: 4 } }, "Plain"),
    "Inter Regular 1rem / 1.5rem · LS 0.25rem",
  );
  applyUnit("px");
});

test("con Units=rem, CSS convierte size, line-height y letter-spacing", () => {
  applyUnit("rem");
  assert.equal(
    formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "px", value: 24 }, letterSpacing: { unit: "px", value: 4 } }, "CSS"),
    "1rem/1.5rem Regular Inter · LS 0.25rem",
  );
  applyUnit("px");
});

test("con Units=rem, percent y auto quedan intactos", () => {
  applyUnit("rem");
  assert.equal(
    formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "percent", value: 150 } }, "Plain"),
    "Inter Regular 1rem / 150%",
  );
  assert.equal(
    formatTypography({ family: "Inter", style: "Regular", size: 16, lineHeight: { unit: "auto" }, letterSpacing: { unit: "percent", value: 5 } }, "CSS"),
    "1rem Regular Inter · LS 5%",
  );
  applyUnit("px");
});
