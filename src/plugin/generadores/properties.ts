import type { PropiedadSpec, ElementoCambiado, AtributoCambiado, DosWaySpec } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado, tarjeta, filaPill, chipVariable, FONT_BOLD, FONT_SEMI } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { hexARgb } from "../utils/color.ts";
import { nombrePropiedad } from "../utils/propiedades.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });
const AZUL_HL: RGB = { r: 0.05, g: 0.4, b: 0.85 };

// Recorre el variante default (offset acumulado) y, por cada nodo cuya
// visibilidad referencia la booleana, dibuja un rect azul en el artwork y junta
// su nombre. Frena en instancias.
function resaltarBoolean(node: SceneNode, offX: number, offY: number, propKey: string, artwork: FrameNode, nombres: string[]): void {
  const refs = (node as { componentPropertyReferences?: { visible?: string } | null }).componentPropertyReferences;
  if (refs && refs.visible === propKey) {
    const rect = figma.createRectangle();
    rect.x = offX;
    rect.y = offY;
    rect.resize(Math.max(node.width, 0.01), Math.max(node.height, 0.01));
    rect.fills = [{ type: "SOLID", color: AZUL_HL, opacity: 0.3 }];
    artwork.appendChild(rect);
    nombres.push(node.name);
  }
  if (node.type === "INSTANCE") return;
  if ("children" in node) {
    for (const c of node.children) resaltarBoolean(c, offX + c.x, offY + c.y, propKey, artwork, nombres);
  }
}

// Subsección de una propiedad booleana: heading + artwork (clon con highlights) + capas afectadas.
async function subseccionBoolean(componentSet: ComponentSetNode, nombre: string, propKey: string): Promise<FrameNode> {
  const sub = frameVertical(nombre, 40);
  sub.appendChild(await texto(nombre, 36));

  const nombres: string[] = [];
  const defaultVariant = componentSet.defaultVariant;
  if (defaultVariant) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.clipsContent = false;
    artwork.fills = fillTematizado(varsTema().fondoArtwork);
    const clon = defaultVariant.clone();
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    artwork.resize(clon.width, clon.height);
    // Detecta sobre el variante original (geometría idéntica al clon) y dibuja en el artwork.
    resaltarBoolean(defaultVariant, 0, 0, propKey, artwork, nombres);
    sub.appendChild(artwork);
  }

  sub.appendChild(await texto(`Affected layers: ${nombres.length ? nombres.join(", ") : "—"}`, 12));
  return sub;
}

// Busca el componente-variante real del set que coincide con el target de props.
function buscarComponente(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
): ComponentNode | undefined {
  for (const hijo of componentSet.children) {
    if (hijo.type === "COMPONENT" && mismasProps(hijo.variantProperties ?? {}, target)) {
      return hijo;
    }
  }
  return undefined;
}

// Texto legible de un atributo cambiado: "valorOpcion (raw) (default: valorDefault (raw))".
// El (raw) aparece solo cuando el valor es una variable/style con valor resuelto.
function lineaAtributo(c: AtributoCambiado): string {
  const op = `${c.valorOpcion ?? "—"}${c.rawValueOpcion ? ` (${c.rawValueOpcion})` : ""}`;
  const def = `${c.valorDefault ?? "—"}${c.rawValueDefault ? ` (${c.rawValueDefault})` : ""}`;
  return `${c.clave}: ${op} (default: ${def})`;
}

// Dibuja un cambio de atributo como filaPill: swatch (si color) + clave + valores.
async function filaAtributoCambiado(c: AtributoCambiado): Promise<FrameNode> {
  const nodos: SceneNode[] = [];
  if (c.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexARgb(c.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    swatch.strokeWeight = 1;
    nodos.push(swatch);
  }
  // clave:
  nodos.push(await texto(`${c.clave}:`, 12, FONT_SEMI));
  // valor opción
  if (c.valorOpcion && c.valorOpcion !== "—") {
    nodos.push(await chipVariable(c.valorOpcion));
  } else {
    nodos.push(await texto("—", 12, FONT_SEMI));
  }
  if (c.rawValueOpcion) nodos.push(await texto(`(${c.rawValueOpcion})`, 12, FONT_SEMI));
  // default
  nodos.push(await texto("default:", 12, FONT_SEMI));
  if (c.valorDefault && c.valorDefault !== "—") {
    nodos.push(await chipVariable(c.valorDefault));
  } else {
    nodos.push(await texto("—", 12, FONT_SEMI));
  }
  if (c.rawValueDefault) nodos.push(await texto(`(${c.rawValueDefault})`, 12, FONT_SEMI));
  return filaPill(nodos);
}

// Construye la lista de cambios de una opción. Cada elemento cambiado es una tarjeta.
async function listaCambios(cambios: ElementoCambiado[]): Promise<FrameNode> {
  const lista = frameVertical("Cambios", 8);
  if (cambios.length === 0) {
    lista.appendChild(await texto("Sin cambios respecto al default", 16));
    return lista;
  }
  for (const cambio of cambios) {
    const sufijo = cambio.estado === "modificado" ? "" : ` · ${cambio.estado}`;
    const headerNodos: SceneNode[] = [await texto(`${cambio.elementoNombre}${sufijo}`, 16, FONT_BOLD)];
    const filas: FrameNode[] = [];
    for (const attr of cambio.atributos) {
      filas.push(await filaAtributoCambiado(attr));
    }
    lista.appendChild(tarjeta(headerNodos, filas));
  }
  return lista;
}

// Construye el display de una opción: artwork (clon del variante) + lista de cambios.
async function displayOpcion(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
  cambios: ElementoCambiado[],
): Promise<FrameNode> {
  const display = frameHorizontal("Display", 64);

  const componente = buscarComponente(componentSet, target);
  if (componente) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = fillTematizado(varsTema().fondoArtwork);
    const clon = componente.clone();
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    artwork.resize(clon.width, clon.height);
    display.appendChild(artwork);
  }

  display.appendChild(await listaCambios(cambios));
  return display;
}

