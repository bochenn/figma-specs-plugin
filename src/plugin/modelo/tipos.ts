export interface LineHeightVal {
  unit: "px" | "percent" | "auto";
  value?: number;
}

export interface LetterSpacingVal {
  unit: "px" | "percent";
  value: number;
}

// Gradient stops (RGBA color + position 0..1), with its transform.
export interface GradientData {
  type: string; // "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | ...
  gradientStops: { position: number; color: { r: number; g: number; b: number; a: number } }[];
  gradientTransform?: number[][];
}

// Minimal paint: solid color or gradient data.
export interface PaintLike {
  type: string;
  color?: { r: number; g: number; b: number };
  gradient?: GradientData;
}

// Minimal interface of a Figma node: only what the pure modules read.
// Allows testing without loading the real Figma API.
export interface NodeLike {
  id: string;
  name: string;
  type: string;
  children?: NodeLike[];
  // visual attributes (optional per node type):
  width?: number;
  height?: number;
  opacity?: number;
  fills?: ReadonlyArray<PaintLike>;
  strokes?: ReadonlyArray<PaintLike>;
  // instances only:
  mainComponentName?: string;
  // layout (only on Auto Layout nodes):
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID";
  gridColumnCount?: number;
  gridRowCount?: number;
  gridColumnGap?: number;
  gridRowGap?: number;
  gridColumnGapVar?: string;
  gridRowGapVar?: string;
  primaryAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN"
  counterAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "BASELINE"
  paddingLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutWrap?: "NO_WRAP" | "WRAP";
  layoutGrids?: GridSpec[];
  spacingVars?: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string };
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  // resolved styles (Styling Inventory):
  fillStyleName?: string;
  strokeStyleName?: string;
  textStyleName?: string;
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  lineHeight?: LineHeightVal;
  letterSpacing?: LetterSpacingVal;
  textAlign?: string;            // horizontal text alignment ("LEFT" | "CENTER" | ...)
  textCase?: string;             // case transformation ("ORIGINAL" | "UPPER" | ...)
  // resolved color variables (Variable Formatting):
  fillVariableName?: string;     // "Collection/Variable" of the fill
  strokeVariableName?: string;   // idem stroke
  widthVariableName?: string;    // variable bound to the width
  heightVariableName?: string;   // variable bound to the height
  cornerRadius?: number;         // corner radius (uniform)
  cornerRadiusVar?: string;      // variable bound to the corner radius
}

export interface Attribute {
  key: string;        // "background-color", "border-color", "width", "opacity"
  value: string;        // hex, "Collection/Variable", or style name
  format: "HARDCODED" | "VARIABLE" | "STYLE";
  rawValue?: string;    // resolved hex (for variable/style)
  swatchHex?: string;   // swatch color (present on color attributes)
  prefix?: string;     // resizing mode for width/height ("Fixed" | "Hug" | "Fill")
}

export interface AnatomyElement {
  id: string;
  name: string;
  type: string; // Figma NodeType: "FRAME" | "TEXT" | "INSTANCE" | ...
  isInstance: boolean;
  dependsOn?: string; // "Depends on"
  attributes: Attribute[];
  depth?: number; // instances traversed (absent = 0, own layer)
}

// UI ↔ plugin messages.
export type Section = "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete";

export type ColorFormat = "HEX" | "RGB" | "HSL";

export type Unit = "px" | "rem";

export type Preference = "VARIABLE" | "STYLE";

export type TypeFormat = "Plain" | "CSS";

export type UIMessage = { type: "generate"; sections: Section[]; nested?: boolean; dark?: boolean; columns?: number; table?: boolean; hideOuter?: boolean; itemize?: boolean; measureChildren?: boolean; legend?: boolean; stylingTotal?: boolean; colorFormat?: ColorFormat; unit?: Unit; typeFormat?: TypeFormat; rawFormat?: ColorFormat; showRaw?: boolean; preference?: Preference; anatomyDepth?: "self" | "children" | "all" } | { type: "cancel" } | { type: "open"; url: string };

export type PluginMessage =
  | { type: "result"; ok: true }
  | { type: "result"; ok: false; error: string };

// --- Properties (Variant) ---

// An attribute that changes between the default and an option. Carries both values
// to be able to show "optionValue (default: defaultValue)".
export interface ChangedAttribute {
  key: string;          // "background-color", "width", "opacity"
  defaultValue?: string;  // absent if the attribute didn't exist in the default
  optionValue?: string;   // absent if the attribute disappears in the option
  rawValueDefault?: string; // resolved value of the default (variables/styles)
  rawValueOption?: string;  // resolved value of the option
  swatchHex?: string;     // swatch color (the option's; color attributes only)
  formatDefault?: "VARIABLE" | "STYLE"; // present only if it's a token (to use ChipVar)
  formatOption?: "VARIABLE" | "STYLE";
  prefixDefault?: string; // default resizing mode (width/height): Fixed/Hug/Fill
  prefixOption?: string;
}

