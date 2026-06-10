import type { FilaInventario } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const COL_NAME = 280;
const COL_AS = 160;
const COL_TO = 280;

// Crea una celda de texto con ancho fijo y wrap.
async function celda(contenido: string, ancho: number): Promise<TextNode> {
  const t = await texto(contenido, 12);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Crea una fila de 3 celdas.
async function fila(a: string, b: string, c: string): Promise<FrameNode> {
  const f = frameHorizontal("Fila", 16);
  f.appendChild(await celda(a, COL_NAME));
  f.appendChild(await celda(b, COL_AS));
  f.appendChild(await celda(c, COL_TO));
  return f;
}

// Construye una subsección con su tabla (o una nota si no hay filas).
async function tabla(titulo: string, filas: FilaInventario[], vacio: string): Promise<FrameNode> {
  const sub = frameVertical(titulo, 16);
  sub.appendChild(await texto(titulo, 36));
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  const cuerpo = frameVertical("Tabla", 8);
  cuerpo.appendChild(await fila("Name", "Applied as", "Applied to"));
  for (const f of filas) {
    cuerpo.appendChild(await fila(f.nombre, f.appliedAs, f.appliedTo));
  }
  sub.appendChild(cuerpo);
  return sub;
}

// Genera el output de Styling Inventory con las tablas Color styles y Text styles.
export async function generarStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Styling Inventory", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Styling Inventory", 48));

  seccion.appendChild(await tabla("Color styles", filas.filter((f) => f.tabla === "color"), "Sin color styles"));
  seccion.appendChild(await tabla("Text styles", filas.filter((f) => f.tabla === "text"), "Sin text styles"));

  figma.currentPage.appendChild(specifications);
  return specifications;
}
