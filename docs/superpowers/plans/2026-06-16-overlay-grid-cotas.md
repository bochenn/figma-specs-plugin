# Overlay del Grid + valor en cotas (DesignDoc 3/3 · C1+C2) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Dibujar las columnas/filas del Grid auto-layout sobre el artwork y poner el valor numérico en las cotas W/H del frame, según las specs `2026-06-16-overlay-grid-design.md` y `2026-06-16-cotas-frame-valor-design.md`.

**Architecture:** `franjasGridAutolayout` (puro, testeable) calcula las franjas del grid. El branch GRID de `artworkDe` las dibuja. Las cotas W/H ganan un texto con el valor y se dibujan para todos los contenedores (incluido GRID).

---

### Task 1: `franjasGridAutolayout` (puro) — TDD

**Files:** `utils/grilla.ts`; test `tests/grilla.test.ts`.

- [ ] **Step 1: Tests que fallan** — agregar a `tests/grilla.test.ts` (sumar `franjasGridAutolayout` al import):

```typescript
test("franjasGridAutolayout: reparte columnas en el área de contenido", () => {
  const { columnas, filas } = franjasGridAutolayout(
    { x: 0, y: 0, width: 800, height: 120 },
    { left: 16, top: 16, right: 16, bottom: 16 },
    12, 1, 20, 20,
  );
  assert.equal(columnas.length, 12);
  assert.equal(columnas[0].x, 16);
  assert.equal(Math.round(columnas[0].width), 46); // (768 - 11*20)/12 = 45.67
  assert.equal(columnas[0].y, 16);
  assert.equal(columnas[0].height, 88); // 120 - 32
  assert.equal(Math.round(columnas[1].x), 82); // 16 + 45.67 + 20
  assert.deepEqual(filas, []); // 1 fila → sin franjas de fila
});

test("franjasGridAutolayout: filas>1 genera franjas horizontales", () => {
  const { filas } = franjasGridAutolayout(
    { x: 0, y: 0, width: 100, height: 100 },
    { left: 0, top: 0, right: 0, bottom: 0 },
    1, 2, 0, 10,
  );
  assert.equal(filas.length, 2);
  assert.equal(filas[0].y, 0);
  assert.equal(filas[0].height, 45); // (100 - 10)/2
  assert.equal(filas[1].y, 55);
});

test("franjasGridAutolayout: counts o tamaño inválido → vacío", () => {
  const r = franjasGridAutolayout({ x: 0, y: 0, width: 10, height: 10 }, { left: 0, top: 0, right: 0, bottom: 0 }, 0, 0, 0, 0);
  assert.deepEqual(r, { columnas: [], filas: [] });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/grilla.test.ts`
Expected: FAIL (`franjasGridAutolayout` no existe).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/grilla.ts`, agregar:

```typescript
export interface FranjasGrid { columnas: Rect[]; filas: Rect[]; }

// Franjas de un Grid auto-layout dentro del área de contenido (frame − padding).
export function franjasGridAutolayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  columnas: number, filas: number, columnGap: number, rowGap: number,
): FranjasGrid {
  const cx = frame.x + padding.left;
  const cy = frame.y + padding.top;
  const cw = frame.width - padding.left - padding.right;
  const ch = frame.height - padding.top - padding.bottom;
  const cols: Rect[] = [];
  const rows: Rect[] = [];
  if (columnas > 1 && cw > 0) {
    const w = (cw - (columnas - 1) * columnGap) / columnas;
    if (w > 0) for (let i = 0; i < columnas; i++) cols.push({ x: cx + i * (w + columnGap), y: cy, width: w, height: ch });
  }
  if (filas > 1 && ch > 0) {
    const h = (ch - (filas - 1) * rowGap) / filas;
    if (h > 0) for (let i = 0; i < filas; i++) rows.push({ x: cx, y: cy + i * (h + rowGap), width: cw, height: h });
  }
  return { columnas: cols, filas: rows };
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/grilla.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/grilla.ts tests/grilla.test.ts
git commit -m "feat: franjasGridAutolayout (geometría del grid auto-layout) (C2)"
```

---

### Task 2: Generador — dibujar grid + valor en cotas

**Files:** `generadores/layout.ts`.

- [ ] **Step 1: Import** — sumar `franjasGridAutolayout` al import de `../utils/grilla.ts`.

- [ ] **Step 2: Helper de texto de cota** — agregar cerca de `textoMarca`:

```typescript
// Texto del valor de una cota (azul), agregado al artwork; el caller lo posiciona.
async function textoCota(valor: string, artwork: FrameNode): Promise<TextNode> {
  const t = await texto(valor, 10);
  t.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.4, b: 0.85 } }];
  artwork.appendChild(t);
  return t;
}
```

- [ ] **Step 3: Dibujar grid en el branch GRID de `artworkDe`** — donde hoy está
`if (spec.direccion === "GRID") return artwork;`, reemplazar por dibujar las franjas y las cotas
antes de retornar:

```typescript
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) rectOverlay(r, ROJO, 0.12, artwork);
    for (const r of filas) rectOverlay(r, ROJO, 0.12, artwork);
    await dibujarCotas(artwork, clon, spec);
    return artwork;
  }
```

- [ ] **Step 4: Extraer `dibujarCotas` (con valor) y usarlo en ambos caminos** — reemplazar el
bloque actual de cotas (las líneas que crean `cotaH`/`cotaV`) por una función reutilizable, e
invocarla en el camino H/V donde estaban:

```typescript
// Cotas azules de W/H con su valor numérico (resizing en las puntas, medida en el texto).
async function dibujarCotas(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec): Promise<void> {
  const u = unidadActual();
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = MARGEN;
  cotaH.y = MARGEN - 44;
  artwork.appendChild(cotaH);
  const tW = await textoCota(etiquetaSpacing(spec.width, u, spec.widthVar), artwork);
  tW.x = MARGEN + clon.width / 2 - tW.width / 2;
  tW.y = MARGEN - 44 - 12;
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = MARGEN - 44;
  cotaV.y = MARGEN;
  artwork.appendChild(cotaV);
  const tH = await textoCota(etiquetaSpacing(spec.height, u, spec.heightVar), artwork);
  tH.x = MARGEN - 44 - tH.width - 2;
  tH.y = MARGEN + clon.height / 2 - tH.height / 2;
}
```

En el camino H/V, donde hoy están las líneas `const cotaH = …` … `artwork.appendChild(cotaV);`,
reemplazarlas por `await dibujarCotas(artwork, clon, spec);` (el ícono de dirección queda igual,
después).

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: overlay de columnas/filas del grid + valor en las cotas W/H (C1+C2)"
```

---

### Task 3: Verificación

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — el `screen` (Grid 800×120, 12 columnas) → Layout muestra las
12 columnas marcadas sobre el clon, cota `800` arriba y `120` a la izquierda. Un frame H/V → cotas
con su medida. Comparar con designdoc.pdf.
