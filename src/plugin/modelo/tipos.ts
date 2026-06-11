// Interfaz mínima de un nodo de Figma: solo lo que leen los módulos puros.
// Permite testear sin cargar la API real de Figma.
export interface NodoLike {
  id: string;
  name: string;
  type: string;
  children?: NodoLike[];
  // atributos visuales (opcionales según el tipo de nodo):
  width?: number;
  height?: number;
  opacity?: number;
  fills?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;
  strokes?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;
  // solo en instancias:
  mainComponentName?: string;
  // layout (solo en nodos con Auto Layout):
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN"
  counterAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "BASELINE"
  paddingLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  // estilos resueltos (Styling Inventory):
  fillStyleName?: string;
  strokeStyleName?: string;
  textStyleName?: string;
  // variables de color resueltas (Variable Formatting):
  fillVariableName?: string;     // "Colección/Variable" del fill
  strokeVariableName?: string;   // idem stroke
}

export interface Atributo {
  clave: string;        // "background-color", "border-color", "width", "opacity"
  valor: string;        // hex, "Colección/Variable", o nombre del style
  formato: "HARDCODED" | "VARIABLE" | "STYLE";
  rawValue?: string;    // hex resuelto (para variable/style)
  swatchHex?: string;   // color del swatch (presente en atributos de color)
}

export interface ElementoAnatomy {
  id: string;
  nombre: string;
  tipo: string; // NodeType de Figma: "FRAME" | "TEXT" | "INSTANCE" | ...
  esInstancia: boolean;
  dependeDe?: string; // "Depends on"
  atributos: Atributo[];
}

// Mensajes UI ↔ plugin.
export type Seccion = "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete";

export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean };

export type MensajePlugin =
  | { tipo: "resultado"; ok: true }
  | { tipo: "resultado"; ok: false; error: string };

// --- Properties (Variant) ---

// Un atributo que cambia entre el default y una opción. Lleva ambos valores
// para poder mostrar "valorOpcion (default: valorDefault)".
export interface AtributoCambiado {
  clave: string;          // "background-color", "width", "opacity"
  valorDefault?: string;  // ausente si el atributo no existía en el default
  valorOpcion?: string;   // ausente si el atributo desaparece en la opción
  swatchHex?: string;     // color del swatch (el de la opción; solo atributos de color)
}

export interface ElementoCambiado {
  elementoNombre: string;
  estado: "modificado" | "agregado" | "removido";
  atributos: AtributoCambiado[]; // vacío si estado es "agregado"/"removido"
}

export interface OpcionSpec {
  nombre: string;                // "Small"
  cambios: ElementoCambiado[];
}

export interface PropiedadSpec {
  nombre: string;                // "Size"
  tipo: "VARIANT";
  default: string;               // valor de esta prop en el default, ej "Medium"
  opciones: OpcionSpec[];
}

export interface CombinacionSpec {
  valor1: string;
  valor2: string;
  cambios: ElementoCambiado[];
}

export interface DosWaySpec {
  prop1: string;
  prop2: string;
  combinaciones: CombinacionSpec[];
}

export interface ElementoAdicional {
  variante: string;   // etiqueta de la variante, ej. "Size=M, Type=Sec"
  nombre: string;
  tipo: string;
}

// Par de elementos emparejados entre default y opción.
export interface ParElementos {
  default?: NodoLike;
  opcion?: NodoLike;
}

// Una variante normalizada: su mapa de props + su árbol como NodoLike.
export interface VarianteNorm {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
}

// El Component Set normalizado para la extracción pura.
export interface SetNorm {
  propiedades: Record<string, string[]>;  // de variantGroupProperties: prop → opciones
  variantes: VarianteNorm[];
  defaultProps: Record<string, string>;   // variantProperties del default
}

// --- Layout and Spacing ---

export interface LayoutSpec {
  elementoNombre: string;
  tipo: string;                  // FRAME, COMPONENT, etc.
  direccion: "HORIZONTAL" | "VERTICAL";
  alineacionPrimaria: string;    // "Start" | "Center" | "End" | "Space between"
  alineacionContraria: string;
  resizingHorizontal: string;    // "Fill" | "Hug" | "Fixed"
  resizingVertical: string;
  padding: { left: number; top: number; right: number; bottom: number };
  itemSpacing: number;
}

export interface VarianteLayout {
  variante: string;
  spec: LayoutSpec;
}

// --- Data (JSON export) ---

export interface AtributoJson {
  value: string;
  format: string;   // "HARDCODED" | "VARIABLE" | "STYLE"
  key: string;      // "background-color", etc.
}

export interface ElementoJson {
  name: string;
  type: string;
  instanceOf?: string;        // solo en instancias
  attributes: AtributoJson[];
}

export interface AnatomyJson {
  anatomy: ElementoJson[];
}

// --- Styling Inventory ---

export interface EntradaEstilo {
  tabla: "color" | "text" | "variable";
  nombre: string;       // nombre del estilo o variable
  appliedAs: string;    // "Background color" | "Text color" | "Border color" | "Text style"
  capa: string;         // nombre de la capa
  swatchHex?: string;   // color del chip (solo variables)
}

export interface FilaInventario {
  tabla: "color" | "text" | "variable";
  nombre: string;
  appliedAs: string;
  appliedTo: string;    // capas formateadas
  swatchHex?: string;   // color del chip (solo variables)
}

// --- Modes ---

export interface ValorModo {
  modeId: string;
  valor: string;   // hex o "→ nombreAlias"
}

export interface EntradaModo {
  coleccionNombre: string;
  coleccionId?: string;
  modos: { modeId: string; nombre: string }[];
  capa: string;
  appliedAs: string;
  variableNombre: string;
  valores: ValorModo[];
}

export interface AtributoModo {
  capa: string;
  appliedAs: string;
  variableNombre: string;
  valores: ValorModo[];
}

export interface ColeccionModes {
  coleccionNombre: string;
  coleccionId?: string;
  modos: { modeId: string; nombre: string }[];
  atributos: AtributoModo[];
}
