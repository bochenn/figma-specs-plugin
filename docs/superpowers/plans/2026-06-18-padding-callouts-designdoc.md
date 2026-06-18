# Cotas de padding como callouts (DesignDoc) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Padding (y gap) como callouts afuera con línea guía, eje vertical a la derecha y horizontal abajo, etiquetas agrupadas + nota al pie, según `docs/superpowers/specs/2026-06-18-padding-callouts-designdoc-design.md`.

**Architecture:** `agruparPadding` (pura) decide las etiquetas. En `layout.ts`, `dibujarSpacingCallouts` ubica padding+gap como callouts con líneas guía (`lineaGuiaH/V`); `artworkModo` (no-GRID) deja de pasar padding/gap a `dibujarMarcas` (que queda para medidas de hijos). Nota al pie en `seccionDeLayout`.

**Tech Stack:** TypeScript, `node --test`, esbuild.

---

### Task 1: `agruparPadding` (puro)

**Files:** `src/plugin/utils/marcadores-layout.ts`, `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Test que falla** — agregar `agruparPadding` al import (línea 3) y al final:

```typescript
test("agruparPadding: uniforme → una etiqueta", () => {
  assert.deepEqual(agruparPadding({ left: 16, top: 16, right: 16, bottom: 16 }), [{ clave: "padding", eje: "v", valor: 16 }]);
});
test("agruparPadding: por eje → padding-y y padding-x", () => {
  assert.deepEqual(agruparPadding({ left: 32, top: 24, right: 32, bottom: 24 }), [
    { clave: "padding-y", eje: "v", valor: 24 },
    { clave: "padding-x", eje: "h", valor: 32 },
  ]);
});
test("agruparPadding: por lado, omite 0", () => {
  assert.deepEqual(agruparPadding({ left: 5, top: 10, right: 20, bottom: 0 }), [
    { clave: "top", eje: "v", valor: 10 },
    { clave: "left", eje: "h", valor: 5 },
    { clave: "right", eje: "h", valor: 20 },
  ]);
});
test("agruparPadding: uniforme con variable lleva nombreCorto", () => {
  assert.deepEqual(agruparPadding({ left: 16, top: 16, right: 16, bottom: 16 }, { paddingLeft: "space/padding-1x", paddingTop: "space/padding-1x", paddingRight: "space/padding-1x", paddingBottom: "space/padding-1x" }), [{ clave: "padding", eje: "v", valor: 16, nombre: "padding-1x" }]);
});
```

- [ ] **Step 2: Correr y ver fallar** — `node --test tests/marcadores-layout.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — agregar al final de `marcadores-layout.ts`:

```typescript
export interface CotaPadding {
  clave: "padding" | "padding-x" | "padding-y" | "top" | "right" | "bottom" | "left";
  eje: "h" | "v";
  valor: number;
  nombre?: string;
}

// Agrupa el padding en las etiquetas a mostrar: uniforme → una; por eje → x/y;
// por lado → los lados con valor > 0. `nombre` = variable corta si la hay.
export function agruparPadding(
  padding: { left: number; top: number; right: number; bottom: number },
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string } = {},
): CotaPadding[] {
  const { left, top, right, bottom } = padding;
  const vL = spacingVars.paddingLeft, vT = spacingVars.paddingTop, vR = spacingVars.paddingRight, vB = spacingVars.paddingBottom;
  const con = (n?: string) => (n ? { nombre: nombreCorto(n) } : {});
  if (left === top && top === right && right === bottom && vL === vT && vT === vR && vR === vB) {
    return left === 0 ? [] : [{ clave: "padding", eje: "v", valor: left, ...con(vL) }];
  }
  if (top === bottom && vT === vB && left === right && vL === vR) {
    const out: CotaPadding[] = [];
    if (top > 0) out.push({ clave: "padding-y", eje: "v", valor: top, ...con(vT) });
    if (left > 0) out.push({ clave: "padding-x", eje: "h", valor: left, ...con(vL) });
    return out;
  }
  const out: CotaPadding[] = [];
  if (top > 0) out.push({ clave: "top", eje: "v", valor: top, ...con(vT) });
  if (bottom > 0) out.push({ clave: "bottom", eje: "v", valor: bottom, ...con(vB) });
  if (left > 0) out.push({ clave: "left", eje: "h", valor: left, ...con(vL) });
  if (right > 0) out.push({ clave: "right", eje: "h", valor: right, ...con(vR) });
  return out;
}
```

- [ ] **Step 4: Correr y ver pasar** — `node --test tests/marcadores-layout.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: agruparPadding (uniforme/por-eje/por-lado) para las cotas de padding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Callouts con línea guía en layout.ts

**Files:** `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Importar** — agregar `agruparPadding, type CotaPadding` (y, si falta, `nombreCorto`) al import de `../utils/marcadores-layout.ts`.

- [ ] **Step 2: Helpers** — agregar (junto a las otras helpers, p. ej. antes de `dibujarMarcas`):

