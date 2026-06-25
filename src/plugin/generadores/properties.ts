import type { PropiedadSpec, ElementoCambiado, AtributoCambiado, DosWaySpec } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado, tarjeta, filaPill, chipVariable, FONT_MEDIUM, textoClave, textoValor } from "./frames.ts";
import { indicadorDimension, iconoResizingKey } from "./iconos.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { hexARgb } from "../utils/color.ts";
import { nombrePropiedad } from "../utils/propiedades.ts";
import { parseVariantes } from "../utils/anatomy-variantes.ts";

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
    const clon = defaultVariant.createInstance(); // instancia del variante, no un clon-componente
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

// Cualquier variante que tenga `valor` en la propiedad `prop` (matriz dispersa).
function buscarComponenteConValor(componentSet: ComponentSetNode, prop: string, valor: string): ComponentNode | undefined {
  for (const hijo of componentSet.children) {
    if (hijo.type === "COMPONENT" && (hijo.variantProperties ?? {})[prop] === valor) return hijo;
  }
  return undefined;
}

// Marcador ◆ que precede a cada valor en la tabla de propiedades.
function diamante(): PolygonNode {
  const p = figma.createPolygon();
  p.pointCount = 4;
  p.resize(8, 8);
  p.fills = [{ type: "SOLID", color: GRIS(0.1) }];
  return p;
}

// Fila de la tabla de propiedades: label (gris, ancho fijo) + ◆ + valor.
async function filaPropTabla(label: string, valor: string): Promise<FrameNode> {
  const fila = frameHorizontal("prop", 12);
  fila.counterAxisAlignItems = "CENTER";
  const lbl = await textoClave(label);
  lbl.textAutoResize = "HEIGHT";
  lbl.resize(160, lbl.height);
  fila.appendChild(lbl);
  fila.appendChild(diamante());
  fila.appendChild(await textoValor(valor));
  return fila;
}

// Card de un variante (estilo Spectral): header + [artwork (instancia) | tabla de propiedades].
async function cardVariante(header: string, comp: ComponentNode, nombresProps: string[]): Promise<FrameNode> {
  const display = frameHorizontal("Display", 64);
  display.counterAxisAlignItems = "MIN";

  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const inst = comp.createInstance();
  artwork.appendChild(inst);
  inst.x = 0;
  inst.y = 0;
  artwork.resize(inst.width, inst.height);
  display.appendChild(artwork);

  const props = comp.variantProperties ?? {};
  const tabla = frameVertical("PropsTable", 8);
  for (const name of nombresProps) {
    if (props[name] === undefined) continue;
    tabla.appendChild(await filaPropTabla(name, props[name]));
  }
  display.appendChild(tabla);

  return tarjeta([await texto(header, 16, FONT_MEDIUM)], [display]);
}

// Texto legible de un atributo cambiado: "valorOpcion (raw) (default: valorDefault (raw))".
// El (raw) aparece solo cuando el valor es una variable/style con valor resuelto.
function lineaAtributo(c: AtributoCambiado): string {
  const op = `${c.valorOpcion ?? "—"}${c.rawValueOpcion ? ` (${c.rawValueOpcion})` : ""}`;
  const def = `${c.valorDefault ?? "—"}${c.rawValueDefault ? ` (${c.rawValueDefault})` : ""}`;
  return `${c.clave}: ${op} (default: ${def})`;
}

