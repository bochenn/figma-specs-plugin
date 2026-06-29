// Anatomy badge placement (pure: no Figma API, so it can be unit-tested).

export interface BBox { x: number; y: number; w: number; h: number; }
export type Side = "top" | "bottom" | "left" | "right";
export interface BadgePlacement { side: Side; x: number; y: number; } // x,y = badge center

// Places each element's badge OUTSIDE the documented object's bounds (`root`),
// on the object side nearest to that element; the connecting line crosses the
// border from the element to the badge. The deepest layers (hardest to point at)
// are resolved first so they take their nearest side; outer layers fall back to a
// free side. Distance ties prefer top → bottom → left → right. If a side's slot
// is taken, the badge moves outward along that side until it's free.
// Returns one placement per element index (null when the element has no box).
export function placeBadges(root: BBox, boxes: (BBox | null)[], badgeSize: number, gap: number): (BadgePlacement | null)[] {
  const R = badgeSize / 2;
  const contains = (a: BBox, b: BBox): boolean =>
    a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
  const placed: { x: number; y: number }[] = [];
  const collides = (x: number, y: number): boolean =>
    placed.some((p) => Math.abs(p.x - x) < badgeSize + 4 && Math.abs(p.y - y) < badgeSize + 4);
  // Nesting depth: how many other boxes contain this one.
  const depthOf = (i: number): number => {
    const bi = boxes[i];
    if (!bi) return -1;
    return boxes.reduce((acc, bj, j) => acc + (bj != null && j !== i && contains(bj, bi) ? 1 : 0), 0);
  };
  const order = boxes.map((_, i) => i).filter((i) => boxes[i] != null).sort((a, b) => depthOf(b) - depthOf(a));

  const out: (BadgePlacement | null)[] = boxes.map(() => null);
  for (const i of order) {
    const bi = boxes[i]!;
    const cx = bi.x + bi.w / 2;
    const cy = bi.y + bi.h / 2;
    // Sides of the OBJECT ordered by how near the element is to each. Stable sort
    // keeps the top→bottom→left→right order on distance ties.
    const sides = [
      { side: "top" as Side,    dist: bi.y - root.y,                     x: cx, y: root.y - gap - R },
      { side: "bottom" as Side, dist: (root.y + root.h) - (bi.y + bi.h), x: cx, y: root.y + root.h + gap + R },
      { side: "left" as Side,   dist: bi.x - root.x,                     x: root.x - gap - R, y: cy },
      { side: "right" as Side,  dist: (root.x + root.w) - (bi.x + bi.w), x: root.x + root.w + gap + R, y: cy },
    ];
    sides.sort((a, b) => a.dist - b.dist);
    const chosen = sides.find((s) => !collides(s.x, s.y)) ?? sides[0];
    let mx = chosen.x;
    let my = chosen.y;
    while (collides(mx, my)) {
      if (chosen.side === "left") mx -= badgeSize + 4;
      else if (chosen.side === "right") mx += badgeSize + 4;
      else if (chosen.side === "top") my -= badgeSize + 4;
      else my += badgeSize + 4;
    }
    placed.push({ x: mx, y: my });
    out[i] = { side: chosen.side, x: mx, y: my };
  }
  return out;
}
