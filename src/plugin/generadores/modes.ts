import type { ModesCollection } from "../modelo/tipos.ts";
import { verticalFrame, text, inColumns, themedFill, card, pillRow, variableChip, FONT_BOLD, keyText, valueText } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";

// A mode block as a card: header with name + artwork (if there's a collection) + attribute pill-rows.
async function modeBlock(
  selected: SceneNode,
  figmaCollection: VariableCollection | null,
  modeId: string,
  name: string,
  collection: ModesCollection,
): Promise<FrameNode> {
  const headerNodes: SceneNode[] = [await text(name, 16, FONT_BOLD)];

  const rows: FrameNode[] = [];

  if (figmaCollection) {
    const clone = selected.clone();
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = themedFill(themeVars().bgArtwork);
    artwork.appendChild(clone);
    clone.x = 0;
    clone.y = 0;
    if ("setExplicitVariableMode" in clone) {
      (clone as { setExplicitVariableMode(c: VariableCollection, m: string): void }).setExplicitVariableMode(figmaCollection, modeId);
    }
    artwork.resize(clone.width, clone.height);
    // The artwork is not a pillRow; it goes as a loose node inside the card body.
    // To pass it as a FrameNode into the rows array, we include it directly.
    rows.push(artwork);
  }

  for (const attr of collection.attributes) {
    const v = attr.values.find((x) => x.modeId === modeId);
    const value = v ? v.value : "—";
    rows.push(pillRow([
      await keyText(`${attr.appliedAs}:`),
      await variableChip(attr.variableName),
      await valueText(`(${value})`),
    ]));
  }

  return card(headerNodes, rows);
}

// Subsection for a collection: heading + one block per mode.
async function collectionSubsection(selected: SceneNode, collection: ModesCollection, columns: number): Promise<FrameNode> {
  const sub = verticalFrame(collection.collectionName, 40);
  sub.appendChild(await text(collection.collectionName, 36));
  const figmaCollection = collection.collectionId
    ? await figma.variables.getVariableCollectionByIdAsync(collection.collectionId)
    : null;
  const blocks: FrameNode[] = [];
  for (const mode of collection.modes) {
    blocks.push(await modeBlock(selected, figmaCollection, mode.modeId, mode.name, collection));
  }
  if (columns > 1) {
    sub.appendChild(inColumns(blocks, columns));
  } else {
    for (const b of blocks) sub.appendChild(b);
  }
  return sub;
}

// Generates the Modes output. Returns the Specifications frame.
export async function generateModes(selected: SceneNode, collections: ModesCollection[], columns: number): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${selected.name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(selected.name, 64));
  spec.appendChild(await modesSection(selected, collections, columns));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds only the Modes section (without Specifications or node title).
export async function modesSection(selected: SceneNode, collections: ModesCollection[], columns: number): Promise<FrameNode> {
  const section = verticalFrame("Modes", 64);
  section.appendChild(await text("Modes", 48));

  if (collections.length === 0) {
    section.appendChild(await text("No variables with multiple modes found.", 16));
  }
  for (const c of collections) {
    section.appendChild(await collectionSubsection(selected, c, columns));
  }

  return section;
}
