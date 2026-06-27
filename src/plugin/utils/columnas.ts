// Fixed width of the wrap container so exactly `columns` items fit per row.
export function containerWidth(columns: number, itemWidth: number, gap: number): number {
  return columns * itemWidth + (columns - 1) * gap;
}

// Normalizes the selector's column count to the 1–4 range (1 if undefined).
export function clampColumns(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 4);
}
