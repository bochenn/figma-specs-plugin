# Marcas en 4 lados, padding en Grid y chips 11px (D4) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Distribuir los chips/cotas en los 4 lados del clon (sin apilarse), mostrar padding en Grid, bordes punteados más oscuros y chips a 11px, según `docs/superpowers/specs/2026-06-17-refinamiento-4lados-design.md`.

**Architecture:** `marcasLayout` se refactoriza a `Marca[]` con `lado` (top/bottom/left/right) + `centro` (testeable). El generador dibuja cada marca en su lado (artwork con margen en los 4 lados), pinta las bandas con stroke saturado, dibuja padding también en GRID y sube el chip a 11px.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: `marcasLayout` por lado — TDD

**Files:** `src/plugin/utils/marcadores-layout.ts`; test `tests/marcadores-layout.test.ts`.

- [ ] **Step 1: Reescribir los tests de `marcasLayout`** — reemplazar TODOS los tests que usan
`{ ejeX, ejeY }` (los ~7 primeros y los de spacingVars) por el nuevo shape `Marca[]`:

```typescript
test("marcasLayout: cada padding va a su lado con su valor", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 8, right: 24, bottom: 0 };
  const marcas = marcasLayout(frame, padding, [], "HORIZONTAL", false);
  const porLado = Object.fromEntries(marcas.map((m) => [m.lado, m.valor]));
  assert.equal(porLado.left, "16");
  assert.equal(porLado.top, "8");
  assert.equal(porLado.right, "24");
  assert.equal(porLado.bottom, undefined); // padding 0 → sin marca
});

test("marcasLayout: padding left centrado vertical, top centrado horizontal", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const marcas = marcasLayout(frame, { left: 16, top: 8, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  const left = marcas.find((m) => m.lado === "left")!;
  const top = marcas.find((m) => m.lado === "top")!;
  assert.equal(left.centro, 50);  // frame.y + height/2
  assert.equal(top.centro, 100);  // frame.x + width/2
});

test("marcasLayout: gap HORIZONTAL → lado top en el centro del hueco", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 12, height: 100 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.deepEqual(marcas, [{ lado: "top", centro: 66, desde: 60, hasta: 72, valor: "12", tipo: "spacing" }]);
});

test("marcasLayout: gap VERTICAL → lado left", () => {
  const frame = { x: 0, y: 0, width: 100, height: 200 };
  const gaps = [{ x: 0, y: 50, width: 100, height: 20 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "VERTICAL", false);
  assert.equal(marcas[0].lado, "left");
  assert.equal(marcas[0].centro, 60);
  assert.equal(marcas[0].valor, "20");
});

test("marcasLayout: spacingAuto → gap dice Auto", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 30, height: 100 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", true);
  assert.equal(marcas[0].valor, "Auto");
});

test("marcasLayout: respeta rem", () => {
  aplicarUnidad("rem");
  const marcas = marcasLayout({ x: 0, y: 0, width: 100, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(marcas.find((m) => m.lado === "left")!.valor, "1rem");
  aplicarUnidad("px");
});

test("marcasLayout: gaps de igual valor superpuestos → uno solo (wrap)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 80, y: 0, width: 12, height: 40 }, { x: 85, y: 60, width: 12, height: 40 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.equal(marcas.filter((m) => m.tipo === "spacing").length, 1);
});

test("marcasLayout con spacingVars → 'nombreCorto valor'", () => {
  const marcas = marcasLayout({ x: 0, y: 0, width: 200, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  assert.equal(marcas.find((m) => m.lado === "left")!.valor, "padding-1x 16");
});
```

