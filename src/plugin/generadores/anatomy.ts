import type { AnatomyElement, Attribute } from "../modelo/tipos.ts";
import { BADGE_SIZE } from "../utils/marcadores.ts";
import { verticalFrame, horizontalFrame, text, tableOf, themedFill, card, pillRow, variableChip, FONT_BOLD, keyText, valueText, FONT_MEDIUM, cardHeaderText } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { HEADERS_ANATOMY, anatomyRow } from "../utils/tabla-anatomy.ts";
import { hexToRgb } from "../utils/color.ts";
import { nodeTypeIcon, resizingIconKey, dimensionIndicator } from "./iconos.ts";
import { parseVariants } from "../utils/anatomy-variantes.ts";

const GRAY = (n: number): RGB => ({ r: n, g: n, b: n });

// Map id → box (x/y/w/h) relative to the root node's corner.
function relativeBoxes(root: SceneNode): Map<string, { x: number; y: number; width: number; height: number }> {
  const idMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  const base = root.absoluteBoundingBox;
  function walk(n: SceneNode): void {
    const b = n.absoluteBoundingBox;
    if (base && b) idMap.set(n.id, { x: b.x - base.x, y: b.y - base.y, width: b.width, height: b.height });
    if ("children" in n) for (const c of n.children) walk(c);
  }
  walk(root);
  return idMap;
}

// Marker color palette (badge + border), cycles by index. White text.
const BADGE_COLORS: RGB[] = [
  hexToRgb("#0D80FF"), // blue
  hexToRgb("#FF2D9C"), // magenta
  hexToRgb("#9747FF"), // violeta
  hexToRgb("#F0411E"), // red
  hexToRgb("#F5C518"), // amarillo
  hexToRgb("#1FA855"), // green
  hexToRgb("#5E6B8A"), // slate
  hexToRgb("#F5921E"), // naranja
];

// Dashed border around the box, in the marker's color.
function badgeBorder(box: { x: number; y: number; width: number; height: number }, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = box.x; r.y = box.y;
  r.resize(Math.max(box.width, 0.01), Math.max(box.height, 0.01));
  r.fills = [];
  r.strokes = [{ type: "SOLID", color }];
  r.strokeWeight = 1;
  r.dashPattern = [4, 3];
  artwork.appendChild(r);
}

// Draws an attribute as a row-pill: swatch (if color) + "key:" + value/ChipVar + (raw).
async function attributeRow(attr: Attribute): Promise<FrameNode> {
  const nodes: SceneNode[] = [];
  if (attr.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexToRgb(attr.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: GRAY(0.8) }];
    swatch.strokeWeight = 1;
    nodes.push(swatch);
  }
  nodes.push(await keyText(`${attr.key}:`));
  if (attr.format !== "HARDCODED") {
    nodes.push(await variableChip(attr.value));
    if (attr.rawValue) nodes.push(await valueText(`(${attr.rawValue})`));
  } else {
    nodes.push(await valueText(attr.value));
  }
  // width/height: the mode (Fixed/Hug/Fill) goes at the end as an icon box + text.
  if (resizingIconKey(attr.key, attr.prefix)) nodes.push(await dimensionIndicator(attr.key, attr.prefix!));
  return pillRow(nodes);
}

// Builds an element's entry as a card (header + pill-rows).
async function listEntry(indice: number, el: AnatomyElement, color: RGB): Promise<FrameNode> {
  const headerNodes: SceneNode[] = [await badgePanel(indice, color)];
  const icon = nodeTypeIcon(el.type);
  if (icon) headerNodes.push(icon);
  headerNodes.push(await cardHeaderText(`${el.name} · ${el.type}`));

  const rows: FrameNode[] = [];
  const variants = parseVariants(el.dependsOn);
  if (variants.length > 0) {
    for (const v of variants) rows.push(pillRow([await keyText(`${v.key}:`), await valueText(v.value)]));
  } else if (el.dependsOn) {
    rows.push(pillRow([await valueText(`Depends on: ${el.dependsOn}`)]));
  }
  for (const attr of el.attributes) rows.push(await attributeRow(attr));
  return card(headerNodes, rows);
}

// Creates the panel badge (small circle + number), without absolute position.
async function badgePanel(badgeNum: number, color: RGB): Promise<FrameNode> {
  const circle = figma.createEllipse();
  circle.resize(BADGE_SIZE, BADGE_SIZE);
  circle.fills = [{ type: "SOLID", color }];
  const num = await text(String(badgeNum), 11, FONT_MEDIUM);
  num.fills = [{ type: "SOLID", color: GRAY(1) }];
  const container = figma.createFrame();
  container.name = `Badge ${badgeNum}`;
  container.layoutMode = "NONE";
  container.resize(BADGE_SIZE, BADGE_SIZE);
  container.fills = [];
  container.clipsContent = false;
  container.appendChild(circle);
  container.appendChild(num);
  num.x = (BADGE_SIZE - num.width) / 2;
  num.y = (BADGE_SIZE - num.height) / 2;
  return container;
}

