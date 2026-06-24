import { frameHorizontal, textoValor, BORDE_PILL } from "./frames.ts";
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
  "width-fixed": iconWidthFixed,
  "height-fixed": iconHeightFixed,
  "width-fill": iconWidthFill,
  "height-fill": iconHeightFill,
  "width-hug": iconWidthHug,
  "height-hug": iconHeightHug,
};

// Key del ícono de resizing (Fixed/Hug/Fill) para una fila de width/height,
// o undefined si el atributo no es dimensional o no tiene modo de resizing.
export function iconoResizingKey(clave: string, prefijo?: string): string | undefined {
  if (!prefijo || (clave !== "width" && clave !== "height")) return undefined;
  return `${clave}-${prefijo.toLowerCase()}`; // ej. "width-hug"
}

// Indicador del modo de dimensión que va al FINAL de una fila de width/height:
// cajita con borde + ícono del modo, seguida del texto ("Fixed" | "Hug" | "Fill").
export async function indicadorDimension(clave: string, modo: string): Promise<FrameNode> {
  const cont = frameHorizontal("dimMode", 6);
  cont.counterAxisAlignItems = "CENTER";
  const key = iconoResizingKey(clave, modo);
  if (key) {
    const caja = frameHorizontal("dimIcon", 0);
    caja.counterAxisAlignItems = "CENTER";
    caja.primaryAxisAlignItems = "CENTER";
    caja.paddingTop = caja.paddingBottom = caja.paddingLeft = caja.paddingRight = 3;
    caja.cornerRadius = 4;
    caja.strokes = [{ type: "SOLID", color: BORDE_PILL }];
    caja.strokeWeight = 1;
    caja.appendChild(nodoIcono(key, 16));
    cont.appendChild(caja);
  }
  cont.appendChild(await textoValor(modo));
  return cont;
}

const GRIS_ICONO = "#666666";

// Crea el nodo del ícono normalizado a 24px y recoloreado al gris del panel.
// Los íconos UI3 vienen en negro (fill="black") o azul de acento (#007BE5); se
// recolorean al gris del panel manteniendo white/none y las opacidades.
export function nodoIcono(key: string, tam = 24): SceneNode {
  const raw = ICONOS_UI3[key] ?? ICONOS_UI3.width;
  // Se quita el `style` inline porque puede traer un override en P3
  // (`fill:color(display-p3 ...)`) que pisa al atributo `fill` recoloreado.
  const svg = raw
    .replace(/width="\d+"/, `width="${tam}"`)
    .replace(/height="\d+"/, `height="${tam}"`)
    .replace(/\s*style="[^"]*"/g, "")
    .split("black").join(GRIS_ICONO)
    .split("#171717").join(GRIS_ICONO)
    .split("#007BE5").join(GRIS_ICONO);
  return figma.createNodeFromSvg(svg);
}

const ICONOS_TIPO: Record<string, string> = {
  FRAME: iconFrame, INSTANCE: iconInstance, COMPONENT: iconComponent,
  COMPONENT_SET: iconComponentSet, GROUP: iconGroup, TEXT: iconText, VECTOR: iconImage,
};

// Nodo del ícono del tipo de capa (o undefined si no hay ícono para ese tipo).
export function nodoIconoTipo(tipo: string, tam = 24): SceneNode | undefined {
  const raw = ICONOS_TIPO[tipo];
  if (!raw) return undefined;
  const svg = raw
    .replace(/width="\d+"/, `width="${tam}"`)
    .replace(/height="\d+"/, `height="${tam}"`)
    .replace(/\s*style="[^"]*"/g, "")
    .split("black").join("#666666")
    .split("#007BE5").join("#666666");
  return figma.createNodeFromSvg(svg);
}