```typescript
const CALLOUT_SEP = 40;          // distancia del chip al borde (deja lugar a la línea guía)
const GRIS_LEADER: RGB = { r: 0.6, g: 0.6, b: 0.6 };

function lineaGuiaH(artwork: FrameNode, x: number, y: number, largo: number): void {
  const r = figma.createRectangle();
  r.x = x; r.y = y; r.resize(Math.max(largo, 0.5), 1);
  r.fills = [{ type: "SOLID", color: GRIS_LEADER }];
  artwork.appendChild(r);
}
function lineaGuiaV(artwork: FrameNode, x: number, y: number, largo: number): void {
  const r = figma.createRectangle();
  r.x = x; r.y = y; r.resize(1, Math.max(largo, 0.5));
  r.fills = [{ type: "SOLID", color: GRIS_LEADER }];
  artwork.appendChild(r);
}

// Chip de una cota de padding: con variable → cotaConNombre; agrupada sin variable
// → "clave valor"; por lado sin variable → solo el valor.
async function chipPadding(c: CotaPadding, artwork: FrameNode): Promise<FrameNode> {
  const val = etiquetaSpacing(c.valor, unidadActual());
  if (c.nombre) return await cotaConNombre(c.nombre, val, CHIP_PADDING, artwork);
  const agrupado = c.clave === "padding" || c.clave === "padding-x" || c.clave === "padding-y";
  return await cota(agrupado ? `${c.clave} ${val}` : val, CHIP_PADDING, artwork);
}

// Ubica padding (agrupado) + gaps como callouts afuera, estilo DesignDoc: eje
// vertical en columna a la derecha, eje horizontal en fila abajo, con línea guía.
async function dibujarSpacingCallouts(artwork: FrameNode, clon: FrameNode, cotas: CotaPadding[], gaps: Rect[], spec: LayoutSpec): Promise<void> {
  const u = unidadActual();
  const derecha: FrameNode[] = [];
  const abajo: FrameNode[] = [];
  for (const c of cotas) (c.eje === "v" ? derecha : abajo).push(await chipPadding(c, artwork));
  for (const g of gaps) {
    const val = etiquetaSpacing(spec.direccion === "VERTICAL" ? g.height : g.width, u);
    const chip = spec.spacingAuto ? await cota("Auto", CHIP_GAP, artwork)
      : spec.spacingVars.itemSpacing ? await cotaConNombre(nombreCorto(spec.spacingVars.itemSpacing), val, CHIP_GAP, artwork)
      : await cota(val, CHIP_GAP, artwork);
    (spec.direccion === "VERTICAL" ? derecha : abajo).push(chip);
  }
  const xCol = clon.x + clon.width + CALLOUT_SEP;
  if (derecha.length > 0) {
    const centros = derecha.map((_, i) => clon.y + (clon.height * (i + 1)) / (derecha.length + 1));
    const aj = separarColisiones(centros, derecha.map((c) => c.height), SEP_CHIP);
    for (let i = 0; i < derecha.length; i++) {
      const c = derecha[i];
      c.x = xCol; c.y = aj[i] - c.height / 2;
      lineaGuiaH(artwork, clon.x + clon.width, c.y + c.height / 2, xCol - (clon.x + clon.width));
    }
  }
  const yRow = clon.y + clon.height + CALLOUT_SEP;
  if (abajo.length > 0) {
    const centros = abajo.map((_, i) => clon.x + (clon.width * (i + 1)) / (abajo.length + 1));
    const aj = separarColisiones(centros, abajo.map((c) => c.width), SEP_CHIP);
    for (let i = 0; i < abajo.length; i++) {
      const c = abajo[i];
      c.x = aj[i] - c.width / 2; c.y = yRow;
      lineaGuiaV(artwork, c.x + c.width / 2, clon.y + clon.height, yRow - (clon.y + clon.height));
    }
  }
}
```

- [ ] **Step 3: Rewire `artworkModo` (rama no-GRID)** — reemplazar el bloque desde `const gaps = rectsSpacing(...)` hasta `if (modo !== "spacing") await dibujarCotas(...)` por:

```typescript
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  if (modo !== "dimensiones") {
    for (const r of gaps) bandaPunteada(r, GAP_BANDA, CHIP_GAP, artwork);
    for (const g of spec.grids) {
      for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, ROJO, artwork);
    }
    dibujarLineasMedida(artwork, clon, spec, gaps);
    await dibujarSpacingCallouts(artwork, clon, agruparPadding(spec.padding, spec.spacingVars), gaps, spec);
  }

  const minLeftX = await dibujarMarcas(artwork, [], clon, modo === "spacing" ? [] : hijosMedidos);
  if (modo !== "spacing") await dibujarCotas(artwork, clon, spec, minLeftX);
```

(Ahora `dibujarMarcas` recibe `[]` como marcas: solo dibuja las medidas de hijos en sus carriles; el padding/gap lo hace `dibujarSpacingCallouts`. La rama GRID queda igual.)

- [ ] **Step 4: Build y suite** — `npm run build && node --test` → build OK; todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: padding/gap como callouts con línea guía (estilo DesignDoc)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Nota al pie en la sección de Layout

**Files:** `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Agregar la nota** — en `seccionDeLayout`, antes de `return seccion;`, agregar una nota gris:

```typescript
  const nota = await texto("* padding: N = mismo padding en los 4 lados; padding-x / padding-y = por eje.", 12);
  nota.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
  seccion.appendChild(nota);
```

- [ ] **Step 2: Build** — `npm run build` → OK.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: nota al pie aclarando las etiquetas de padding agrupadas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Padding como callouts afuera con línea guía: eje vertical (top/gap/bottom) a la derecha, horizontal (left/right) abajo.
  - Padding uniforme → una etiqueta `padding N`; por eje → `padding-x`/`padding-y`; nota al pie presente.
  - W/H y medidas de hijos sin cambios.
- [ ] **Step 3: Ajustes** — `CALLOUT_SEP`, orden de los callouts, o el ancla por lado si hace falta acercarlos a su banda.
