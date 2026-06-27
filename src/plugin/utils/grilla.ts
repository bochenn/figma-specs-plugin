import type { Rect } from "./overlays.ts";
import type { GridSpec } from "../modelo/tipos.ts";

export interface GridStripes { columns: Rect[]; rows: Rect[]; }

// Stripes of an auto-layout Grid within the content area (frame − padding).
// Distributes the width/height among the counts, subtracting the gaps.
export function autolayoutGridStripes(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  columns: number, rows: number, columnGap: number, rowGap: number,
): GridStripes {
  const cx = frame.x + padding.left;
  const cy = frame.y + padding.top;
  const cw = frame.width - padding.left - padding.right;
  const ch = frame.height - padding.top - padding.bottom;
  const cols: Rect[] = [];
  const rowRects: Rect[] = [];
  if (columns > 1 && cw > 0) {
    const w = (cw - (columns - 1) * columnGap) / columns;
    if (w > 0) for (let i = 0; i < columns; i++) cols.push({ x: cx + i * (w + columnGap), y: cy, width: w, height: ch });
  }
  if (rows > 1 && ch > 0) {
    const h = (ch - (rows - 1) * rowGap) / rows;
    if (h > 0) for (let i = 0; i < rows; i++) rowRects.push({ x: cx, y: cy + i * (h + rowGap), width: cw, height: h });
  }
  return { columns: cols, rows: rowRects };
}

// Maps a raw Figma LayoutGrid to GridSpec.
export function gridSpecOf(g: { pattern: string; alignment?: string; gutterSize?: number; count?: number; sectionSize?: number; offset?: number }): GridSpec {
  if (g.pattern === "GRID") return { pattern: "GRID", sectionSize: g.sectionSize };
  return {
    pattern: g.pattern === "COLUMNS" ? "COLUMNS" : "ROWS",
    alignment: (g.alignment as GridSpec["alignment"]) ?? "STRETCH",
    count: g.count,
    gutter: g.gutterSize ?? 0,
    sectionSize: g.sectionSize,
    offset: g.offset ?? 0,
  };
}

// Stripes along an axis: [start, size] pairs relative to the frame.
function stripes(largo: number, grid: GridSpec): Array<[number, number]> {
  const gutter = grid.gutter ?? 0;
  const offset = grid.offset ?? 0;
  if (grid.alignment === "STRETCH") {
    const count = grid.count ?? 0;
    if (!Number.isFinite(count) || count <= 0) return [];
    const w = (largo - 2 * offset - (count - 1) * gutter) / count;
    if (w <= 0) return [];
    return Array.from({ length: count }, (_, i) => [offset + i * (w + gutter), w]);
  }
  const section = grid.sectionSize ?? 0;
  if (section <= 0) return [];
  const paso = section + gutter;
  let count = grid.count ?? 0;
  if (!Number.isFinite(count)) count = Math.max(0, Math.floor((largo - offset + gutter) / paso));
  if (count <= 0) return [];
  if (grid.alignment === "CENTER") {
    const total = count * section + (count - 1) * gutter;
    const inicio = (largo - total) / 2;
    return Array.from({ length: count }, (_, i) => [inicio + i * paso, section]);
  }
  if (grid.alignment === "MAX") {
    return Array.from({ length: count }, (_, i) => [largo - offset - section - i * paso, section]).reverse();
  }
  return Array.from({ length: count }, (_, i) => [offset + i * paso, section]); // MIN
}

// Rects of a layout grid: vertical stripes (COLUMNS), horizontal (ROWS)
// or 1px lines on both axes (GRID).
export function gridRects(frame: Rect, grid: GridSpec): Rect[] {
  if (grid.pattern === "GRID") {
    const s = grid.sectionSize ?? 0;
    if (s <= 0) return [];
    const rects: Rect[] = [];
    for (let x = s; x < frame.width; x += s) rects.push({ x: frame.x + x, y: frame.y, width: 1, height: frame.height });
    for (let y = s; y < frame.height; y += s) rects.push({ x: frame.x, y: frame.y + y, width: frame.width, height: 1 });
    return rects;
  }
  if (grid.pattern === "COLUMNS") {
    return stripes(frame.width, grid).map(([x, w]) => ({ x: frame.x + x, y: frame.y, width: w, height: frame.height }));
  }
  return stripes(frame.height, grid).map(([y, h]) => ({ x: frame.x, y: frame.y + y, width: frame.width, height: h }));
}

const ALIGNMENT_NAME: Record<string, string> = { MIN: "Min", MAX: "Max", CENTER: "Center", STRETCH: "Stretch" };

// Descriptive grid line for the exhibit.
export function gridText(grid: GridSpec): string {
  if (grid.pattern === "GRID") return `Grid ${grid.sectionSize ?? 0}px`;
  const name = grid.pattern === "COLUMNS" ? "Columns" : "Rows";
  const count = Number.isFinite(grid.count ?? 0) ? `×${grid.count}` : "×Auto";
  const parts = [`${name} ${count}`];
  if (grid.sectionSize) parts.push(`${grid.pattern === "COLUMNS" ? "width" : "height"} ${grid.sectionSize}`);
  if (grid.gutter) parts.push(`gutter ${grid.gutter}`);
  if (grid.offset) parts.push(`offset ${grid.offset}`);
  parts.push(ALIGNMENT_NAME[grid.alignment ?? "STRETCH"]);
  return parts.join(" · ");
}
