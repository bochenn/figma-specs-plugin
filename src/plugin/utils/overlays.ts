export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Bandas de padding (top, bottom, left, right), omitiendo las de padding 0.
export function rectsPadding(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
): Rect[] {
  const rects: Rect[] = [];
  const interiorH = frame.height - padding.top - padding.bottom;
  if (padding.top > 0) rects.push({ x: frame.x, y: frame.y, width: frame.width, height: padding.top });
  if (padding.bottom > 0) rects.push({ x: frame.x, y: frame.y + frame.height - padding.bottom, width: frame.width, height: padding.bottom });
  if (padding.left > 0) rects.push({ x: frame.x, y: frame.y + padding.top, width: padding.left, height: interiorH });
  if (padding.right > 0) rects.push({ x: frame.x + frame.width - padding.right, y: frame.y + padding.top, width: padding.right, height: interiorH });
  return rects;
}
