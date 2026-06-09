import type { PropiedadSpec, ElementoCambiado } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

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

// Texto legible de un atributo cambiado: "valorOpcion (default: valorDefault)".
function lineaAtributo(c: { clave: string; valorDefault?: string; valorOpcion?: string }): string {
  return `${c.clave}: ${c.valorOpcion ?? "—"} (default: ${c.valorDefault ?? "—"})`;
}

// Construye la lista de cambios de una opción.
async function listaCambios(cambios: ElementoCambiado[]): Promise<FrameNode> {
  const lista = frameVertical("Cambios", 16);
  if (cambios.length === 0) {
    lista.appendChild(await texto("Sin cambios respecto al default", 16));
    return lista;
  }
  for (const cambio of cambios) {
    const fila = frameVertical(cambio.elementoNombre, 4);
    const sufijo = cambio.estado === "modificado" ? "" : ` · ${cambio.estado}`;
    fila.appendChild(await texto(`${cambio.elementoNombre}${sufijo}`, 16));
    for (const attr of cambio.atributos) {
      fila.appendChild(await texto(lineaAtributo(attr), 12));
    }
    lista.appendChild(fila);
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
    artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
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

// Genera el output de Properties. Devuelve el frame Specifications creado.
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  const seccion = frameVertical("Properties", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Properties", 48));

  if (propiedades.length === 0) {
    seccion.appendChild(await texto("Sin propiedades de variante para comparar", 16));
  }

  for (const prop of propiedades) {
    const subseccion = frameVertical(prop.nombre, 40);
    subseccion.appendChild(await texto(prop.nombre, 36));
    for (const opcion of prop.opciones) {
      const bloque = frameVertical(opcion.nombre, 16);
      bloque.appendChild(await texto(opcion.nombre, 24));
      const target = { ...defaultProps, [prop.nombre]: opcion.nombre };
      bloque.appendChild(await displayOpcion(componentSet, target, opcion.cambios));
      subseccion.appendChild(bloque);
    }
    seccion.appendChild(subseccion);
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
