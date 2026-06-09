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
  // solo en instancias:
  mainComponentName?: string;
}

export interface Atributo {
  clave: string; // "background-color", "width", "opacity"
  valor: string; // valor legible: "#0E68D4", "240", "80%"
  formato: "HARDCODED" | "VARIABLE" | "STYLE";
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
export type MensajeUI = { tipo: "generar" };

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
