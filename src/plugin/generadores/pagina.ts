// Page shell of each section: Header, Hero, Feature, Footer, the "specifications"
// Badge and the anatomyItem wrapper. They touch figma.*. Replaces the old headerBox.ts.

import { verticalFrame, horizontalFrame, baselineRow, text, themedFill, FONT_MEDIUM, FONT_REG } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { nodeTypeIcon } from "./iconos.ts";
import { frameIconKey } from "../utils/iconos-frame.ts";
import { originName } from "../extraccion/resolver.ts";
import type { NodeLike } from "../modelo/tipos.ts";

const PLUGIN_NAME = "BLUEPRINT SPECS & HANDOFF";
const BORDER_SHELL: RGB = { r: 0.882, g: 0.882, b: 0.882 }; // #E1E1E1
const GRAY_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const GRAY_SHELL: RGB = { r: 0.5098, g: 0.5098, b: 0.5098 }; // #828282 (header/footer text)
export const PAGE_WIDTH = 1980; // minimum page width (can grow if the content is wider)

// Full border #E1E1E1, weight 1.
function shellBorder(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDER_SHELL }];
  f.strokeWeight = 1;
}

// Bottom border only #E1E1E1, weight 1.
function bottomBorder(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDER_SHELL }];
  f.strokeTopWeight = 0;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 1;
}

// Top border only #E1E1E1, weight 1.
function topBorder(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDER_SHELL }];
  f.strokeTopWeight = 1;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 0;
}

// Joins the last two words with a hard space to avoid the last
// line being left with a single orphan word on wrap.
function sinHuerfano(s: string): string {
  const i = s.lastIndexOf(" ");
  return i < 0 ? s : s.slice(0, i) + " " + s.slice(i + 1);
}

// Gray description text (Inter Regular), ready for FILL with wrap.
async function descText(content: string, fontSize: number): Promise<TextNode> {
  const t = await text(sinHuerfano(content), fontSize, FONT_REG);
  t.fills = [{ type: "SOLID", color: GRAY_DESC }];
  t.textAutoResize = "HEIGHT";
  return t;
}

// Horizontal bar of 1980 with theme fill (no border; each caller adds it).
function barraShell(name: string, gap: number): FrameNode {
  const barra = horizontalFrame(name, gap);
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingTop = barra.paddingBottom = 32;
  barra.paddingLeft = barra.paddingRight = 100;
  barra.fills = themedFill(themeVars().bgSpec);
  barra.primaryAxisSizingMode = "FIXED";
  return barra;
}

// pageHeader: plugin name (FILL on the left) + section label on the right. Bottom border only.
export async function header(sectionLabel: string): Promise<FrameNode> {
  const barra = barraShell("pageHeader", 32);
  bottomBorder(barra);

  const left = await text(PLUGIN_NAME, 16, FONT_MEDIUM);
  left.fills = [{ type: "SOLID", color: GRAY_SHELL }];
  barra.appendChild(left);
  left.layoutSizingHorizontal = "FILL"; // pushes the label to the right

  const label = await text(sectionLabel.toUpperCase(), 16, FONT_MEDIUM);
  label.fills = [{ type: "SOLID", color: GRAY_SHELL }];
  barra.appendChild(label);
  barra.resize(PAGE_WIDTH, barra.height);
  return barra;
}

// pageFooter: plugin name centered. Top border only.
export async function footer(): Promise<FrameNode> {
  const barra = barraShell("pageFooter", 32);
  topBorder(barra);
  barra.primaryAxisAlignItems = "CENTER";
  const name = await text(PLUGIN_NAME, 16, FONT_MEDIUM);
  name.fills = [{ type: "SOLID", color: GRAY_SHELL }];
  barra.appendChild(name);
  barra.resize(PAGE_WIDTH, barra.height);
  return barra;
}

// "specifications" Badge: box with border, radius 8, Inter Medium 14.
export async function badgeSpecifications(): Promise<FrameNode> {
  const badge = horizontalFrame("Badge", 8);
  badge.counterAxisAlignItems = "CENTER";
  badge.paddingTop = badge.paddingBottom = 6;
  badge.paddingLeft = badge.paddingRight = 12;
  badge.cornerRadius = 8;
  badge.fills = themedFill(themeVars().bgSpec);
  shellBorder(badge);
  badge.appendChild(await text("SPECIFICATIONS", 14, FONT_MEDIUM));
  return badge;
}

// Hero: Badge + section title (Inter Medium 56) + description (Inter Regular 18).
export async function hero(titleText: string, description: string): Promise<FrameNode> {
  const container = verticalFrame("pageHero", 56);
  container.paddingTop = container.paddingBottom = container.paddingLeft = container.paddingRight = 100;
  container.fills = themedFill(themeVars().bgSpec);
  bottomBorder(container);
  container.counterAxisSizingMode = "FIXED";
  container.resize(PAGE_WIDTH, container.height);

  const heroHeader = verticalFrame("heroHeader", 24);
  container.appendChild(heroHeader);
  heroHeader.layoutSizingHorizontal = "FILL";

  const title = verticalFrame("Title", 12);
  heroHeader.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  title.appendChild(await badgeSpecifications());
  title.appendChild(await text(titleText, 56, FONT_MEDIUM));

  const desc = await descText(description, 18);
  heroHeader.appendChild(desc);
  // Width 50% of the heroHeader's usable width (1780 → 890).
  desc.layoutSizingHorizontal = "FIXED";
  desc.resize(Math.round((PAGE_WIDTH - 200) * 0.50), desc.height);
  return container;
}

// Feature: layer-type icon + element name (Inter Medium 48), plus the origin
// component when the instance was renamed.
export async function feature(node: SceneNode): Promise<FrameNode> {
  const container = verticalFrame("Feature", 56);
  container.paddingTop = 72;
  container.paddingBottom = 0;
  container.paddingLeft = container.paddingRight = 100;
  container.fills = themedFill(themeVars().bgSpec);
  container.counterAxisSizingMode = "FIXED";
  container.resize(PAGE_WIDTH, container.height);

  const title = verticalFrame("Title", 8);
  title.paddingBottom = 72;
  container.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  bottomBorder(title);
  const heading = horizontalFrame("Heading", 16);
  heading.counterAxisAlignItems = "CENTER";
  const icon = nodeTypeIcon(node.type, 48, frameIconKey(node as unknown as NodeLike));
  if (icon) heading.appendChild(icon);
  const titulo = baselineRow("Title", 12);
  titulo.appendChild(await text(node.name, 48, FONT_MEDIUM));
  if (node.type === "INSTANCE") {
    const main = await node.getMainComponentAsync();
    const origen = main ? originName(node.name, main) : undefined;
    if (origen) titulo.appendChild(await text(`(Instance of: ${origen})`, 24, FONT_REG, GRAY_DESC));
  }
  heading.appendChild(titulo);
  title.appendChild(heading);
  return container;
}

// Wraps a section's content in an item (padding 72/100, gap 48).
// The content stays hug on the left; the item stretches to FILL from main.ts.
// `name` allows a unique id per section (e.g. anatomyItem01, layoutspecItem01).
export function wrapItem(content: FrameNode, name = "anatomyItem"): FrameNode {
  const item = verticalFrame(name, 48);
  item.paddingTop = item.paddingBottom = 72;
  item.paddingLeft = item.paddingRight = 100;
  item.fills = themedFill(themeVars().bgSpec);
  item.appendChild(content);
  return item;
}
