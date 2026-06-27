import type { Rect } from "./overlays.ts";
import type { Unit, Attribute } from "../modelo/tipos.ts";
import { currentUnit, spacingLabel, formatSpacing } from "./espaciado.ts";

// "<resizing> <dim>" with the formatted dimension (variable + value if any):
// "Fixed sizing/card-width (240)", "Hug 88", "Fixed 1rem".
export function dimensionText(resizing: string, px: number, unit: Unit, varName?: string): string {
  return `${resizing} ${spacingLabel(px, unit, varName)}`;
}

// A part of a property's value in the panel: plain text or variable chip.
export type ValuePart = { text: string } | { chip: string };

// Width/Height: the mode (Fixed/Hug/Fill) no longer goes here (shown as an indicator
// at the end of the row). With variable → chip(name) + (value); without → value.
export function dimValue(px: number, unit: Unit, varName?: string): ValuePart[] {
  if (varName) return [{ chip: varName }, { text: `(${formatSpacing(px, unit, true)})` }];
  return [{ text: formatSpacing(px, unit, true) }];
}

// Fill/Stroke: variable/style → chip(name) + (rawValue); hardcoded → text(value).
export function colorValue(attr: Attribute): ValuePart[] {
  if (attr.format !== "HARDCODED") {
    const parts: ValuePart[] = [{ chip: attr.value }];
    if (attr.rawValue) parts.push({ text: `(${attr.rawValue})` });
    return parts;
  }
  return [{ text: attr.value }];
}

// Padding/Gap: with variable → chip(name) + (value); without → text(value).
export function spacingValue(px: number, unit: Unit, varName?: string): ValuePart[] {
  if (varName) return [{ chip: varName }, { text: `(${formatSpacing(px, unit, true)})` }];
  return [{ text: formatSpacing(px, unit, true) }];
}

export interface Badge {
  side: "top" | "bottom" | "left" | "right";
  center: number;  // position along that side (x for top/bottom, y for left/right)
  from: number;   // band range (for the wrap dedupe)
  to: number;
  value: string;
  name?: string; // the variable's shortName, if any
  type: "padding" | "spacing";
}

// Discards badges that overlap a previous one with the same value (typical in
// wrap: each row's gap projects to almost the same position).
function sinPisadas<T extends { from: number; to: number; value: string }>(badges: T[]): T[] {
  const resultado: T[] = [];
  for (const m of badges) {
    const pisada = resultado.some((o) => o.value === m.value && m.from < o.to && o.from < m.to);
    if (!pisada) resultado.push(m);
  }
  return resultado;
}

// Last segment of a variable name: "space/padding-1x" → "padding-1x".
export function shortName(name: string): string {
  return name.split("/").pop() ?? name;
}

// A container's badges, distributed on the 4 sides of the clone: each padding
// goes to its side (left/right/top/bottom); gaps to top (HORIZONTAL) or left
// (VERTICAL). Zero-thickness bands generate no badge. With spacingAuto, gaps
// say "Auto". `value` = "shortName number" if there's a variable, or the number.
export function layoutBadges(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direction: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string } = {},
): Badge[] {
  const u = currentUnit();
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const formatVal = (px: number) => formatSpacing(px, u);
  const nameOf = (varName?: string) => (varName ? { name: shortName(varName) } : {});
  const out: Badge[] = [];
  if (padding.left > 0) out.push({ side: "left", center: cy, from: frame.y, to: frame.y + frame.height, value: formatVal(padding.left), ...nameOf(spacingVars.paddingLeft), type: "padding" });
  if (padding.right > 0) out.push({ side: "right", center: cy, from: frame.y, to: frame.y + frame.height, value: formatVal(padding.right), ...nameOf(spacingVars.paddingRight), type: "padding" });
  if (padding.top > 0) out.push({ side: "top", center: cx, from: frame.x, to: frame.x + frame.width, value: formatVal(padding.top), ...nameOf(spacingVars.paddingTop), type: "padding" });
  if (padding.bottom > 0) out.push({ side: "bottom", center: cx, from: frame.x, to: frame.x + frame.width, value: formatVal(padding.bottom), ...nameOf(spacingVars.paddingBottom), type: "padding" });
  const spacing: Badge[] = [];
  for (const g of gaps) {
    const auto = spacingAuto;
    if (direction === "HORIZONTAL") spacing.push({ side: "top", center: g.x + g.width / 2, from: g.x, to: g.x + g.width, value: auto ? "Auto" : formatVal(g.width), ...(auto ? {} : nameOf(spacingVars.itemSpacing)), type: "spacing" });
    else spacing.push({ side: "left", center: g.y + g.height / 2, from: g.y, to: g.y + g.height, value: auto ? "Auto" : formatVal(g.height), ...(auto ? {} : nameOf(spacingVars.itemSpacing)), type: "spacing" });
  }
  return [...out, ...sinPisadas(spacing)];
}

