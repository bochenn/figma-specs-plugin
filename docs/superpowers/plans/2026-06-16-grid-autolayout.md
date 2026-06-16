# Soporte de Grid auto-layout (cierra H3) — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Layout reconoce y documenta `layoutMode === "GRID"`, según `docs/superpowers/specs/2026-06-16-grid-autolayout-design.md`. Cierra H3.

**Architecture:** `tieneAutoLayout` incluye GRID; el adaptador/extracción copian las props de grid; `LayoutSpec.direccion` admite "GRID"; el exhibit y el artwork tienen un branch para GRID. Extracción testeada; generador verificado a mano.

---

### Task 1: Modelo, traversal y extracción — TDD

**Files:** `modelo/tipos.ts`, `traversal/recorrer-autolayout.ts`, `extraccion/adaptador.ts`, `extraccion/layout.ts`; tests `recorrer-autolayout.test.ts`, `layout-extraccion.test.ts`.

- [ ] **Step 1: Tests que fallan**

`tests/recorrer-autolayout.test.ts`:
```typescript
test("detecta layoutMode GRID como auto-layout", () => {
  const raiz: NodoLike = { id: "g", name: "Screen", type: "FRAME", layoutMode: "GRID", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["g"]);
});
```

`tests/layout-extraccion.test.ts`:
```typescript
test("layoutSpecDe con GRID setea direccion y datos de grilla", () => {
  const raiz: NodoLike = {
    id: "r", name: "Screen", type: "FRAME", layoutMode: "GRID",
    gridColumnCount: 12, gridRowCount: 2, gridColumnGap: 20, gridRowGap: 8,
    children: [],
  };
  const s = extraerLayout(raiz)[0];
  assert.equal(s.direccion, "GRID");
  assert.equal(s.gridColumnas, 12);
  assert.equal(s.gridFilas, 2);
  assert.equal(s.gridColumnGap, 20);
  assert.equal(s.gridRowGap, 8);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/recorrer-autolayout.test.ts tests/layout-extraccion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Modelo** — `modelo/tipos.ts`:
  - `NodoLike` += `gridColumnCount?: number; gridRowCount?: number; gridColumnGap?: number; gridRowGap?: number;`
  - `LayoutSpec.direccion` → `"HORIZONTAL" | "VERTICAL" | "GRID"`.
  - `LayoutSpec` += `gridColumnas?: number; gridFilas?: number; gridColumnGap?: number; gridRowGap?: number;`

- [ ] **Step 4: Traversal** — en `traversal/recorrer-autolayout.ts`, `tieneAutoLayout`:
```typescript
function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL" || n.layoutMode === "GRID";
}
```

- [ ] **Step 5: Adaptador** — en `extraccion/adaptador.ts`, el bloque de layout amplía la condición
y copia las props de grid:
```typescript
  if ("layoutMode" in nodo && (nodo.layoutMode === "HORIZONTAL" || nodo.layoutMode === "VERTICAL" || nodo.layoutMode === "GRID")) {
    base.layoutMode = nodo.layoutMode;
    // ... (lo existente: primaryAxis, padding, itemSpacing, sizing, wrap, etc.)
    if (nodo.layoutMode === "GRID") {
      const g = nodo as unknown as { gridColumnCount?: number; gridRowCount?: number; gridColumnGap?: number; gridRowGap?: number };
      base.gridColumnCount = g.gridColumnCount;
      base.gridRowCount = g.gridRowCount;
      base.gridColumnGap = g.gridColumnGap;
      base.gridRowGap = g.gridRowGap;
    }
  }
```
(Insertar el bloque GRID al final del `if` de layout, antes de cerrarlo. `base.layoutMode` ya se
setea; verificar el tipo de `base.layoutMode` admite "GRID" — `NodoLike.layoutMode` es
`"NONE" | "HORIZONTAL" | "VERTICAL"`; ampliarlo a incluir `"GRID"`.)

- [ ] **Step 6: NodoLike.layoutMode** — en `modelo/tipos.ts`, `layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID";`

