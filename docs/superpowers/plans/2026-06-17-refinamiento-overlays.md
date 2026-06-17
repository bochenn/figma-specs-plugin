# Refinamiento de overlays, cotas y chips (DesignDoc visual · D3) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Chips de padding/gap con nombre corto + valor, bandas con borde punteado y cotas en color de dimensión (rojo), según `docs/superpowers/specs/2026-06-17-refinamiento-overlays-design.md`.

**Architecture:** `nombreCorto` (puro) + `marcasLayout` reincorpora `spacingVars` formateando `"corto valor"` (testeable). El generador suma `bandaPunteada`, pinta las bandas con borde punteado, sube `MARGEN` y cambia el color de las cotas a rojo.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: Nombre corto en chips de padding/gap — TDD

**Files:** `src/plugin/utils/marcadores-layout.ts`; test `tests/marcadores-layout.test.ts`.

- [ ] **Step 1: Tests** — sumar `nombreCorto` al import del test; **actualizar** el test de D1 que
esperaba el nombre completo y agregar el de `nombreCorto`:

Reemplazar el test `"marcasLayout incluye el nombre de variable del padding cuando se pasa spacingVars"` por:
```typescript
test("marcasLayout con spacingVars → chip 'nombreCorto valor'", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 0, right: 0, bottom: 0 };
  const { ejeX } = marcasLayout(frame, padding, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  assert.equal(ejeX[0].valor, "padding-1x 16");
});
```
Y agregar:
```typescript
test("nombreCorto: último segmento tras la barra", () => {
  assert.equal(nombreCorto("space/padding-1x"), "padding-1x");
  assert.equal(nombreCorto("simple"), "simple");
});
```
(El test "sin spacingVars → solo el número" se mantiene.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL (`nombreCorto` inexistente; el valor da `space/padding-1x (16)`).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/marcadores-layout.ts`:

Agregar el helper:
```typescript
// Último segmento de un nombre de variable: "space/padding-1x" → "padding-1x".
export function nombreCorto(nombre: string): string {
  return nombre.split("/").pop() ?? nombre;
}
```

En `marcasLayout`, reemplazar las llamadas `etiquetaSpacing(valor, u, spacingVars.X)` por una
versión que arma `"corto valor"`. Definir al inicio de la función:
```typescript
  const marca = (px: number, nombreVar?: string) =>
    nombreVar ? `${nombreCorto(nombreVar)} ${formatearEspaciado(px, u)}` : formatearEspaciado(px, u);
```
y usar `marca(padding.left, spacingVars.paddingLeft)`, `marca(padding.right, spacingVars.paddingRight)`,
`marca(padding.top, spacingVars.paddingTop)`, `marca(padding.bottom, spacingVars.paddingBottom)`, y en
los gaps `spacingAuto ? "Auto" : marca(g.width/g.height, spacingVars.itemSpacing)`. (`formatearEspaciado`
ya está importado; `etiquetaSpacing` puede quedar para otros usos.)

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: nombreCorto + marcasLayout con 'nombre corto valor' (D3 #1)"
```

---

### Task 2: Bandas punteadas, cotas rojas y nombre en chips (generador)

**Files:** `src/plugin/generadores/layout.ts`.

- [ ] **Step 1: MARGEN y color de cotas** — subir `const MARGEN = 80;` a `const MARGEN = 96;`. Y la
constante de color de las cotas: `const AZUL_HEX = "#0D66D9";` pasa a `const AZUL_HEX = "#F24026";`
(rojo, el hex de `CHIP_DIM`; las cotas son de dimensión). (Renombrar no hace falta; solo lo usan
`svgCotaH/svgCotaV`.)

- [ ] **Step 2: Helper `bandaPunteada`** — agregar tras `rectOverlay`:
```typescript
// Banda overlay con fill claro + borde punteado del color (dimensiones del PRD).
function bandaPunteada(r: Rect, color: RGB, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity: 0.12 }];
  rect.strokes = [{ type: "SOLID", color }];
  rect.strokeWeight = 1;
  rect.dashPattern = [3, 3];
  artwork.appendChild(rect);
}
```

- [ ] **Step 3: Usar `bandaPunteada` en las bandas** — en `artworkDe`:
  - `for (const r of rectsPadding(frameRect, spec.padding)) bandaPunteada(r, PADDING_BANDA, artwork);`
  - columnas/filas del grid: `for (const r of columnas) bandaPunteada(r, ROJO, artwork);` y
    `for (const r of filas) bandaPunteada(r, ROJO, artwork);`
  - gaps: `for (const r of gaps) bandaPunteada(r, GAP_BANDA, artwork);`
  - layout grids clásicos (las dos `for (const r of rectsGrid(frameRect, g)) rectOverlay(r, ROJO, …)`,
    en `artworkDe` y en `artworkGrids`): `bandaPunteada(r, ROJO, artwork)`.
  - **Hijos** (`rectOverlay(r, AZUL, 0.25, …)`): se mantienen con `rectOverlay` (fill sólido).

- [ ] **Step 4: marcasLayout con spacingVars** — en `artworkDe`, la llamada
`marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto)` vuelve a pasar
`spec.spacingVars`: `marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars)`.
(Así los chips de padding/gap muestran `padding-1x 16`.)

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: bandas punteadas, cotas rojas y nombre corto en chips del artwork (D3 #1-#3)"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — artwork del `card`/`screen`: chips de padding/gap con
`padding-1x 16` / `gap-0_5x 8` (sin cortarse, con MARGEN 96), bandas (padding y columnas del grid)
con borde punteado, cotas W/H en rojo. Comparar con `DesignDoc-layout.pdf` y la captura del overlay
punteado.
- [ ] **Step 3: Ajustes** — dashPattern/opacidad/MARGEN si hace falta.
```bash
git add -A && git commit -m "fix: ajustes de refinamiento de overlays"
```
