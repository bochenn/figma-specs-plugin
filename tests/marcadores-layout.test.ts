import { test } from "node:test";
import assert from "node:assert";
import { layoutBadges, dimStyle, directionIcon, dimensionText, dimValue, colorValue, spacingValue, shortName, separateCollisions, badgeRail, alignmentIcon, isSmall, groupPadding } from "../src/plugin/utils/marcadores-layout.ts";
import { applyUnit } from "../src/plugin/utils/espaciado.ts";

test("layoutBadges: cada padding va a su side con su value", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 8, right: 24, bottom: 0 };
  const badges = layoutBadges(frame, padding, [], "HORIZONTAL", false);
  const porLado = Object.fromEntries(badges.map((m) => [m.side, m.value]));
  assert.equal(porLado.left, "16");
  assert.equal(porLado.top, "8");
  assert.equal(porLado.right, "24");
  assert.equal(porLado.bottom, undefined); // padding 0 → sin badge
});

test("layoutBadges: padding left centrado vertical, top centrado horizontal", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const badges = layoutBadges(frame, { left: 16, top: 8, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(badges.find((m) => m.side === "left")!.center, 50);  // frame.y + height/2
  assert.equal(badges.find((m) => m.side === "top")!.center, 100);  // frame.x + width/2
});

test("layoutBadges: gap HORIZONTAL → side top en el center del hueco", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 12, height: 100 }];
  const badges = layoutBadges(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.deepEqual(badges, [{ side: "top", center: 66, from: 60, to: 72, value: "12", type: "spacing" }]);
});

test("layoutBadges: gap VERTICAL → side left", () => {
  const frame = { x: 0, y: 0, width: 100, height: 200 };
  const gaps = [{ x: 0, y: 50, width: 100, height: 20 }];
  const badges = layoutBadges(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "VERTICAL", false);
  assert.equal(badges[0].side, "left");
  assert.equal(badges[0].center, 60);
  assert.equal(badges[0].value, "20");
});

test("layoutBadges: spacingAuto → gap dice Auto", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 30, height: 100 }];
  const badges = layoutBadges(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", true);
  assert.equal(badges[0].value, "Auto");
});

