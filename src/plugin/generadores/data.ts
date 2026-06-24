import type { AnatomyJson } from "../modelo/tipos.ts";
import { frameVertical, texto, FONT_MONO } from "./frames.ts";
import { hexARgb } from "../utils/color.ts";

const ANCHO_JSON = 720;

// Paleta de sintaxis (colores ya usados en el plugin) y fondo del bloque de código.
const COL_PUNTUACION = hexARgb("#6B7280"); // base: llaves, comas, dos puntos
const COL_KEY = hexARgb("#EA10AC");        // nombres de propiedad (rosa del ChipVar)
const COL_STRING = hexARgb("#1FA855");     // valores string (verde)
const COL_NUM = hexARgb("#0D80FF");        // números, true/false/null (azul)
const FONDO_CODIGO = hexARgb("#F3F4F6");   // gris claro: legible con los colores

// Tokeniza un JSON ya formateado en rangos de color (key, string, número/literal).
// Lo demás (llaves, comas, ":") queda con el color base de puntuación.
function tokensJson(s: string): { desde: number; hasta: number; color: RGB }[] {
  const out: { desde: number; hasta: number; color: RGB }[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') { if (s[j] === "\\") j++; j++; }
      j = Math.min(j + 1, s.length);
      let k = j;
      while (k < s.length && (s[k] === " " || s[k] === "\n")) k++;
      out.push({ desde: i, hasta: j, color: s[k] === ":" ? COL_KEY : COL_STRING });
      i = j;
    } else if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let j = i + 1;
      while (j < s.length && "0123456789.eE+-".includes(s[j])) j++;
      out.push({ desde: i, hasta: j, color: COL_NUM });
      i = j;
    } else if (s.startsWith("true", i) || s.startsWith("false", i) || s.startsWith("null", i)) {
      const lit = s.startsWith("true", i) ? "true" : s.startsWith("false", i) ? "false" : "null";
      out.push({ desde: i, hasta: i + lit.length, color: COL_NUM });
      i += lit.length;
    } else {
      i++;
    }
  }
  return out;
}

// Genera el output de Data: el JSON de Anatomy en un text node.
// Devuelve el frame Specifications creado.
export async function generarData(nombre: string, json: AnatomyJson): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(await seccionDeData(nombre, json));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye solo la sección Data (JSON) (sin Specifications ni título de nodo).
export async function seccionDeData(nombre: string, json: AnatomyJson): Promise<FrameNode> {
  const seccion = frameVertical("Data (JSON)", 64);
  seccion.appendChild(await texto("Data (JSON)", 48));

  const codigo = JSON.stringify(json, null, 2);
  const jsonNode = await texto(codigo, 14, FONT_MONO);
  jsonNode.fills = [{ type: "SOLID", color: COL_PUNTUACION }]; // base
  for (const t of tokensJson(codigo)) {
    jsonNode.setRangeFills(t.desde, t.hasta, [{ type: "SOLID", color: t.color }]);
  }
  // Ancho fijo con wrap: primero HEIGHT, después fijar el ancho.
  jsonNode.textAutoResize = "HEIGHT";
  jsonNode.resize(ANCHO_JSON, jsonNode.height);

  // Bloque con fondo para que el código coloreado sea legible.
  const bloque = frameVertical("codeBlock", 0);
  bloque.paddingTop = bloque.paddingBottom = bloque.paddingLeft = bloque.paddingRight = 24;
  bloque.cornerRadius = 8;
  bloque.fills = [{ type: "SOLID", color: FONDO_CODIGO }];
  bloque.appendChild(jsonNode);
  seccion.appendChild(bloque);

  return seccion;
}