(Los tests de `textoDimension`, `valorDim/valorColor/valorSpacing`, `nombreCorto`, `estiloCota`,
`iconoDireccion` se mantienen igual.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL (marcasLayout aún devuelve `{ejeX, ejeY}`).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/marcadores-layout.ts`, reemplazar las
interfaces `MarcaX`/`MarcaY` por `Marca` y reescribir `marcasLayout`:

```typescript
export interface Marca {
  lado: "top" | "bottom" | "left" | "right";
  centro: number;  // posición sobre ese lado (x para top/bottom, y para left/right)
  desde: number;   // rango de la banda (para el dedupe de wrap)
  hasta: number;
  valor: string;
  tipo: "padding" | "spacing";
}

export function marcasLayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string } = {},
): Marca[] {
  const u = unidadActual();
  const marca = (px: number, nombreVar?: string) =>
    nombreVar ? `${nombreCorto(nombreVar)} ${formatearEspaciado(px, u)}` : formatearEspaciado(px, u);
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const out: Marca[] = [];
  if (padding.left > 0) out.push({ lado: "left", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: marca(padding.left, spacingVars.paddingLeft), tipo: "padding" });
  if (padding.right > 0) out.push({ lado: "right", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: marca(padding.right, spacingVars.paddingRight), tipo: "padding" });
  if (padding.top > 0) out.push({ lado: "top", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: marca(padding.top, spacingVars.paddingTop), tipo: "padding" });
  if (padding.bottom > 0) out.push({ lado: "bottom", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: marca(padding.bottom, spacingVars.paddingBottom), tipo: "padding" });
  const spacing: Marca[] = [];
  for (const g of gaps) {
    if (direccion === "HORIZONTAL") spacing.push({ lado: "top", centro: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: spacingAuto ? "Auto" : marca(g.width, spacingVars.itemSpacing), tipo: "spacing" });
    else spacing.push({ lado: "left", centro: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: spacingAuto ? "Auto" : marca(g.height, spacingVars.itemSpacing), tipo: "spacing" });
  }
  return [...out, ...sinPisadas(spacing)];
}
```

(`sinPisadas` se mantiene; ahora solo se aplica a las marcas de spacing. `MarcaX`/`MarcaY` se
eliminan.)

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "refactor: marcasLayout devuelve Marca[] con lado (D4)"
```

---

### Task 2: Dibujo en 4 lados, padding en Grid, punteado oscuro, 11px

**Files:** `src/plugin/generadores/layout.ts`.

- [ ] **Step 1: Chip a 11px** — en el helper `chip`, cambiar `await texto(valor, 9)` por
`await texto(valor, 11)`.

- [ ] **Step 2: `bandaPunteada` con stroke saturado** — cambiar la firma a
`bandaPunteada(r: Rect, colorFill: RGB, colorStroke: RGB, artwork: FrameNode)`: `fills` con
`colorFill` opacity 0.12, `strokes` con `colorStroke`, `strokeWeight 1`, `dashPattern [3,3]`. Y en
los llamados: padding → `bandaPunteada(r, PADDING_BANDA, CHIP_PADDING, artwork)`; gap →
`bandaPunteada(r, GAP_BANDA, CHIP_GAP, artwork)`; grid (3 sitios) →
`bandaPunteada(r, ROJO, ROJO, artwork)`.

- [ ] **Step 3: Margen en los 4 lados** — en `artworkDe`, el `resize` pasa a
`artwork.resize(clon.width + 2 * MARGEN, clon.height + 2 * MARGEN)` (clon sigue en `(MARGEN, MARGEN)`).
(En `artworkGrids` mantener su resize con `RESPIRO`, no dibuja marcas.)

- [ ] **Step 4: Helper `dibujarMarcas`** — agregar (usa `chip`, `CHIP_PADDING`, `CHIP_GAP`):

```typescript
async function dibujarMarcas(artwork: FrameNode, marcas: import("../utils/marcadores-layout.ts").Marca[], clon: FrameNode): Promise<void> {
  for (const m of marcas) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    const c = await chip(m.valor, color, artwork);
    if (m.lado === "top") { c.x = m.centro - c.width / 2; c.y = MARGEN - 18; }
    else if (m.lado === "bottom") { c.x = m.centro - c.width / 2; c.y = MARGEN + clon.height + 6; }
    else if (m.lado === "left") { c.x = MARGEN - 16 - c.width; c.y = m.centro - c.height / 2; }
    else { c.x = MARGEN + clon.width + 16; c.y = m.centro - c.height / 2; }
  }
}
```

(El import de tipo se puede subir al `import { ..., type Marca }` existente de
`../utils/marcadores-layout.ts` en vez del inline.)

- [ ] **Step 5: Padding en GRID + reemplazar el bloque de marcas** — en `artworkDe`:
  - El branch GRID: antes de `return artwork`, calcular y dibujar las marcas de padding (sin gaps):
    ```typescript
    await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, [], "HORIZONTAL", spec.spacingAuto, spec.spacingVars), clon);
    ```
    (justo después de las cotas `await dibujarCotas(...)`).
  - El camino H/V: reemplazar el bloque actual de marcas (el `const { ejeX, ejeY } = marcasLayout(...)`
    y los dos `for`) por:
    ```typescript
    await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars), clon);
    ```
  - La línea fina (`linea`) de los ticks ya no se usa en las marcas; si `linea` queda sin uso, dejarla.

- [ ] **Step 6: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 7: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: chips en 4 lados, padding en Grid, punteado oscuro y chips 11px (D4)"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — artwork del `card`/`screen`: chips de padding en los 4 lados
sin superponerse; el `screen` Grid muestra su padding; bordes punteados más oscuros; chips a 11px.
Comparar con `DesignDoc-layout.pdf`.
- [ ] **Step 3: Ajustes** — offsets por lado si algún chip choca con las cotas.