// Creates a numbered marker (circle + number).
async function marker(badgeNum: number, x: number, y: number, color: RGB): Promise<FrameNode> {
  const circle = figma.createEllipse();
  circle.resize(BADGE_SIZE, BADGE_SIZE);
  circle.fills = [{ type: "SOLID", color }];

  const num = await text(String(badgeNum), 14, FONT_MEDIUM);
  num.fills = [{ type: "SOLID", color: GRAY(1) }];

  const container = figma.createFrame();
  container.name = `Badge `;
  container.layoutMode = "NONE";
  container.resize(BADGE_SIZE, BADGE_SIZE);
  container.fills = [];
  container.clipsContent = false;
  container.appendChild(circle);
  container.appendChild(num);
  num.x = (BADGE_SIZE - num.width) / 2;
  num.y = (BADGE_SIZE - num.height) / 2;
  container.x = x;
  container.y = y;
  return container;
}

// Straight horizontal guide line (marker color): from `fromX` to `toX` at the given Y.
function guideLineH(artwork: FrameNode, fromX: number, y: number, toX: number, color: RGB): void {
  const h = figma.createRectangle();
  h.x = Math.min(fromX, toX);
  h.y = y - 0.5;
  h.resize(Math.max(Math.abs(toX - fromX), 0.01), 1);
  h.fills = [{ type: "SOLID", color }];
  artwork.appendChild(h);
}

// Straight vertical guide line (marker color): from `fromY` to `toY` at the given X.
function guideLineV(artwork: FrameNode, x: number, fromY: number, toY: number, color: RGB): void {
  const v = figma.createRectangle();
  v.x = x - 0.5;
  v.y = Math.min(fromY, toY);
  v.resize(1, Math.max(Math.abs(toY - fromY), 0.01));
  v.fills = [{ type: "SOLID", color }];
  artwork.appendChild(v);
}

// Builds the [Name] Spec (heading + Anatomy section with list + artwork).
async function specDeAnatomy(selected: SceneNode, elements: AnatomyElement[], table: boolean): Promise<FrameNode> {
  const spec = verticalFrame(`${selected.name} Spec`, 48);
  spec.appendChild(await text(selected.name, 64));
  spec.appendChild(await anatomySection(selected, elements, table));
  return spec;
}

