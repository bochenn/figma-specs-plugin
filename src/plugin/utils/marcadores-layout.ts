import type { Rect } from "./overlays.ts";
import type { Unidad, Atributo } from "../modelo/tipos.ts";
import { unidadActual, etiquetaSpacing, formatearEspaciado } from "./espaciado.ts";

// "<resizing> <dim>" con la dimensión formateada (variable + valor si la hay):
// "Fixed sizing/card-width (240)", "Hug 88", "Fixed 1rem".
export function textoDimension(resizing: string, px: number, unidad: Unidad, nombreVar?: string): string {
  return `${resizing} ${etiquetaSpacing(px, unidad, nombreVar)}`;
}

// Una parte del valor de una propiedad en el panel: texto plano o chip de variable.
export type ParteValor = { texto: string } | { chip: string };

// Width/Height: con variable → modo + chip(nombre); sin variable → "modo valor".
export function valorDim(resizing: string, px: number, unidad: Unidad, nombreVar?: string): ParteValor[] {
  if (nombreVar) return [{ texto: resizing }, { chip: nombreVar }];
  return [{ texto: `${resizing} ${formatearEspaciado(px, unidad)}` }];
}

// Fill/Stroke: variable/style → chip(nombre) + (rawValue); hardcoded → texto(valor).
export function valorColor(attr: Atributo): ParteValor[] {
  if (attr.formato !== "HARDCODED") {
    const partes: ParteValor[] = [{ chip: attr.valor }];
    if (attr.rawValue) partes.push({ texto: `(${attr.rawValue})` });
    return partes;
  }
  return [{ texto: attr.valor }];
}

// Padding/Gap: con variable → chip(nombre) + (valor); sin variable → texto(valor).
export function valorSpacing(px: number, unidad: Unidad, nombreVar?: string): ParteValor[] {
  if (nombreVar) return [{ chip: nombreVar }, { texto: `(${formatearEspaciado(px, unidad)})` }];
  return [{ texto: formatearEspaciado(px, unidad) }];
}

export interface Marca {
  lado: "top" | "bottom" | "left" | "right";
  centro: number;  // posición sobre ese lado (x para top/bottom, y para left/right)
  desde: number;   // rango de la banda (para el dedupe de wrap)
  hasta: number;
  valor: string;
  nombre?: string; // nombreCorto de la variable, si la hay
  tipo: "padding" | "spacing";
}

// Descarta marcas que se pisan con otra anterior de igual valor (típico en
// wrap: el gap de cada fila se proyecta casi en la misma posición).
function sinPisadas<T extends { desde: number; hasta: number; valor: string }>(marcas: T[]): T[] {
  const resultado: T[] = [];
  for (const m of marcas) {
    const pisada = resultado.some((o) => o.valor === m.valor && m.desde < o.hasta && o.desde < m.hasta);
    if (!pisada) resultado.push(m);
  }
  return resultado;
}

// Último segmento de un nombre de variable: "space/padding-1x" → "padding-1x".
export function nombreCorto(nombre: string): string {
  return nombre.split("/").pop() ?? nombre;
}

// Marcas de un contenedor, distribuidas en los 4 lados del clon: cada padding
// va a su lado (left/right/top/bottom); los gaps a top (HORIZONTAL) o left
// (VERTICAL). Bandas de grosor 0 no generan marca. Con spacingAuto, los gaps
// dicen "Auto". `valor` = "nombreCorto número" si hay variable, o el número.
export function marcasLayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string } = {},
): Marca[] {
  const u = unidadActual();
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const valorDe = (px: number) => formatearEspaciado(px, u);
  const nombreDe = (nombreVar?: string) => (nombreVar ? { nombre: nombreCorto(nombreVar) } : {});
  const out: Marca[] = [];
  if (padding.left > 0) out.push({ lado: "left", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: valorDe(padding.left), ...nombreDe(spacingVars.paddingLeft), tipo: "padding" });
  if (padding.right > 0) out.push({ lado: "right", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: valorDe(padding.right), ...nombreDe(spacingVars.paddingRight), tipo: "padding" });
  if (padding.top > 0) out.push({ lado: "top", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: valorDe(padding.top), ...nombreDe(spacingVars.paddingTop), tipo: "padding" });
  if (padding.bottom > 0) out.push({ lado: "bottom", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: valorDe(padding.bottom), ...nombreDe(spacingVars.paddingBottom), tipo: "padding" });
  const spacing: Marca[] = [];
  for (const g of gaps) {
    const auto = spacingAuto;
    if (direccion === "HORIZONTAL") spacing.push({ lado: "top", centro: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: auto ? "Auto" : valorDe(g.width), ...(auto ? {} : nombreDe(spacingVars.itemSpacing)), tipo: "spacing" });
    else spacing.push({ lado: "left", centro: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: auto ? "Auto" : valorDe(g.height), ...(auto ? {} : nombreDe(spacingVars.itemSpacing)), tipo: "spacing" });
  }
  return [...out, ...sinPisadas(spacing)];
}

// Estilo de puntas de la cota azul según el resizing del eje:
// Fixed = topes, Fill = flechas hacia afuera, Hug = flechas hacia adentro.
export function estiloCota(resizing: string): "fixed" | "fill" | "hug" {
  if (resizing === "Fill") return "fill";
  if (resizing === "Hug") return "hug";
  return "fixed";
}

// Ícono de dirección del artwork (variante grilla cuando hay wrap).
export function iconoDireccion(
  direccion: "HORIZONTAL" | "VERTICAL",
  wrap: boolean,
): "flecha-h" | "flecha-v" | "grilla-h" | "grilla-v" {
  if (wrap) return direccion === "HORIZONTAL" ? "grilla-h" : "grilla-v";
  return direccion === "HORIZONTAL" ? "flecha-h" : "flecha-v";
}

// Dado centros y tamaños a lo largo de un eje, devuelve nuevos centros que no se
// solapan, manteniendo el orden y dejando una separación mínima `sep`. Recorre de
// menor a mayor y empuja hacia el lado positivo el que se solape con el anterior.
export function separarColisiones(centros: number[], tamanos: number[], sep: number): number[] {
  const orden = centros.map((_, i) => i).sort((a, b) => centros[a] - centros[b]);
  const out = centros.slice();
  let limite = -Infinity;
  for (const i of orden) {
    let inicio = centros[i] - tamanos[i] / 2;
    if (inicio < limite + sep) inicio = limite + sep;
    out[i] = inicio + tamanos[i] / 2;
    limite = inicio + tamanos[i];
  }
  return out;
}

// Carril externo donde va el badge de una marca: padding-top y gaps horizontales
// arriba; gaps verticales a la izquierda; el resto de paddings (bottom/left/right)
// en la fila de abajo.
export function carrilDeMarca(lado: "top" | "bottom" | "left" | "right", tipo: "padding" | "spacing"): "top" | "bottom" | "left" {
  if (tipo === "spacing") return lado === "top" ? "top" : "left";
  if (lado === "top") return "top";
  return "bottom";
}