// Dibuja un cambio de atributo como DOS pills horizontales: itemValue-current
// (clave + valor de la opción, a la izquierda) e itemValue-default (default +
// su valor, a la derecha). Separa visualmente el valor actual del default.
async function filaAtributoCambiado(c: AtributoCambiado): Promise<FrameNode> {
  // itemValue-current: swatch + clave + valor de la opción
  const current: SceneNode[] = [];
  if (c.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexARgb(c.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    swatch.strokeWeight = 1;
    current.push(swatch);
  }
  current.push(await textoClave(`${c.clave}:`));
  // ChipVar solo si es token; si no, texto plano
  if (c.valorOpcion && c.valorOpcion !== "—") {
    current.push(c.formatoOpcion ? await chipVariable(c.valorOpcion) : await textoValor(c.valorOpcion));
  } else {
    current.push(await textoValor("—"));
  }
  if (c.rawValueOpcion) current.push(await textoValor(`(${c.rawValueOpcion})`));
  if (iconoResizingKey(c.clave, c.prefijoOpcion)) current.push(await indicadorDimension(c.clave, c.prefijoOpcion!));
  const pillCurrent = filaPill(current);
  pillCurrent.name = "itemValue-current";

  // itemValue-default: default: + valor del default
  const def: SceneNode[] = [await textoClave("default:")];
  if (c.valorDefault && c.valorDefault !== "—") {
    def.push(c.formatoDefault ? await chipVariable(c.valorDefault) : await textoValor(c.valorDefault));
  } else {
    def.push(await textoValor("—"));
  }
  if (c.rawValueDefault) def.push(await textoValor(`(${c.rawValueDefault})`));
  if (iconoResizingKey(c.clave, c.prefijoDefault)) def.push(await indicadorDimension(c.clave, c.prefijoDefault!));
  const pillDefault = filaPill(def);
  pillDefault.name = "itemValue-default";

  const fila = frameHorizontal("cambio", 8);
  fila.counterAxisAlignItems = "CENTER";
  fila.appendChild(pillCurrent);
  fila.appendChild(pillDefault);
  return fila;
}

// Etiqueta en inglés del estado de un elemento cambiado (el valor interno queda en español).
const ETIQUETA_ESTADO: Record<ElementoCambiado["estado"], string> = {
  modificado: "Modified",
  agregado: "Added",
  removido: "Removed",
};

// Construye la lista de cambios de una opción. Cada elemento cambiado es una tarjeta.
// `nombreBase` es el nombre del componente (para la card raíz del variante).
async function listaCambios(cambios: ElementoCambiado[], nombreBase: string): Promise<FrameNode> {
  const lista = frameVertical("Cambios", 8);
  if (cambios.length === 0) {
    lista.appendChild(await texto("No changes from the default", 16));
    return lista;
  }
  // Consolida added/removed repetidos (misma capa nombre+estado, ej. varios "Vector")
  // en una sola card con cantidad.
  const cuenta = new Map<string, number>();
  const orden: ElementoCambiado[] = [];
  for (const c of cambios) {
    if (c.atributos.length === 0) {
      const k = `${c.elementoNombre}|${c.estado}`;
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
      if (cuenta.get(k) === 1) orden.push(c);
    } else {
      orden.push(c);
    }
  }
  for (const cambio of orden) {
    const props = parseVariantes(cambio.elementoNombre); // no vacío solo en la raíz (variante)
    const headerNodos: SceneNode[] = [];
    const filas: FrameNode[] = [];
    if (props.length > 0) {
      // Raíz del variante: nombre del componente + sus props en vertical (estilo panel de Figma).
      headerNodos.push(await texto(nombreBase, 16, FONT_MEDIUM));
      for (const p of props) filas.push(filaPill([await textoClave(`${p.clave}:`), await textoValor(p.valor)]));
    } else {
      const n = cuenta.get(`${cambio.elementoNombre}|${cambio.estado}`) ?? 1;
      const sufijo = cambio.estado === "modificado" ? "" : ` · ${ETIQUETA_ESTADO[cambio.estado]}${n > 1 ? ` ×${n}` : ""}`;
      headerNodos.push(await texto(`${cambio.elementoNombre}${sufijo}`, 16, FONT_MEDIUM));
    }
    for (const attr of cambio.atributos) {
      filas.push(await filaAtributoCambiado(attr));
    }
    // Added/removed sin atributos: una nota, en vez de una caja vacía.
    if (cambio.atributos.length === 0 && props.length === 0) {
      const nota = cambio.estado === "agregado" ? "Added in this variant" : "Removed from this variant";
      filas.push(filaPill([await textoValor(nota)]));
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
    const clon = componente.createInstance(); // instancia del variante, no un clon-componente
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    artwork.resize(clon.width, clon.height);
    display.appendChild(artwork);
  }

  display.appendChild(await listaCambios(cambios, componentSet.name));
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
// Estilo Spectral: por cada valor de cada propiedad, una card con el preview del
// variante + su tabla de propiedades completa. `_propiedades` ya no se usa (la
// info se toma directo del component set).
export async function seccionDeProperties(
  componentSet: ComponentSetNode,
  _propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const seccion = frameVertical("Properties", 64);
  const grupos = componentSet.variantGroupProperties;
  const nombresProps = Object.keys(grupos);

  if (nombresProps.length === 0) {
    seccion.appendChild(await texto("No variant properties to compare", 16));
    return seccion;
  }

  // Card del variante default arriba.
  const defComp = buscarComponente(componentSet, defaultProps);
  if (defComp) seccion.appendChild(await cardVariante(componentSet.name, defComp, nombresProps));

  // Una subsección por propiedad: una card por cada valor (preview + tabla).
  for (const prop of nombresProps) {
    const subseccion = frameVertical(prop, 40);
    subseccion.appendChild(await texto(prop, 36));
    const bloques: FrameNode[] = [];
    for (const valor of grupos[prop].values) {
      const comp = buscarComponente(componentSet, { ...defaultProps, [prop]: valor })
        ?? buscarComponenteConValor(componentSet, prop, valor);
      if (!comp) continue;
      bloques.push(await cardVariante(valor, comp, nombresProps));
    }
    if (columnas > 1) {
      subseccion.appendChild(enColumnas(bloques, columnas));
    } else {
      for (const b of bloques) subseccion.appendChild(b);
    }
    seccion.appendChild(subseccion);
  }

  // Propiedades booleanas (se mantienen).
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
  seccion.appendChild(await texto(`${dosway.prop1} × ${dosway.prop2}`, 24));

  const bloques: FrameNode[] = [];
  for (const comb of dosway.combinaciones) {
    const target = { ...defaultProps, [dosway.prop1]: comb.valor1, [dosway.prop2]: comb.valor2 };
    const headerNodos: SceneNode[] = [await texto(`${comb.valor1} + ${comb.valor2}`, 16, FONT_MEDIUM)];
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