// Builds only the Anatomy section (without Specifications or node title).
export async function anatomySection(selected: SceneNode, elements: AnatomyElement[], table: boolean): Promise<FrameNode> {
  const section = verticalFrame("Anatomy", 24);

  // Horizontal display: list on the left, artwork on the right.
  const display = figma.createFrame();
  display.name = "Display";
  display.layoutMode = "HORIZONTAL";
  display.itemSpacing = 64;
  display.primaryAxisSizingMode = "AUTO";
  display.counterAxisSizingMode = "AUTO";
  display.fills = [];
  section.appendChild(display);

  // Artwork: clone of the selected + markers (goes on the LEFT).
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false; // the markers go outside the left border
  artwork.fills = themedFill(themeVars().bgArtwork);
  display.appendChild(artwork);

  // Margin so the badges of edge-flush layers aren't clipped.
  const ARTWORK_MARGIN = 20;
  // Distance from the marker to its box border, and margin reserved for the markers.
  const BADGE_GAP = 48;
  // Generous, symmetric margin on all 4 sides: holds the badge (at OFFSET from the border)
  // and several shifted ones when they pile up, so everything fits comfortably and breathes.
  const BADGE_MARGIN = BADGE_GAP + BADGE_SIZE * 3;
  // Minimum gray canvas size: a small element stays centered in a wide box.
  const ARTWORK_MIN = 440;
  const clone = selected.clone();
  artwork.appendChild(clone);
  const canvasW = Math.max(ARTWORK_MIN, clone.width + 2 * (ARTWORK_MARGIN + BADGE_MARGIN));
  const canvasH = Math.max(ARTWORK_MIN, clone.height + 2 * (ARTWORK_MARGIN + BADGE_MARGIN));
  artwork.resize(canvasW, canvasH);
  const offsetX = (canvasW - clone.width) / 2;
  const offsetY = (canvasH - clone.height) / 2;
  clone.x = offsetX;
  clone.y = offsetY;

  // Badges on all 4 SIDES of the element. The chosen side is the one whose badge does NOT land on
  // another sibling element (the container doesn't obstruct); preference order
  // left → right → top → bottom. If the free side collides with an already-placed badge,
  // the badge is moved away along its axis. The line is perpendicular: from the element's border
  // to the badge. So, in horizontal rows the badges go top/bottom and in vertical
  // stacks to the sides, without crowding.
  const relBoxes = relativeBoxes(selected);
  type Box = { x: number; y: number; w: number; h: number };
  const boxes: (Box | null)[] = elements.map((e) => {
    const c = relBoxes.get(e.id);
    return c ? { x: c.x + offsetX, y: c.y + offsetY, w: c.width, h: c.height } : null;
  });
  const contains = (a: Box, b: Box): boolean =>
    a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
  // Does the point fall inside a sibling element of i (neither its container nor its content)?
  const overOther = (x: number, y: number, i: number, bi: Box): boolean =>
    boxes.some((bj, j) => bj != null && j !== i && !contains(bj, bi) && !contains(bi, bj)
      && x >= bj.x && x <= bj.x + bj.w && y >= bj.y && y <= bj.y + bj.h);
  const placed: { x: number; y: number }[] = [];
  const collides = (x: number, y: number): boolean =>
    placed.some((p) => Math.abs(p.x - x) < BADGE_SIZE + 4 && Math.abs(p.y - y) < BADGE_SIZE + 4);
  const R = BADGE_SIZE / 2;
  for (let i = 0; i < elements.length; i++) {
    const bi = boxes[i];
    if (!bi) continue;
    const color = BADGE_COLORS[i % BADGE_COLORS.length];
    badgeBorder({ x: bi.x, y: bi.y, width: bi.w, height: bi.h }, color, artwork);
    const cx = bi.x + bi.w / 2;
    const cy = bi.y + bi.h / 2;
    const lados = [
      { side: "left",   x: bi.x - BADGE_GAP - R,        y: cy },
      { side: "right",  x: bi.x + bi.w + BADGE_GAP + R, y: cy },
      { side: "top",    x: cx,                             y: bi.y - BADGE_GAP - R },
      { side: "bottom", x: cx,                             y: bi.y + bi.h + BADGE_GAP + R },
    ];
    let validos = lados.filter((l) => !overOther(l.x, l.y, i, bi));
    if (validos.length === 0) validos = lados;
    const elegido = validos.find((l) => !collides(l.x, l.y)) ?? validos[0];
    let mcx = elegido.x;
    let mcy = elegido.y;
    while (collides(mcx, mcy)) {
      if (elegido.side === "left") mcx -= BADGE_SIZE + 4;
      else if (elegido.side === "right") mcx += BADGE_SIZE + 4;
      else if (elegido.side === "top") mcy -= BADGE_SIZE + 4;
      else mcy += BADGE_SIZE + 4;
    }
    placed.push({ x: mcx, y: mcy });
    if (elegido.side === "left") guideLineH(artwork, mcx + R, cy, bi.x, color);
    else if (elegido.side === "right") guideLineH(artwork, bi.x + bi.w, cy, mcx - R, color);
    else if (elegido.side === "top") guideLineV(artwork, cx, mcy + R, bi.y, color);
    else guideLineV(artwork, cx, bi.y + bi.h, mcy - R, color);
    artwork.appendChild(await marker(i + 1, mcx - R, mcy - R, color));
  }

  // Content: table or list (goes on the RIGHT).
  if (elements.length === 0) {
    display.appendChild(await text("No elements found", 16));
  } else if (table) {
    display.appendChild(await tableOf(HEADERS_ANATOMY, elements.map((e, i) => anatomyRow(i + 1, e))));
  } else {
    const lista = verticalFrame("Content", 16);
    for (let i = 0; i < elements.length; i++) {
      lista.appendChild(await listEntry(i + 1, elements[i], BADGE_COLORS[i % BADGE_COLORS.length]));
    }
    display.appendChild(lista);
  }

  return section;
}

// Generates the Anatomy spec of a single item. Returns the Specifications frame.
export async function generateAnatomy(selected: SceneNode, elements: AnatomyElement[], table: boolean): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(selected, elements, table));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Generates the main spec + one spec per nested instance.
export async function generateAnatomyWithNested(
  selected: SceneNode,
  elements: AnatomyElement[],
  nested: { node: SceneNode; elements: AnatomyElement[] }[],
  table: boolean,
): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(selected, elements, table));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.node, n.elements, table));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