// Construye el frame "{nombre} Spec" completo de un component set: título +
// sección Properties (subsección por propiedad de variante + booleans).
async function specDeProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(await seccionDeProperties(componentSet, propiedades, defaultProps, columnas));
  return spec;
}

// Construye solo la sección Properties (sin Specifications ni título de nodo).
export async function seccionDeProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const seccion = frameVertical("Properties", 64);
  seccion.appendChild(await texto("Properties", 48));

  if (propiedades.length === 0) {
    seccion.appendChild(await texto("Sin propiedades de variante para comparar", 16));
  }

  for (const prop of propiedades) {
    const subseccion = frameVertical(prop.nombre, 40);
    subseccion.appendChild(await texto(prop.nombre, 36));
    const bloques: FrameNode[] = [];
    for (const opcion of prop.opciones) {
      const target = { ...defaultProps, [prop.nombre]: opcion.nombre };
      const headerNodos: SceneNode[] = [await texto(opcion.nombre, 16, FONT_BOLD)];
      // displayOpcion (artwork + listaCambios) va dentro del body de la tarjeta como nodo único
      const display = await displayOpcion(componentSet, target, opcion.cambios);
      bloques.push(tarjeta(headerNodos, [display]));
    }
    if (columnas > 1) {
      subseccion.appendChild(enColumnas(bloques, columnas));
    } else {
      for (const b of bloques) subseccion.appendChild(b);
    }
    seccion.appendChild(subseccion);
  }

  const defs = componentSet.componentPropertyDefinitions;
  for (const clave of Object.keys(defs)) {
    if (defs[clave].type === "BOOLEAN") {
      seccion.appendChild(await subseccionBoolean(componentSet, nombrePropiedad(clave), clave));
    }
  }

  return seccion;
}

// Genera el output de Properties. Devuelve el frame Specifications creado.
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, propiedades, defaultProps, columnas));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Properties de un set anidado, ya extraídas.
export interface PropertiesDeSet {
  set: ComponentSetNode;
  propiedades: PropiedadSpec[];
  defaultProps: Record<string, string>;
}

// Genera Properties del set principal + una sección por cada set anidado.
export async function generarPropertiesConNested(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
  nested: PropertiesDeSet[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, propiedades, defaultProps, columnas));
  for (const n of nested) {
    specifications.appendChild(await specDeProperties(n.set, n.propiedades, n.defaultProps, columnas));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Genera el output de Two-Way: una combinación por bloque (artwork + cambios).
export async function generarDosWay(
  componentSet: ComponentSetNode,
  dosway: DosWaySpec,
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(await seccionDeDosWay(componentSet, dosway, defaultProps, columnas));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye solo la sección Two-Way (sin Specifications ni título de nodo).
export async function seccionDeDosWay(
  componentSet: ComponentSetNode,
  dosway: DosWaySpec,
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const seccion = frameVertical("Two-Way", 64);
  seccion.appendChild(await texto("Two-Way", 48));
  seccion.appendChild(await texto(`${dosway.prop1} × ${dosway.prop2}`, 24));

  const bloques: FrameNode[] = [];
  for (const comb of dosway.combinaciones) {
    const target = { ...defaultProps, [dosway.prop1]: comb.valor1, [dosway.prop2]: comb.valor2 };
    const headerNodos: SceneNode[] = [await texto(`${comb.valor1} + ${comb.valor2}`, 16, FONT_BOLD)];
    const display = await displayOpcion(componentSet, target, comb.cambios);
    bloques.push(tarjeta(headerNodos, [display]));
  }
  if (columnas > 1) {
    seccion.appendChild(enColumnas(bloques, columnas));
  } else {
    for (const b of bloques) seccion.appendChild(b);
  }
  return seccion;
}