export interface ChangedElement {
  elementName: string;
  state: "modified" | "added" | "removed";
  attributes: ChangedAttribute[]; // empty if state is "added"/"removed"
}

export interface OptionSpec {
  name: string;                // "Small"
  changes: ChangedElement[];
}

export interface PropertySpec {
  name: string;                // "Size"
  type: "VARIANT";
  default: string;               // this prop's value in the default, e.g. "Medium"
  options: OptionSpec[];
}

export interface CombinationSpec {
  value1: string;
  value2: string;
  changes: ChangedElement[];
}

export interface TwoWaySpec {
  prop1: string;
  prop2: string;
  combinations: CombinationSpec[];
}

export interface ExtraElement {
  variant: string;   // variant label, e.g. "Size=M, Type=Sec"
  name: string;
  type: string;
}

// A pair of elements matched between default and option.
export interface ElementPair {
  default?: NodeLike;
  option?: NodeLike;
}

// A normalized variant: its props map + its tree as NodeLike.
export interface NormVariant {
  variantProperties: Record<string, string>;
  root: NodeLike;
}

// The Component Set normalized for pure extraction.
export interface NormSet {
  properties: Record<string, string[]>;  // from variantGroupProperties: prop → options
  variants: NormVariant[];
  defaultProps: Record<string, string>;   // the default's variantProperties
}

// --- Layout and Spacing ---

export interface GridSpec {
  pattern: "GRID" | "COLUMNS" | "ROWS";
  alignment?: "MIN" | "MAX" | "CENTER" | "STRETCH";
  count?: number;        // may come as Infinity ("Auto")
  gutter?: number;
  sectionSize?: number;
  offset?: number;
}

export interface LayoutSpec {
  elementName: string;
  type: string;                  // FRAME, COMPONENT, etc.
  direction: "HORIZONTAL" | "VERTICAL" | "GRID";
  primaryAlignment: string;    // "Start" | "Center" | "End" | "Space between"
  counterAlignment: string;
  resizingHorizontal: string;    // "Fill" | "Hug" | "Fixed"
  resizingVertical: string;
  padding: { left: number; top: number; right: number; bottom: number };
  itemSpacing: number;
  wrap: boolean;          // layoutWrap === "WRAP"
  spacingAuto: boolean;   // primaryAxisAlignItems === "SPACE_BETWEEN" → marker "Auto"
  grids: GridSpec[];
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string };
  width: number;
  height: number;
  widthVar?: string;
  heightVar?: string;
  cornerRadius?: number;
  cornerRadiusVar?: string;
  textStyle?: { name?: string; summary?: string };
  gridColumnGapVar?: string;
  gridRowGapVar?: string;
  fill?: Attribute;
  stroke?: Attribute;
  depth?: number; // instances traversed (absent = 0)
  gridColumns?: number;
  gridRows?: number;
  gridColumnGap?: number;
  gridRowGap?: number;
}

export interface LayoutVariant {
  variant: string;
  spec: LayoutSpec;
}

// --- Data (JSON export) ---

export interface JsonAttribute {
  value: string;
  format: string;   // "HARDCODED" | "VARIABLE" | "STYLE"
  key: string;      // "background-color", etc.
}

export interface JsonElement {
  name: string;
  type: string;
  instanceOf?: string;        // instances only
  attributes: JsonAttribute[];
}

export interface AnatomyJson {
  anatomy: JsonElement[];
}

// --- Styling Inventory ---

// Typography of a text style (for the preview and the properties list).
export interface TextType {
  family: string;
  style: string;
  size: number;
  lineHeight?: LineHeightVal;
  letterSpacing?: LetterSpacingVal;
}

export interface StyleEntry {
  table: "color" | "text" | "variable";
  name: string;       // style or variable name
  appliedAs: string;    // "Background color" | "Text color" | "Border color" | "Text style"
  layer: string;         // layer name
  swatchHex?: string;   // chip color (variables only)
  gradient?: GradientData; // gradient swatch (gradient color styles)
  type?: TextType;     // the style's typography (text styles only)
}

export interface InventoryRow {
  table: "color" | "text" | "variable";
  name: string;
  appliedAs: string;
  appliedTo: string;    // formatted layers
  swatchHex?: string;   // chip color (variables only)
  gradient?: GradientData; // gradient swatch (gradient color styles)
  type?: TextType;     // the style's typography (text styles only)
}

// --- Modes ---

export interface ModeValue {
  modeId: string;
  value: string;   // hex o "→ nombreAlias"
}

export interface ModeEntry {
  collectionName: string;
  collectionId?: string;
  modes: { modeId: string; name: string }[];
  layer: string;
  appliedAs: string;
  variableName: string;
  values: ModeValue[];
}

export interface ModeAttribute {
  layer: string;
  appliedAs: string;
  variableName: string;
  values: ModeValue[];
}

export interface ModesCollection {
  collectionName: string;
  collectionId?: string;
  modes: { modeId: string; name: string }[];
  attributes: ModeAttribute[];
}
