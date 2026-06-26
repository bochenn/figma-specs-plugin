import type { FilaInventario, GradienteData, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";
import { hexDeColor } from "../variables/modes.ts";
import { limpiarPrefijoColeccion } from "../utils/nombre-variable.ts";

// AlturaLinea desde el LineHeight de Figma.
function alturaLinea(lh: LineHeight): AlturaLinea {
  if (lh.unit === "AUTO") return { unidad: "auto" };
  if (lh.unit === "PERCENT") return { unidad: "percent", valor: lh.value };
  return { unidad: "px", valor: lh.value };
}

// EspaciadoLetra desde el LetterSpacing de Figma.
function espaciadoLetra(ls: LetterSpacing): EspaciadoLetra {
  return { unidad: ls.unit === "PERCENT" ? "percent" : "px", valor: ls.value };
}

// Gradiente (stops + transform) desde un GradientPaint.
function gradienteDe(p: GradientPaint): GradienteData {
  return {
    type: p.type,
    gradientStops: p.gradientStops.map((s) => ({ position: s.position, color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a } })),
    gradientTransform: p.gradientTransform.map((row) => [...row]),
  };
}

// Resuelve el color de una variable en su mode default, siguiendo alias.
async function colorVariable(v: Variable): Promise<string | undefined> {
  const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  let modeId = col?.defaultModeId ?? Object.keys(v.valuesByMode)[0];
  let raw: VariableValue | undefined = v.valuesByMode[modeId];
  let guard = 0;
  while (raw && typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS" && guard++ < 10) {
    const alias = await figma.variables.getVariableByIdAsync(raw.id);
    if (!alias) return undefined;
    const aliasCol = await figma.variables.getVariableCollectionByIdAsync(alias.variableCollectionId);
    modeId = aliasCol?.defaultModeId ?? Object.keys(alias.valuesByMode)[0];
    raw = alias.valuesByMode[modeId];
  }
  if (raw && typeof raw === "object" && "r" in raw) return hexDeColor(raw);
  return undefined;
}

// Inventario de TODOS los estilos/variables locales del documento (catálogo).
// Las filas no llevan applied-where: no es sobre un elemento puntual.
export async function inventarioDocumento(): Promise<FilaInventario[]> {
  const filas: FilaInventario[] = [];

  for (const v of await figma.variables.getLocalVariablesAsync("COLOR")) {
    const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    const nombre = col ? `${limpiarPrefijoColeccion(col.name)}/${v.name}` : v.name;
    const fila: FilaInventario = { tabla: "variable", nombre, appliedAs: "", appliedTo: "" };
    const hex = await colorVariable(v);
    if (hex) fila.swatchHex = hex;
    filas.push(fila);
  }

  for (const ps of await figma.getLocalPaintStylesAsync()) {
    const fila: FilaInventario = { tabla: "color", nombre: ps.name, appliedAs: "", appliedTo: "" };
    const p = ps.paints[0];
    if (p?.type === "SOLID") fila.swatchHex = hexDeColor(p.color);
    else if (p && p.type.startsWith("GRADIENT_")) fila.gradiente = gradienteDe(p as GradientPaint);
    filas.push(fila);
  }

  for (const ts of await figma.getLocalTextStylesAsync()) {
    filas.push({
      tabla: "text", nombre: ts.name, appliedAs: "", appliedTo: "",
      tipo: {
        family: ts.fontName.family, estilo: ts.fontName.style, size: ts.fontSize,
        lineHeight: alturaLinea(ts.lineHeight), letterSpacing: espaciadoLetra(ts.letterSpacing),
      },
    });
  }

  return filas;
}
