import type { NodoLike, EntradaEstilo, GradienteData } from "../modelo/tipos.ts";
import { hexDeColor } from "../variables/modes.ts";

// Hex del primer paint SOLID de una lista, o undefined.
function hexSolido(paints: NodoLike["fills"]): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? hexDeColor(p.color) : undefined;
}

// Datos del primer paint de gradiente de una lista, o undefined.
function gradienteDe(paints: NodoLike["fills"]): GradienteData | undefined {
  return paints?.find((f) => f.gradiente)?.gradiente;
}

// Emite las entradas de estilo/variable de un solo nodo (prioridad variable > style).
function emitir(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  const appliedFill = nodo.type === "TEXT" ? "Text color" : "Background color";

  if (nodo.fillVariableName) {
    entradas.push({ tabla: "variable", nombre: nodo.fillVariableName, appliedAs: appliedFill, capa: nodo.name, swatchHex: hexSolido(nodo.fills) });
  } else if (nodo.fillStyleName) {
    const entrada: EntradaEstilo = { tabla: "color", nombre: nodo.fillStyleName, appliedAs: appliedFill, capa: nodo.name };
    const hex = hexSolido(nodo.fills);
    if (hex) entrada.swatchHex = hex;
    else { const g = gradienteDe(nodo.fills); if (g) entrada.gradiente = g; }
    entradas.push(entrada);
  }

  if (nodo.strokeVariableName) {
    entradas.push({ tabla: "variable", nombre: nodo.strokeVariableName, appliedAs: "Border color", capa: nodo.name, swatchHex: hexSolido(nodo.strokes) });
  } else if (nodo.strokeStyleName) {
    const entrada: EntradaEstilo = { tabla: "color", nombre: nodo.strokeStyleName, appliedAs: "Border color", capa: nodo.name };
    const hex = hexSolido(nodo.strokes);
    if (hex) entrada.swatchHex = hex;
    else { const g = gradienteDe(nodo.strokes); if (g) entrada.gradiente = g; }
    entradas.push(entrada);
  }

  if (nodo.textStyleName) {
    const entrada: EntradaEstilo = { tabla: "text", nombre: nodo.textStyleName, appliedAs: "Text style", capa: nodo.name };
    // Captura la tipografía del estilo (para el preview y la lista de propiedades).
    if (nodo.fontFamily && typeof nodo.fontSize === "number") {
      entrada.tipo = {
        family: nodo.fontFamily,
        estilo: nodo.fontStyle ?? "Regular",
        size: nodo.fontSize,
        lineHeight: nodo.lineHeight,
        letterSpacing: nodo.letterSpacing,
      };
    }
    entradas.push(entrada);
  }
}

// Visita un nodo: emite sus estilos y baja por sus hijos, también dentro de las
// instancias (para inventariar los tokens que usan los componentes anidados).
function visitar(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  emitir(nodo, entradas);
  for (const hijo of nodo.children ?? []) {
    visitar(hijo, entradas);
  }
}

// Recolecta todas las entradas de estilo de la selección (raíz + descendientes).
export function recolectarEstilos(raiz: NodoLike): EntradaEstilo[] {
  const entradas: EntradaEstilo[] = [];
  visitar(raiz, entradas);
  return entradas;
}
