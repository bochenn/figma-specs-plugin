export const BADGE_SIZE = 24; // marker circle diameter, in px
export const BADGE_OFFSET = 16; // separation between the marker and the artwork border

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Computes where to place an element's marker: projected to the border
// left side of the artwork, vertically centered with the element.
export function badgePosition(box: Box): { x: number; y: number } {
  const centroY = box.y + box.height / 2;
  return {
    x: -(BADGE_OFFSET + BADGE_SIZE),
    y: centroY - BADGE_SIZE / 2,
  };
}
