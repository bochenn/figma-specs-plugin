// The SVG icons under resources/figma-UI3/ are taken from "UI3 — Figma's UI Kit"
// on the Figma Community (https://www.figma.com/community/file/1486123838948777078/).
// The kit states no explicit license; the icons are used in good faith under Figma's
// Community terms and are NOT covered by this project's MIT license. See README "Credits".
import { horizontalFrame, valueText, BORDER_PILL } from "./frames.ts";
import iconWidth from "../../../resources/figma-UI3/icon.24.prop-width.svg";
import iconHeight from "../../../resources/figma-UI3/icon.24.prop-height.svg";
import iconWidthFixed from "../../../resources/figma-UI3/icon.24.al.constrain-horiz.svg";
import iconHeightFixed from "../../../resources/figma-UI3/icon.24.al.constrain-vert.svg";
import iconWidthFill from "../../../resources/figma-UI3/icon.24.al.width-fill.svg";
import iconHeightFill from "../../../resources/figma-UI3/icon.24.al.height-fill.svg";
import iconWidthHug from "../../../resources/figma-UI3/icon.24.al.width-hug.svg";
import iconHeightHug from "../../../resources/figma-UI3/icon.24.al.height-hug.svg";
import iconDirH from "../../../resources/figma-UI3/icon.24.al.layout-horizontal.svg";
import iconDirV from "../../../resources/figma-UI3/icon.24.al.layout-vertical.svg";
import iconDirGrid from "../../../resources/figma-UI3/icon.24.grid.svg";
import iconFill from "../../../resources/figma-UI3/icon.24.fill.solid.small.svg";
import iconStroke from "../../../resources/figma-UI3/icon.24.outline.stroke.small.svg";
import iconPadding from "../../../resources/figma-UI3/icon.24.al.padding-all.svg";
import iconSpacingH from "../../../resources/figma-UI3/icon.24.al.spacing-horizontal.svg";
import iconSpacingV from "../../../resources/figma-UI3/icon.24.al.spacing-vertical.svg";
import iconCorner from "../../../resources/figma-UI3/icon.24.corners.svg";
import iconColumns from "../../../resources/figma-UI3/icon.24.grid-column.svg";
import iconRows from "../../../resources/figma-UI3/icon.24.grid-row.svg";
import iconText from "../../../resources/figma-UI3/icon.24.shape.text.small.svg";
import iconFrame from "../../../resources/figma-UI3/icon.24.frame.svg";
import iconInstance from "../../../resources/figma-UI3/icon.24.instance.small.svg";
import iconComponent from "../../../resources/figma-UI3/icon.24.component.svg";
import iconComponentSet from "../../../resources/figma-UI3/icon.24.component.set.svg";
import iconGroup from "../../../resources/figma-UI3/icon.24.group.small.svg";
import iconImage from "../../../resources/figma-UI3/icon.24.image.svg";
import iconAlignVLeft from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.left.svg";
import iconAlignVCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.center.svg";
import iconAlignVRight from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.right.svg";
import iconAlignHTop from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.top.svg";
import iconAlignHCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.center.svg";
import iconAlignHBottom from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.bottom.svg";
import iconAlignBaseline from "../../../resources/figma-UI3/icon.16.autolayout.alignment.baseline.svg";

// logical key → raw SVG from the UI3 library.
const UI3_ICONS: Record<string, string> = {
  width: iconWidth,
  height: iconHeight,
  "dir-horizontal": iconDirH,
  "dir-vertical": iconDirV,
  "dir-grid": iconDirGrid,
  fill: iconFill,
  stroke: iconStroke,
  padding: iconPadding,
  "spacing-h": iconSpacingH,
  "spacing-v": iconSpacingV,
  corner: iconCorner,
  columns: iconColumns,
  rows: iconRows,
  text: iconText,
  "align-v-left": iconAlignVLeft,
  "align-v-center": iconAlignVCenter,
  "align-v-right": iconAlignVRight,
  "align-h-top": iconAlignHTop,
  "align-h-center": iconAlignHCenter,
  "align-h-bottom": iconAlignHBottom,
  "align-baseline": iconAlignBaseline,
  "width-fixed": iconWidthFixed,
  "height-fixed": iconHeightFixed,
  "width-fill": iconWidthFill,
  "height-fill": iconHeightFill,
  "width-hug": iconWidthHug,
  "height-hug": iconHeightHug,
};

// Resizing icon key (Fixed/Hug/Fill) for a width/height row,
// or undefined if the attribute isn't dimensional or has no resizing mode.
export function resizingIconKey(key: string, prefix?: string): string | undefined {
  if (!prefix || (key !== "width" && key !== "height")) return undefined;
  return `${key}-${prefix.toLowerCase()}`; // e.g. "width-hug"
}

// Dimension-mode indicator that goes at the END of a width/height row:
// small bordered box + mode icon, followed by the text ("Fixed" | "Hug" | "Fill").
export async function dimensionIndicator(key: string, mode: string): Promise<FrameNode> {
  const container = horizontalFrame("dimMode", 6);
  container.counterAxisAlignItems = "CENTER";
  const iconKey = resizingIconKey(key, mode);
  if (iconKey) {
    const box = horizontalFrame("dimIcon", 0);
    box.counterAxisAlignItems = "CENTER";
    box.primaryAxisAlignItems = "CENTER";
    box.paddingTop = box.paddingBottom = box.paddingLeft = box.paddingRight = 3;
    box.cornerRadius = 4;
    box.strokes = [{ type: "SOLID", color: BORDER_PILL }];
    box.strokeWeight = 1;
    box.appendChild(nodeIcon(iconKey, 16));
    container.appendChild(box);
  }
  container.appendChild(await valueText(mode));
  return container;
}

const ICON_GRAY = "#666666";

// Creates the icon node normalized to 24px and recolored to the panel gray.
// The UI3 icons come in black (fill="black") or accent blue (#007BE5); they're
// recolored to the panel gray, keeping white/none and the opacities.
export function nodeIcon(key: string, tam = 24): SceneNode {
  const raw = UI3_ICONS[key] ?? UI3_ICONS.width;
  // The inline `style` is removed because it may carry a P3 override
  // (`fill:color(display-p3 ...)`) that overrides the recolored `fill` attribute.
  const svg = raw
    .replace(/width="\d+"/, `width="${tam}"`)
    .replace(/height="\d+"/, `height="${tam}"`)
    .replace(/\s*style="[^"]*"/g, "")
    .split("black").join(ICON_GRAY)
    .split("#171717").join(ICON_GRAY)
    .split("#007BE5").join(ICON_GRAY);
  return figma.createNodeFromSvg(svg);
}

const TYPE_ICONS: Record<string, string> = {
  FRAME: iconFrame, INSTANCE: iconInstance, COMPONENT: iconComponent,
  COMPONENT_SET: iconComponentSet, GROUP: iconGroup, TEXT: iconText, VECTOR: iconImage,
};

// Layer-type icon node (or undefined if there's no icon for that type).
export function nodeTypeIcon(type: string, tam = 24): SceneNode | undefined {
  const raw = TYPE_ICONS[type];
  if (!raw) return undefined;
  const svg = raw
    .replace(/width="\d+"/, `width="${tam}"`)
    .replace(/height="\d+"/, `height="${tam}"`)
    .replace(/\s*style="[^"]*"/g, "")
    .split("black").join("#666666")
    .split("#007BE5").join("#666666");
  return figma.createNodeFromSvg(svg);
}
