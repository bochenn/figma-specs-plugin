import iconWidth from "../../../resources/figma-UI3/icon.24.prop-width.svg";
import iconHeight from "../../../resources/figma-UI3/icon.24.prop-height.svg";
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
import iconText from "../../../resources/figma-UI3/icon.24.prop-text.svg";
import iconAlignVLeft from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.left.svg";
import iconAlignVCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.center.svg";
import iconAlignVRight from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.right.svg";
import iconAlignHTop from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.top.svg";
import iconAlignHCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.center.svg";
import iconAlignHBottom from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.bottom.svg";
import iconAlignBaseline from "../../../resources/figma-UI3/icon.16.autolayout.alignment.baseline.svg";

// key lógica → SVG crudo de la librería UI3.
const ICONOS_UI3: Record<string, string> = {
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
};

const GRIS_ICONO = "#666666";

// Crea el nodo del ícono normalizado a 24px y recoloreado al gris del panel.
export function nodoIcono(key: string): SceneNode {
  const raw = ICONOS_UI3[key] ?? ICONOS_UI3.width;
  const svg = raw
    .replace(/width="\d+"/, 'width="24"')
    .replace(/height="\d+"/, 'height="24"')
    .split("#171717").join(GRIS_ICONO);
  return figma.createNodeFromSvg(svg);
}
