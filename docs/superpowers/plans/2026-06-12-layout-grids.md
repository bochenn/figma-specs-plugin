# Overlays de layout grids — Plan de Implementación (Rebanada 34)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anotar layout grids (COLUMNS/ROWS/GRID) en Layout and Spacing: franjas rojas sobre el artwork, línea `Grid:` en el exhibit y fila propia para la raíz con grids sin Auto Layout, según `docs/superpowers/specs/2026-06-12-layout-grids-design.md`.

**Architecture:** Geometría y mapeo puros en `utils/grilla.ts` (`gridSpecDe`, `rectsGrid`, `textoGrid`), testeados. `GridSpec` viaja por `NodoLike`/`LayoutSpec`; el adaptador copia los grids de cualquier frame. El generador pinta las franjas con el `rectOverlay` existente y agrega la fila raíz-solo-grids (respetando `hideOuter`).

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: Geometría pura (`utils/grilla.ts`) — TDD

**Files:** Create `src/plugin/utils/grilla.ts`; Modify `src/plugin/modelo/tipos.ts` (`GridSpec`); Test `tests/grilla.test.ts`.

- [ ] Test que falla → implementar → suite verde → commit `feat: geometría de layout grids (grilla.ts)`.

`GridSpec` en `modelo/tipos.ts` (junto a los tipos de Layout):

```typescript
export interface GridSpec {
  patron: "GRID" | "COLUMNS" | "ROWS";
  alineacion?: "MIN" | "MAX" | "CENTER" | "STRETCH";
  count?: number;        // puede venir Infinity ("Auto")
  gutter?: number;
  sectionSize?: number;
  offset?: number;
}
```

`utils/grilla.ts` completo:

```typescript
import type { Rect } from "./overlays.ts";
import type { GridSpec } from "../modelo/tipos.ts";

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
```

Tests (`tests/grilla.test.ts`): COLUMNS Stretch (188w, offset 10, gutter 4, count 4 → franjas de 39
en x=10/53/96/139); Min (offset 6, sección 40, gutter 8 → x=6/54); Center (200w, 2×40+8 → x=56/104);
ROWS Min sobre Y; GRID 10px en frame 30×20 (x=10/20, y=10); count Infinity llena lo que entra
(200w, sección 40, gutter 8 → 4 franjas); inválidos → `[]`; `gridSpecDe` (GRID y COLUMNS);
`textoGrid` (Stretch completo, Grid 8px, Rows ×Auto).

### Task 2: Modelo, adaptador y extracción — TDD

**Files:** Modify `modelo/tipos.ts` (`NodoLike`, `LayoutSpec`), `extraccion/adaptador.ts`,
`extraccion/layout.ts`; Test `tests/layout-extraccion.test.ts`.

- `NodoLike` += `layoutGrids?: GridSpec[];` · `LayoutSpec` += `grids: GridSpec[];`
- `layoutSpecDe` += `grids: nodo.layoutGrids ?? [],`
- Adaptador (fuera del bloque de Auto Layout):

```typescript
  if ("layoutGrids" in nodo && Array.isArray(nodo.layoutGrids)) {
    base.layoutGrids = nodo.layoutGrids.map((g) => gridSpecDe(g));
  }
```

- Tests: actualizar el `deepEqual` (+ `grids: []`) y agregar passthrough de `layoutGrids`.
- Commit `feat: GridSpec en el modelo y la extracción de Layout`.

### Task 3: Generador — franjas, exhibit y fila raíz-solo-grids

**Files:** Modify `src/plugin/generadores/layout.ts`.

- `const ROJO: RGB = { r: 1, g: 0.1, b: 0.3 };` y franjas en `artworkDe` (tras los gaps):

```typescript
  for (const g of spec.grids) {
    for (const r of rectsGrid(frameRect, g)) rectOverlay(r, ROJO, 0.12, artwork);
  }
```

- `exhibit`: tras Item spacing: `for (const g of spec.grids) fila.appendChild(await texto(`Grid: ${textoGrid(g)}`, 12));`
- Helpers `artworkGrids` (clon + franjas con `RESPIRO` de margen, sin marcadores) y `exhibitGrids`
  (nombre · tipo + líneas Grid); en `generarLayout`, tras el bucle de filas:

```typescript
  // Raíz con layout grids pero sin Auto Layout: fila propia (respeta hideOuter).
  const raizEnFilas = contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado;
  if (!raizEnFilas && !hideOuter && "layoutGrids" in seleccionado) {
    const gridsRaiz = seleccionado.layoutGrids.map(gridSpecDe);
    if (gridsRaiz.length > 0) {
      const fila = frameHorizontal(`Layout ${seleccionado.name}`, 48);
      fila.appendChild(await artworkGrids(seleccionado as FrameNode, gridsRaiz));
      fila.appendChild(await exhibitGrids(seleccionado, gridsRaiz));
      filas.unshift(fila);
    }
  }
```

- Build + suite + commit `feat: overlays de layout grids en Layout and Spacing`.

### Task 4: Verificación

`npm run build && node --test` verdes. Manual (asincrónica): frame con grilla de columnas sin Auto
Layout → fila propia; contenedor Auto Layout + grid → franjas y línea Grid; hideOuter; Dark mode.
