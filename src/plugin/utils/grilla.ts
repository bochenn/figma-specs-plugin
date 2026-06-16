import type { Rect } from "./overlays.ts";
import type { GridSpec } from "../modelo/tipos.ts";

export interface FranjasGrid { columnas: Rect[]; filas: Rect[]; }

// Franjas de un Grid auto-layout dentro del área de contenido (frame − padding).
// Reparte el ancho/alto entre los counts, restando los gaps.
export function franjasGridAutolayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  columnas: number, filas: number, columnGap: number, rowGap: number,
): FranjasGrid {
  const cx = frame.x + padding.left;
  const cy = frame.y + padding.top;
  const cw = frame.width - padding.left - padding.right;
  const ch = frame.height - padding.top - padding.bottom;
  const cols: Rect[] = [];
  const rows: Rect[] = [];
  if (columnas > 1 && cw > 0) {
    const w = (cw - (columnas - 1) * columnGap) / columnas;
    if (w > 0) for (let i = 0; i < columnas; i++) cols.push({ x: cx + i * (w + columnGap), y: cy, width: w, height: ch });
  }
  if (filas > 1 && ch > 0) {
    const h = (ch - (filas - 1) * rowGap) / filas;
    if (h > 0) for (let i = 0; i < filas; i++) rows.push({ x: cx, y: cy + i * (h + rowGap), width: cw, height: h });
  }
  return { columnas: cols, filas: rows };
}

// Mapea un LayoutGrid crudo de Figma a GridSpec.
export function gridSpecDe(g: { pattern: string; alignment?: string; gutterSize?: number; count?: number; sectionSize?: number; offset?: number }): GridSpec {
  if (g.pattern === "GRID") return { patron: "GRID", sectionSize: g.sectionSize };
  return {
    patron: g.pattern === "COLUMNS" ? "COLUMNS" : "ROWS",
    alineacion: (g.alignment as GridSpec["alineacion"]) ?? "STRETCH",
    count: g.count,
    gutter: g.gutterSize ?? 0,
    sectionSize: g.sectionSize,
    offset: g.offset ?? 0,
  };
}

// Franjas sobre un eje: pares [inicio, tamaño] relativos al frame.
function franjas(largo: number, grid: GridSpec): Array<[number, number]> {
  const gutter = grid.gutter ?? 0;
  const offset = grid.offset ?? 0;
  if (grid.alineacion === "STRETCH") {
    const count = grid.count ?? 0;
    if (!Number.isFinite(count) || count <= 0) return [];
    const w = (largo - 2 * offset - (count - 1) * gutter) / count;
    if (w <= 0) return [];
    return Array.from({ length: count }, (_, i) => [offset + i * (w + gutter), w]);
  }
  const seccion = grid.sectionSize ?? 0;
  if (seccion <= 0) return [];
  const paso = seccion + gutter;
  let count = grid.count ?? 0;
  if (!Number.isFinite(count)) count = Math.max(0, Math.floor((largo - offset + gutter) / paso));
  if (count <= 0) return [];
  if (grid.alineacion === "CENTER") {
    const total = count * seccion + (count - 1) * gutter;
    const inicio = (largo - total) / 2;
    return Array.from({ length: count }, (_, i) => [inicio + i * paso, seccion]);
  }
  if (grid.alineacion === "MAX") {
    return Array.from({ length: count }, (_, i) => [largo - offset - seccion - i * paso, seccion]).reverse();
  }
  return Array.from({ length: count }, (_, i) => [offset + i * paso, seccion]); // MIN
}

// Rects de un layout grid: franjas verticales (COLUMNS), horizontales (ROWS)
// o líneas de 1px en ambos ejes (GRID).
export function rectsGrid(frame: Rect, grid: GridSpec): Rect[] {
  if (grid.patron === "GRID") {
    const s = grid.sectionSize ?? 0;
    if (s <= 0) return [];
    const rects: Rect[] = [];
    for (let x = s; x < frame.width; x += s) rects.push({ x: frame.x + x, y: frame.y, width: 1, height: frame.height });
    for (let y = s; y < frame.height; y += s) rects.push({ x: frame.x, y: frame.y + y, width: frame.width, height: 1 });
    return rects;
  }
  if (grid.patron === "COLUMNS") {
    return franjas(frame.width, grid).map(([x, w]) => ({ x: frame.x + x, y: frame.y, width: w, height: frame.height }));
  }
  return franjas(frame.height, grid).map(([y, h]) => ({ x: frame.x, y: frame.y + y, width: frame.width, height: h }));
}

const NOMBRE_ALINEACION: Record<string, string> = { MIN: "Min", MAX: "Max", CENTER: "Center", STRETCH: "Stretch" };

// Línea descriptiva del grid para el exhibit.
export function textoGrid(grid: GridSpec): string {
  if (grid.patron === "GRID") return `Grid ${grid.sectionSize ?? 0}px`;
  const nombre = grid.patron === "COLUMNS" ? "Columns" : "Rows";
  const count = Number.isFinite(grid.count ?? 0) ? `×${grid.count}` : "×Auto";
  const partes = [`${nombre} ${count}`];
  if (grid.sectionSize) partes.push(`${grid.patron === "COLUMNS" ? "ancho" : "alto"} ${grid.sectionSize}`);
  if (grid.gutter) partes.push(`gutter ${grid.gutter}`);
  if (grid.offset) partes.push(`offset ${grid.offset}`);
  partes.push(NOMBRE_ALINEACION[grid.alineacion ?? "STRETCH"]);
  return partes.join(" · ");
}
