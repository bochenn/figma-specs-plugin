import { verticalFrame, horizontalFrame, text, themedFill, FONT_MEDIUM, cardHeaderText } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { hexToRgb } from "../utils/color.ts";
import { nodeTypeIcon } from "./iconos.ts";

const BORDER_E1: RGB = { r: 0.882, g: 0.882, b: 0.882 }; // #E1E1E1
const GRAY_999: RGB = { r: 0.6, g: 0.6, b: 0.6 };        // #999999 (non-current layers)
const TREE_LINE: RGB = hexToRgb("#CED4D8");               // hierarchy guide lines

// One layer of the tree shown in the "Layers" card.
export interface TreeRow { name: string; type: string; level: number; id: string; }

const INDENT = 16; // width of each hierarchy column
const ROW_H = 20;  // fixed row height (so guide lines line up)

// Is there another layer at `level` after row `r` before the subtree closes
// (i.e. before a shallower layer appears)? → the branch continues / has a sibling.
function followingSibling(rows: TreeRow[], r: number, level: number): boolean {
  for (let k = r + 1; k < rows.length; k++) {
    if (rows[k].level < level) return false;
    if (rows[k].level === level) return true;
  }
  return false;
}

// Thin guide segment (1px), in the tree-line color.
function guideSeg(cell: FrameNode, x: number, y: number, w: number, h: number): void {
  const r = figma.createRectangle();
  r.x = x; r.y = y;
  r.resize(Math.max(w, 0.01), Math.max(h, 0.01));
  r.fills = [{ type: "SOLID", color: TREE_LINE }];
  cell.appendChild(r);
}

// The hierarchy guides cell for a row: a vertical line per ancestor branch that
// continues, plus the └/├ connector to the row's parent.
function treeGuides(rows: TreeRow[], r: number): FrameNode {
  const L = rows[r].level;
  const cell = figma.createFrame();
  cell.name = "Guides";
  cell.layoutMode = "NONE";
  cell.clipsContent = false;
  cell.fills = [];
  cell.resize(L * INDENT, ROW_H);
  for (let j = 0; j < L; j++) {
    const x = j * INDENT + INDENT / 2;
    if (j < L - 1) {
      if (followingSibling(rows, r, j + 1)) guideSeg(cell, x, 0, 1, ROW_H); // pass-through vertical
    } else {
      const last = !followingSibling(rows, r, L);
      guideSeg(cell, x, 0, 1, last ? ROW_H / 2 : ROW_H);    // connector vertical (└ stops at middle, ├ goes on)
      guideSeg(cell, x, ROW_H / 2, INDENT / 2, 1);            // connector horizontal toward the icon
    }
  }
  return cell;
}

// "Layers" card: header with the title + body with the FULL layer tree of the
// selection (hierarchy guides + type icon per layer). The current layer (the one
// this row documents) is dark + Medium; the rest are #999999 + Regular.
export async function layersTree(rows: TreeRow[], currentId: string): Promise<FrameNode> {
  const card = verticalFrame("Card", 0);
  card.strokes = [{ type: "SOLID", color: BORDER_E1 }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.fills = themedFill(themeVars().bgSpec);
  card.clipsContent = true;
  card.minWidth = 312; // minimum width of the layers card

  const header = horizontalFrame("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.paddingTop = header.paddingBottom = 8;
  header.paddingLeft = header.paddingRight = 16;
  header.strokes = [{ type: "SOLID", color: BORDER_E1 }];
  header.strokeTopWeight = header.strokeLeftWeight = header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;
  header.appendChild(await cardHeaderText("Layers"));
  card.appendChild(header);
  header.layoutSizingHorizontal = "FILL";

  const body = verticalFrame("Body", 0);
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 24;
  const hierarchy = verticalFrame("Hierarchy", 8);
  for (let i = 0; i < rows.length; i++) {
    const row = horizontalFrame("Layer", 4);
    row.counterAxisAlignItems = "CENTER";
    if (rows[i].level > 0) row.appendChild(treeGuides(rows, i));
    const icon = nodeTypeIcon(rows[i].type, 16);
    if (icon) row.appendChild(icon);
    const isCurrent = rows[i].id === currentId;
    const t = await text(rows[i].name, 14, isCurrent ? FONT_MEDIUM : undefined);
    if (!isCurrent) t.fills = [{ type: "SOLID", color: GRAY_999 }];
    row.appendChild(t);
    hierarchy.appendChild(row);
  }
  body.appendChild(hierarchy);
  card.appendChild(body);
  body.layoutSizingHorizontal = "FILL";
  return card;
}
