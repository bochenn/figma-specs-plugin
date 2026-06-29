import type { ExtraElement, LayoutVariant } from "../modelo/tipos.ts";
import { verticalFrame, text, inColumns, card, pillRow, keyText, valueText, cardHeaderText } from "./frames.ts";
import { groupByVariant } from "../utils/agrupar-variante.ts";
import { spacingLabel, currentUnit, paddingText } from "../utils/espaciado.ts";

// Stacks the blocks or distributes them in columns per the selector.
function addBlocks(section: FrameNode, blocks: FrameNode[], columns: number): void {
  if (blocks.length === 0) return;
  if (columns > 1) {
    section.appendChild(inColumns(blocks, columns));
  } else {
    for (const b of blocks) section.appendChild(b);
  }
}

// Generates the Complete output (Anatomy + Layout): extra elements per
// variant, and variants with a root Auto Layout different from the default.
export async function generateComplete(
  name: string,
  anatomy: ExtraElement[],
  layout: LayoutVariant[],
  columns: number,
): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(name, 64));
  for (const sec of await completeSection(name, anatomy, layout, columns)) spec.appendChild(sec);
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds the two Complete sections (Anatomy + Layout) and returns them as an
// array, without Specifications or node title.
export async function completeSection(
  name: string,
  anatomy: ExtraElement[],
  layout: LayoutVariant[],
  columns: number,
): Promise<FrameNode[]> {
  // Complete Anatomy: one block per variant with its extra elements.
  const secA = verticalFrame("Complete Anatomy", 64);
  secA.appendChild(await text("Complete Anatomy", 48));
  if (anatomy.length === 0) {
    secA.appendChild(await text("No additional elements found in other variants.", 16));
  }
  const blocksA: FrameNode[] = [];
  for (const group of groupByVariant(anatomy)) {
    const headerNodes: SceneNode[] = [await cardHeaderText(group.variant)];
    const rows: FrameNode[] = [];
    for (const el of group.elements) {
      rows.push(pillRow([await valueText(`${el.name} · ${el.type}`)]));
    }
    blocksA.push(card(headerNodes, rows));
  }
  addBlocks(secA, blocksA, columns);

  // Complete Layout: one block per variant.
  const secL = verticalFrame("Complete Layout", 64);
  secL.appendChild(await text("Complete Layout", 48));
  if (layout.length === 0) {
    secL.appendChild(await text("No additional layouts found in other variants.", 16));
  }
  const blocksL: FrameNode[] = [];
  for (const v of layout) {
    const s = v.spec;
    const dir = s.direction === "HORIZONTAL" ? "Horizontal" : s.direction === "GRID" ? "Grid" : "Vertical";
    const sv = s.spacingVars;
    const headerNodes: SceneNode[] = [await cardHeaderText(v.variant)];
    const rows: FrameNode[] = [
      pillRow([await keyText(`Direction:`), await valueText(dir)]),
      pillRow([await keyText(`Align:`), await valueText(`${s.primaryAlignment}/${s.counterAlignment}`)]),
      pillRow([await keyText(`Resize:`), await valueText(`${s.resizingHorizontal}×${s.resizingVertical}`)]),
      pillRow([await keyText(`Padding:`), await valueText(paddingText(s.padding, currentUnit(), sv))]),
      pillRow([await keyText(`Item spacing:`), await valueText(spacingLabel(s.itemSpacing, currentUnit(), sv.itemSpacing))]),
    ];
    blocksL.push(card(headerNodes, rows));
  }
  addBlocks(secL, blocksL, columns);

  return [secA, secL];
}
