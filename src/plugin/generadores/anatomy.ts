import type { ElementoAnatomy } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Crea un frame con Auto Layout vertical configurado.
function frameVertical(nombre: string, gap: number, padding = 0): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = padding;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un texto. fontSize en px; carga la fuente antes de escribir.
async function texto(contenido: string, fontSize: number): Promise<TextNode> {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.fontName = { family: "Inter", style: "Regular" };
  t.characters = contenido;
  t.fontSize = fontSize;
  return t;
}

// Construye la entrada de un elemento en la lista de contenido.
async function entradaLista(indice: number, el: ElementoAnatomy): Promise<FrameNode> {
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  fila.appendChild(await texto(`${indice}. ${el.nombre} · ${el.tipo}`, 16));
  if (el.dependeDe) {
    fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  }
  for (const attr of el.atributos) {
    fila.appendChild(await texto(`${attr.clave}: ${attr.valor}`, 12));
  }
  return fila;
}

// Crea un marcador numerado (círculo + número).
async function marcador(numero: number, x: number, y: number): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.4, b: 0.85 } }];

  const num = await texto(String(numero), 14);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];

  const cont = figma.createFrame();
  cont.name = `Marcador ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
  cont.appendChild(circulo);
  cont.appendChild(num);
  num.x = (TAM_MARCADOR - num.width) / 2;
  num.y = (TAM_MARCADOR - num.height) / 2;
  cont.x = x;
  cont.y = y;
  return cont;
}

// Genera el spec completo para un nodo y su lista de elementos.
// Devuelve el frame Specifications creado.
export async function generarAnatomy(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
): Promise<FrameNode> {
  // Contenedores principales.
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Anatomy", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Anatomy", 48));

  // Display horizontal: lista a la izquierda, artwork a la derecha.
  const display = figma.createFrame();
  display.name = "Display";
  display.layoutMode = "HORIZONTAL";
  display.itemSpacing = 64;
  display.primaryAxisSizingMode = "AUTO";
  display.counterAxisSizingMode = "AUTO";
  display.fills = [];
  seccion.appendChild(display);

  // Lista de contenido.
  const lista = frameVertical("Content", 16);
  display.appendChild(lista);
  if (elementos.length === 0) {
    lista.appendChild(await texto("Sin elementos detectados", 16));
  } else {
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i]));
    }
  }

  // Artwork: clon del seleccionado + marcadores.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
  display.appendChild(artwork);

  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);

  // Un marcador por elemento, posicionado por su caja relativa al clon.
  // Los hijos directos del clon comparten orden con los primeros elementos;
  // para la primera versión, ubicamos los marcadores por índice usando la
  // posición vertical distribuida del clon (suficiente para validar el flujo).
  for (let i = 0; i < elementos.length; i++) {
    const altura = elementos.length > 0 ? clon.height / elementos.length : 0;
    const caja = { x: 0, y: i * altura, width: clon.width, height: altura };
    const pos = posicionMarcador(caja);
    artwork.appendChild(await marcador(i + 1, pos.x, pos.y));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
