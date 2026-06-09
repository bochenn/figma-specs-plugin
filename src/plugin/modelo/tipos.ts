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
