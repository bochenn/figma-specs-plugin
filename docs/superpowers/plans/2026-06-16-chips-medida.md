# Chips de medida (DesignDoc visual · D1) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Reemplazar los números sueltos del artwork por chips de color (padding azul, gap rosa, dimensión rojo) con nombre de variable + valor, según `docs/superpowers/specs/2026-06-16-chips-medida-design.md`.

**Architecture:** `marcasLayout` gana `spacingVars` y formatea con `etiquetaSpacing` (testeable). El generador suma un helper `chip` y constantes de color, y reemplaza `textoMarca`/`textoCota`/medidas-por-hijo por chips; las bandas de padding/gap pasan a azul/rosa.

---

### Task 1: `marcasLayout` con nombre de variable — TDD

**Files:** `src/plugin/utils/marcadores-layout.ts`; test `tests/marcadores-layout.test.ts`.

- [ ] **Step 1: Tests que fallan** — agregar a `tests/marcadores-layout.test.ts`:

```typescript
test("marcasLayout incluye el nombre de variable del padding cuando se pasa spacingVars", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 0, right: 0, bottom: 0 };
  const { ejeX } = marcasLayout(frame, padding, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  assert.equal(ejeX[0].valor, "space/padding-1x (16)");
});

test("marcasLayout sin spacingVars → solo el número (compatibilidad)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const { ejeX } = marcasLayout(frame, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(ejeX[0].valor, "16");
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL (el primer test: hoy `valor` no incluye el nombre).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/marcadores-layout.ts`, cambiar la firma y el
formateo de `marcasLayout`:

```typescript
export function marcasLayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string } = {},
): { ejeX: MarcaX[]; ejeY: MarcaY[] } {
  const u = unidadActual();
  const ejeX: MarcaX[] = [];
  const ejeY: MarcaY[] = [];
  if (padding.left > 0) {
    ejeX.push({ x: frame.x + padding.left / 2, desde: frame.x, hasta: frame.x + padding.left, valor: etiquetaSpacing(padding.left, u, spacingVars.paddingLeft), tipo: "padding" });
  }
  if (padding.right > 0) {
    const desde = frame.x + frame.width - padding.right;
    ejeX.push({ x: desde + padding.right / 2, desde, hasta: frame.x + frame.width, valor: etiquetaSpacing(padding.right, u, spacingVars.paddingRight), tipo: "padding" });
  }
  if (padding.top > 0) {
    ejeY.push({ y: frame.y + padding.top / 2, desde: frame.y, hasta: frame.y + padding.top, valor: etiquetaSpacing(padding.top, u, spacingVars.paddingTop), tipo: "padding" });
  }
  if (padding.bottom > 0) {
    const desde = frame.y + frame.height - padding.bottom;
    ejeY.push({ y: desde + padding.bottom / 2, desde, hasta: frame.y + frame.height, valor: etiquetaSpacing(padding.bottom, u, spacingVars.paddingBottom), tipo: "padding" });
  }
  for (const g of gaps) {
    if (direccion === "HORIZONTAL") {
      ejeX.push({ x: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: spacingAuto ? "Auto" : etiquetaSpacing(g.width, u, spacingVars.itemSpacing), tipo: "spacing" });
    } else {
      ejeY.push({ y: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: spacingAuto ? "Auto" : etiquetaSpacing(g.height, u, spacingVars.itemSpacing), tipo: "spacing" });
    }
  }
  return { ejeX: sinPisadas(ejeX), ejeY: sinPisadas(ejeY) };
}
```