test("layoutBadges: respeta rem", () => {
  applyUnit("rem");
  const badges = layoutBadges({ x: 0, y: 0, width: 100, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(badges.find((m) => m.side === "left")!.value, "1rem");
  applyUnit("px");
});

test("layoutBadges: gaps de igual value superpuestos → uno solo (wrap)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 80, y: 0, width: 12, height: 40 }, { x: 85, y: 60, width: 12, height: 40 }];
  const badges = layoutBadges(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.equal(badges.filter((m) => m.type === "spacing").length, 1);
});

test("dimStyle mapea el resizing a las puntas de la callout", () => {
  assert.equal(dimStyle("Fixed"), "fixed");
  assert.equal(dimStyle("Fill"), "fill");
  assert.equal(dimStyle("Hug"), "hug");
});

test("directionIcon elige según dirección y wrap", () => {
  assert.equal(directionIcon("HORIZONTAL", false), "flecha-h");
  assert.equal(directionIcon("VERTICAL", false), "flecha-v");
  assert.equal(directionIcon("HORIZONTAL", true), "grilla-h");
  assert.equal(directionIcon("VERTICAL", true), "grilla-v");
});

test("dimensionText: Fixed con variable incluye name y value", () => {
  assert.equal(dimensionText("Fixed", 240, "px", "sizing/card-width"), "Fixed sizing/card-width (240)");
});

test("dimensionText: Hug sin variable es resizing + value", () => {
  assert.equal(dimensionText("Hug", 88, "px"), "Hug 88");
});

test("dimensionText: respeta rem", () => {
  assert.equal(dimensionText("Fixed", 16, "rem"), "Fixed 1rem");
});

test("layoutBadges con spacingVars → name y value separados", () => {
  const badges = layoutBadges({ x: 0, y: 0, width: 200, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  const m = badges.find((x) => x.side === "left")!;
  assert.equal(m.name, "padding-1x");
  assert.equal(m.value, "16");
});

test("shortName: último segmento tras la barra", () => {
  assert.equal(shortName("space/padding-1x"), "padding-1x");
  assert.equal(shortName("simple"), "simple");
});

test("dimValue: con variable → chip + (value), sin el mode", () => {
  assert.deepEqual(dimValue(240, "px", "sizing/card-width"), [{ chip: "sizing/card-width" }, { text: "(240px)" }]);
});
test("dimValue: sin variable → solo el value en text", () => {
  assert.deepEqual(dimValue(88, "px"), [{ text: "88px" }]);
});
test("colorValue: variable/style → chip + (raw)", () => {
  assert.deepEqual(colorValue({ key: "fill", value: "color/surface", format: "VARIABLE", rawValue: "#FFFFFF" }), [{ chip: "color/surface" }, { text: "(#FFFFFF)" }]);
});
test("colorValue: hardcoded → solo text", () => {
  assert.deepEqual(colorValue({ key: "fill", value: "#000000", format: "HARDCODED" }), [{ text: "#000000" }]);
});
test("spacingValue: con variable → chip + (value)", () => {
  assert.deepEqual(spacingValue(16, "px", "space/padding-1x"), [{ chip: "space/padding-1x" }, { text: "(16px)" }]);
});
test("spacingValue: sin variable → solo text", () => {
  assert.deepEqual(spacingValue(8, "px"), [{ text: "8px" }]);
});

test("separateCollisions: sin solape deja los centros igual", () => {
  assert.deepEqual(separateCollisions([0, 100], [10, 10], 4), [0, 100]);
});

test("separateCollisions: dos centros iguales se separan tamaño+sep", () => {
  const r = separateCollisions([50, 50], [10, 10], 4);
  assert.equal(r[0], 50);
  assert.equal(r[1], 64); // 50→55 (border), +4 sep = 59 inicio, +5 mitad = 64
});

test("separateCollisions: respeta el orden original aunque entren desordenados", () => {
  const r = separateCollisions([100, 0], [10, 10], 4);
  assert.equal(r[1], 0);   // el de center menor no se mueve
  assert.equal(r[0], 100); // el de center mayor no solapa
});

test("badgeRail: padding top top; bottom/left/right bottom", () => {
  assert.equal(badgeRail("top", "padding"), "top");
  assert.equal(badgeRail("bottom", "padding"), "bottom");
  assert.equal(badgeRail("left", "padding"), "bottom");
  assert.equal(badgeRail("right", "padding"), "bottom");
});

test("badgeRail: gap horizontal top, gap vertical a la left", () => {
  assert.equal(badgeRail("top", "spacing"), "top");
  assert.equal(badgeRail("left", "spacing"), "left");
});

test("alignmentIcon: vertical mapea Start/Center/End a left/center/right", () => {
  assert.equal(alignmentIcon("VERTICAL", "Start"), "align-v-left");
  assert.equal(alignmentIcon("VERTICAL", "Center"), "align-v-center");
  assert.equal(alignmentIcon("VERTICAL", "End"), "align-v-right");
});

test("alignmentIcon: horizontal mapea a top/center/bottom y baseline", () => {
  assert.equal(alignmentIcon("HORIZONTAL", "Start"), "align-h-top");
  assert.equal(alignmentIcon("HORIZONTAL", "Center"), "align-h-center");
  assert.equal(alignmentIcon("HORIZONTAL", "End"), "align-h-bottom");
  assert.equal(alignmentIcon("HORIZONTAL", "Baseline"), "align-baseline");
});

test("isSmall: tag (74x24) es small; card (240x92) no; GRID nunca", () => {
  assert.equal(isSmall(74, 24, "HORIZONTAL"), true);
  assert.equal(isSmall(240, 92, "VERTICAL"), false);
  assert.equal(isSmall(40, 40, "GRID"), false);
});

test("groupPadding: uniform → una label", () => {
  assert.deepEqual(groupPadding({ left: 16, top: 16, right: 16, bottom: 16 }), [{ key: "padding", eje: "v", value: 16 }]);
});
test("groupPadding: por eje → padding-y y padding-x", () => {
  assert.deepEqual(groupPadding({ left: 32, top: 24, right: 32, bottom: 24 }), [
    { key: "padding-y", eje: "v", value: 24 },
    { key: "padding-x", eje: "h", value: 32 },
  ]);
});
test("groupPadding: por side, omite 0", () => {
  assert.deepEqual(groupPadding({ left: 5, top: 10, right: 20, bottom: 0 }), [
    { key: "top", eje: "v", value: 10 },
    { key: "left", eje: "h", value: 5 },
    { key: "right", eje: "h", value: 20 },
  ]);
});
test("groupPadding: uniform con variable lleva shortName", () => {
  assert.deepEqual(groupPadding({ left: 16, top: 16, right: 16, bottom: 16 }, { paddingLeft: "space/padding-1x", paddingTop: "space/padding-1x", paddingRight: "space/padding-1x", paddingBottom: "space/padding-1x" }), [{ key: "padding", eje: "v", value: 16, name: "padding-1x" }]);
});
