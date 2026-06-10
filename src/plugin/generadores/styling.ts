import type { FilaInventario } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
import { hexARgb } from "../utils/color.ts";

const COL_NAME = 280;
const COL_AS = 160;
const COL_TO = 280;
const CHIP = 12;

// Crea una celda de texto con ancho fijo y wrap.
async function celda(contenido: string, ancho: number): Promise<TextNode> {
  const t = await texto(contenido, 12);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Celda Name: con chip (variables) o solo texto. Ancho total ≈ COL_NAME.
async function celdaNombre(nombre: string, swatchHex: string | undefined): Promise<SceneNode> {
  if (!swatchHex) return await celda(nombre, COL_NAME);
  const cont = frameHorizontal("Name", 8);
  cont.counterAxisAlignItems = "CENTER";
  const chip = figma.createRectangle();
  chip.resize(CHIP, CHIP);
  chip.fills = [{ type: "SOLID", color: hexARgb(swatchHex) }];
  chip.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  chip.strokeWeight = 1;
  cont.appendChild(chip);
  cont.appendChild(await celda(nombre, COL_NAME - CHIP - 8));
  return cont;
}

// Fila de header (3 textos).
async function filaHeader(): Promise<FrameNode> {
  const f = frameHorizontal("Header", 16);
  f.appendChild(await celda("Name", COL_NAME));
  f.appendChild(await celda("Applied as", COL_AS));
  f.appendChild(await celda("Applied to", COL_TO));
  return f;
}

// Fila de datos: celda Name (con chip si hay) + applied as + applied to.
async function filaDatos(fila: FilaInventario): Promise<FrameNode> {
  const f = frameHorizontal("Fila", 16);
  f.appendChild(await celdaNombre(fila.nombre, fila.swatchHex));
  f.appendChild(await celda(fila.appliedAs, COL_AS));
  f.appendChild(await celda(fila.appliedTo, COL_TO));
  return f;
}

// Subsección con su tabla (o nota si no hay filas).
async function tabla(titulo: string, filas: FilaInventario[], vacio: string): Promise<FrameNode> {
  const sub = frameVertical(titulo, 16);
  sub.appendChild(await texto(titulo, 36));
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  const cuerpo = frameVertical("Tabla", 8);
  cuerpo.appendChild(await filaHeader());
  for (const f of filas) {
    cuerpo.appendChild(await filaDatos(f));
  }
  sub.appendChild(cuerpo);
  return sub;
}

// Genera el output de Styling Inventory con las tablas Variables, Color y Text styles.
export async function generarStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Styling Inventory", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Styling Inventory", 48));

  seccion.appendChild(await tabla("Variables", filas.filter((f) => f.tabla === "variable"), "Sin variables"));
  seccion.appendChild(await tabla("Color styles", filas.filter((f) => f.tabla === "color"), "Sin color styles"));
  seccion.appendChild(await tabla("Text styles", filas.filter((f) => f.tabla === "text"), "Sin text styles"));

  figma.currentPage.appendChild(specifications);
  return specifications;
}