// Cap style of the blue callout per the axis resizing:
// Fixed = caps, Fill = arrows outward, Hug = arrows inward.
export function dimStyle(resizing: string): "fixed" | "fill" | "hug" {
  if (resizing === "Fill") return "fill";
  if (resizing === "Hug") return "hug";
  return "fixed";
}

// Artwork direction icon (grid variant when there's wrap).
export function directionIcon(
  direction: "HORIZONTAL" | "VERTICAL",
  wrap: boolean,
): "flecha-h" | "flecha-v" | "grilla-h" | "grilla-v" {
  if (wrap) return direction === "HORIZONTAL" ? "grilla-h" : "grilla-v";
  return direction === "HORIZONTAL" ? "flecha-h" : "flecha-v";
}

// Given centers and sizes along an axis, returns new centers that don't
// overlap, keeping the order and leaving a minimum separation `sep`. Iterates
// from smallest to largest and pushes toward the positive side any that overlaps the previous.
export function separateCollisions(centros: number[], sizes: number[], sep: number): number[] {
  const orden = centros.map((_, i) => i).sort((a, b) => centros[a] - centros[b]);
  const out = centros.slice();
  let limite = -Infinity;
  for (const i of orden) {
    let inicio = centros[i] - sizes[i] / 2;
    if (inicio < limite + sep) inicio = limite + sep;
    out[i] = inicio + sizes[i] / 2;
    limite = inicio + sizes[i];
  }
  return out;
}

// External rail where a badge goes: padding-top and horizontal gaps
// on top; vertical gaps on the left; the rest of the paddings (bottom/left/right)
// in the bottom row.
export function badgeRail(side: "top" | "bottom" | "left" | "right", type: "padding" | "spacing"): "top" | "bottom" | "left" {
  if (type === "spacing") return side === "top" ? "top" : "left";
  if (side === "top") return "top";
  return "bottom";
}

// Alignment-row icon: depends on the direction and the counter-axis
// alignment (the 6 autolayoutgrid icons + baseline in horizontal).
export function alignmentIcon(direction: string, counterAlignment: string): string {
  if (direction === "HORIZONTAL") {
    if (counterAlignment === "Center") return "align-h-center";
    if (counterAlignment === "End") return "align-h-bottom";
    if (counterAlignment === "Baseline") return "align-baseline";
    return "align-h-top";
  }
  if (counterAlignment === "Center") return "align-v-center";
  if (counterAlignment === "End") return "align-v-right";
  return "align-v-left";
}

// An element is "small" (and its artwork is worth splitting) if it isn't GRID and its
// smaller side is below the threshold.
export function isSmall(width: number, height: number, direction: string): boolean {
  return direction !== "GRID" && Math.min(width, height) < 48;
}

export interface PaddingDim {
  key: "padding" | "padding-x" | "padding-y" | "top" | "right" | "bottom" | "left";
  eje: "h" | "v";
  value: number;
  name?: string;
}

// Groups the padding into the labels to show: uniform → one; per axis → x/y;
// per side → the sides with value > 0. `name` = short variable name if any.
export function groupPadding(
  padding: { left: number; top: number; right: number; bottom: number },
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string } = {},
): PaddingDim[] {
  const { left, top, right, bottom } = padding;
  const vL = spacingVars.paddingLeft, vT = spacingVars.paddingTop, vR = spacingVars.paddingRight, vB = spacingVars.paddingBottom;
  const con = (n?: string) => (n ? { name: shortName(n) } : {});
  if (left === top && top === right && right === bottom && vL === vT && vT === vR && vR === vB) {
    return left === 0 ? [] : [{ key: "padding", eje: "v", value: left, ...con(vL) }];
  }
  if (top === bottom && vT === vB && left === right && vL === vR) {
    const out: PaddingDim[] = [];
    if (top > 0) out.push({ key: "padding-y", eje: "v", value: top, ...con(vT) });
    if (left > 0) out.push({ key: "padding-x", eje: "h", value: left, ...con(vL) });
    return out;
  }
  const out: PaddingDim[] = [];
  if (top > 0) out.push({ key: "top", eje: "v", value: top, ...con(vT) });
  if (bottom > 0) out.push({ key: "bottom", eje: "v", value: bottom, ...con(vB) });
  if (left > 0) out.push({ key: "left", eje: "h", value: left, ...con(vL) });
  if (right > 0) out.push({ key: "right", eje: "h", value: right, ...con(vR) });
  return out;
}