- [ ] **Step 7: Extracción** — en `extraccion/layout.ts`, `layoutSpecDe`, mapear la dirección y
setear los datos de grid:
```typescript
    direccion: nodo.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : nodo.layoutMode === "GRID" ? "GRID" : "VERTICAL",
```
y antes del `return spec;`:
```typescript
  if (nodo.layoutMode === "GRID") {
    if (typeof nodo.gridColumnCount === "number") spec.gridColumnas = nodo.gridColumnCount;
    if (typeof nodo.gridRowCount === "number") spec.gridFilas = nodo.gridRowCount;
    if (typeof nodo.gridColumnGap === "number") spec.gridColumnGap = nodo.gridColumnGap;
    if (typeof nodo.gridRowGap === "number") spec.gridRowGap = nodo.gridRowGap;
  }
```

- [ ] **Step 8: Correr la suite y verificar que pasa**

Run: `node --test`
Expected: PASS (los casos H/V no cambian).

- [ ] **Step 9: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/traversal/recorrer-autolayout.ts src/plugin/extraccion/adaptador.ts src/plugin/extraccion/layout.ts tests/recorrer-autolayout.test.ts tests/layout-extraccion.test.ts
git commit -m "feat: reconocer y extraer Grid auto-layout (cierra H3)"
```

---

### Task 2: Generador — exhibit/artwork GRID + complete + quitar debug

**Files:** `generadores/layout.ts`, `generadores/complete.ts`.

- [ ] **Step 1: Exhibit con branch GRID** — en `exhibit` (`generadores/layout.ts`), después de
Width/Height/Fill/Stroke, ramificar:
```typescript
  if (spec.direccion === "GRID") {
    fila.appendChild(await texto("Direction: Grid", 12));
    if (spec.gridColumnas !== undefined) fila.appendChild(await texto(`Columns: ${spec.gridColumnas}`, 12));
    if (spec.gridFilas !== undefined) fila.appendChild(await texto(`Rows: ${spec.gridFilas}`, 12));
    if (spec.gridColumnGap !== undefined) fila.appendChild(await texto(`Column gap: ${etiquetaSpacing(spec.gridColumnGap, u)}`, 12));
    if (spec.gridRowGap !== undefined) fila.appendChild(await texto(`Row gap: ${etiquetaSpacing(spec.gridRowGap, u)}`, 12));
    fila.appendChild(await texto(`Padding: ${textoPadding(spec.padding, u, spec.spacingVars)}`, 12));
    if (spec.cornerRadius) fila.appendChild(await texto(`Corner radius: ${etiquetaSpacing(spec.cornerRadius, u)}`, 12));
    return fila;
  }
```
(Va justo antes de la línea actual `const direccion = ...`. El resto del cuerpo (Direction lineal,
Alignment, Padding, Item spacing, Corner radius, Grid) queda para H/V.)

- [ ] **Step 2: Artwork con branch GRID** — en `artworkDe`, tras pintar hijos azules y padding
verde, y antes de los gaps/marcas/cotas/ícono, si es GRID devolver temprano:
```typescript
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  for (const r of rectsPadding(frameRect, spec.padding)) rectOverlay(r, VERDE, 0.35, artwork);
  if (spec.direccion === "GRID") return artwork; // overlays 2D del grid → Rebanada C
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  ...
```
(El `spec.direccion` en `rectsSpacing(hijosRects, spec.direccion)` ya no recibirá "GRID".)

- [ ] **Step 3: Complete Layout** — en `generadores/complete.ts`, el texto de dirección:
```typescript
    const dir = s.direccion === "HORIZONTAL" ? "Horizontal" : s.direccion === "GRID" ? "Grid" : "Vertical";
```

- [ ] **Step 4: Quitar el `[debug]`** — en `generadores/layout.ts`, borrar las líneas del
diagnóstico temporal (las 3 líneas `// Diagnóstico temporal (H3)` … `[debug] raíz: …`), dejando solo
`seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));`.

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts src/plugin/generadores/complete.ts
git commit -m "feat: exhibit y artwork para Grid auto-layout; quitar debug de H3"
```

---

### Task 3: Verificación

- [ ] **Step 1: Build + suite** — `npm run build && node --test` → verde.
- [ ] **Step 2: Manual (usuario)** — el `screen` (Grid auto-layout) → Layout muestra `Direction: Grid`,
Columns/Rows/gaps y el artwork con padding; ya no "No se detectaron capas". Comparar con designdoc.pdf.