(Quita el `const E = …` con `formatearEspaciado`; `etiquetaSpacing` ya está importado. Si
`formatearEspaciado` queda sin uso en el archivo, sacarlo del import.)

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS (incluidos los tests previos: sin `spacingVars`, `etiquetaSpacing` da solo el número).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: marcasLayout incluye el nombre de variable (chips D1)"
```

---

### Task 2: Chips y color semántico en el generador

**Files:** `src/plugin/generadores/layout.ts`.

- [ ] **Step 1: Constantes de color + helper `chip`** — tras las constantes de color existentes
(`AZUL/VERDE/NARANJA/ROJO`), agregar:

```typescript
const CHIP_PADDING: RGB = { r: 0.05, g: 0.5, b: 1 };
const CHIP_GAP: RGB = { r: 0.9, g: 0.2, b: 0.5 };
const CHIP_DIM: RGB = { r: 0.95, g: 0.25, b: 0.15 };
const PADDING_BANDA: RGB = { r: 0.6, g: 0.78, b: 1 };
const GAP_BANDA: RGB = { r: 1, g: 0.7, b: 0.85 };
```

Y un helper (cerca de `textoMarca`):

```typescript
// Chip de medida: frame con fondo de color y texto blanco; el caller lo posiciona.
async function chip(valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "Chip";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const t = await texto(valor, 9);
  t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}
```

- [ ] **Step 2: Bandas de padding/gap en azul/rosa** — en `artworkDe`:
  - cambiar `rectsPadding(frameRect, spec.padding)) rectOverlay(r, VERDE, 0.35, …)` por
    `rectOverlay(r, PADDING_BANDA, 0.30, artwork)`.
  - cambiar `for (const r of gaps) rectOverlay(r, NARANJA, 0.5, …)` por
    `rectOverlay(r, GAP_BANDA, 0.45, artwork)`.

- [ ] **Step 3: Marcas como chips** — reemplazar el bloque de marcas
(`const { ejeX, ejeY } = marcasLayout(...)` y los dos `for`) por:

```typescript
  const { ejeX, ejeY } = marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars);
  for (const m of ejeX) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    linea(m.desde, MARGEN - 12, 1, 12, color, artwork);
    linea(m.hasta - 1, MARGEN - 12, 1, 12, color, artwork);
    const c = await chip(m.valor, color, artwork);
    c.x = m.x - c.width / 2;
    c.y = MARGEN - 14 - c.height;
  }
  for (const m of ejeY) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    linea(MARGEN - 12, m.desde, 12, 1, color, artwork);
    linea(MARGEN - 12, m.hasta - 1, 12, 1, color, artwork);
    const c = await chip(m.valor, color, artwork);
    c.x = MARGEN - 16 - c.width;
    c.y = m.y - c.height / 2;
  }
```

(Si `textoMarca` queda sin uso, dejarlo; no molesta. `VERDE_TEXTO`/`NARANJA_TEXTO` pueden quedar sin
uso — sacarlos si TypeScript/lint no se queja en build, o dejarlos.)

- [ ] **Step 4: Cotas del frame y medidas por hijo como chips** — en `dibujarCotas`, reemplazar las
dos llamadas `const tW = await textoCota(...)` / `const tH = await textoCota(...)` por
`const tW = await chip(etiquetaSpacing(spec.width, u, spec.widthVar), CHIP_DIM, artwork);` y
`const tH = await chip(etiquetaSpacing(spec.height, u, spec.heightVar), CHIP_DIM, artwork);`
(las posiciones `tW.x/tW.y` y `tH.x/tH.y` se mantienen).
En `dibujarCotaHijo`, los dos `await textoCota(...)` pasan a `await chip(..., CHIP_DIM, artwork)`
(mismas posiciones `tw`/`th`).

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: chips de medida con color semántico en el artwork (D1)"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — artwork del `card`/`screen`: padding en chips azules
(`space/padding-1x (16)`), gap en chips rosas, dimensiones/medidas por hijo en chips rojos; bandas
de padding azul claro y gap rosa claro. Ya no números sueltos amontonados. Comparar con
`DesignDoc-layout.pdf`.
- [ ] **Step 3: Ajustes** — si los chips se solapan, ajustar offsets.
