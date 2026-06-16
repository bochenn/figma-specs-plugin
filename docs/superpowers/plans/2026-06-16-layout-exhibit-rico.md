# Exhibit de Layout enriquecido (DesignDoc 1/3) — Plan de Implementación (Rebanada A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El exhibit de Layout & Spacing muestra Width/Height (resizing + valor/variable), Fill, Stroke y Corner radius, estilo DesignDoc, según `docs/superpowers/specs/2026-06-16-layout-exhibit-rico-design.md`.

**Architecture:** `textoDimension` (puro) formatea "resizing + valor". `LayoutSpec` gana width/height/vars/cornerRadius/fill/stroke; `layoutSpecDe` los puebla reusando `colorAtributo` (se exporta `hexSolido`). El exhibit reemplaza la línea `Resizing` por Width/Height y suma Fill/Stroke/Corner radius. Extracción testeada; generador verificado a mano.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: `textoDimension` (puro) — TDD

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Tests que fallan** — agregar a `tests/marcadores-layout.test.ts` (y `textoDimension` al import existente de `marcadores-layout.ts`; sumar `aplicarUnidad` al import de `espaciado.ts` si no está):

```typescript
test("textoDimension: Fixed con variable incluye nombre y valor", () => {
  assert.equal(textoDimension("Fixed", 240, "px", "sizing/card-width"), "Fixed sizing/card-width (240)");
});

test("textoDimension: Hug sin variable es resizing + valor", () => {
  assert.equal(textoDimension("Hug", 88, "px"), "Hug 88");
});

test("textoDimension: respeta rem", () => {
  assert.equal(textoDimension("Fixed", 16, "rem"), "Fixed 1rem");
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL — `textoDimension is not a function` (o error de import).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/marcadores-layout.ts`, agregar el import y la función:

```typescript
import { etiquetaSpacing } from "./espaciado.ts";
import type { Unidad } from "../modelo/tipos.ts";
```

```typescript
// "<resizing> <dim>" con la dimensión formateada (variable + valor si la hay):
// "Fixed sizing/card-width (240)", "Hug 88", "Fixed 1rem".
export function textoDimension(resizing: string, px: number, unidad: Unidad, nombreVar?: string): string {
  return `${resizing} ${etiquetaSpacing(px, unidad, nombreVar)}`;
}
```

(Si `marcadores-layout.ts` ya importa de `espaciado.ts`/tipos, unificar imports en vez de duplicar.)

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: textoDimension formatea resizing + valor/variable (DesignDoc A)"
```

---

### Task 2: Modelo y extracción — TDD

**Files:**
- Modify: `src/plugin/modelo/tipos.ts` (`NodoLike`, `LayoutSpec`)
- Modify: `src/plugin/utils/atributos.ts` (exportar `hexSolido`)
- Modify: `src/plugin/extraccion/layout.ts` (`layoutSpecDe`)
- Modify: `src/plugin/extraccion/adaptador.ts` (`cornerRadius`)
- Test: `tests/layout-extraccion.test.ts`

- [ ] **Step 1: Tests que fallan** — en `tests/layout-extraccion.test.ts`, al nodo del primer test
("arma un LayoutSpec completo…") agregar `width: 240, height: 100,` y a su `deepEqual` esperado
agregar `width: 240, height: 100,`. Y agregar un test nuevo:

```typescript
test("layoutSpecDe puebla fill/stroke/cornerRadius/dimension vars", () => {
  const nodo: NodoLike = {
    id: "r", name: "Card", type: "FRAME", layoutMode: "VERTICAL",
    width: 240, height: 88,
    widthVariableName: "sizing/card-width",
    cornerRadius: 8,
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
    fillVariableName: "color/surface",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    children: [],
  };
  const s = extraerLayout(nodo)[0];
  assert.equal(s.width, 240);
  assert.equal(s.widthVar, "sizing/card-width");
  assert.equal(s.cornerRadius, 8);
  assert.equal(s.fill?.valor, "color/surface");
  assert.equal(s.fill?.formato, "VARIABLE");
  assert.equal(s.stroke?.valor, "#000000"); // sin variable → hardcoded
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/layout-extraccion.test.ts`
Expected: FAIL (campos nuevos ausentes / `hexSolido` no exportado).

- [ ] **Step 3: Modelo** — en `src/plugin/modelo/tipos.ts`:

`NodoLike` (junto a las otras props visuales) += `cornerRadius?: number;`

`LayoutSpec` (después de `spacingVars`) +=:
```typescript
  width: number;
  height: number;
  widthVar?: string;
  heightVar?: string;
  cornerRadius?: number;
  fill?: Atributo;
  stroke?: Atributo;
```
(`Atributo` ya está importado/definido en este archivo.)

- [ ] **Step 4: Exportar `hexSolido`** — en `src/plugin/utils/atributos.ts`, cambiar
`function hexSolido(` por `export function hexSolido(`.

- [ ] **Step 5: Extracción** — en `src/plugin/extraccion/layout.ts`:

Sumar imports:
```typescript
import { colorAtributo, hexSolido } from "../utils/atributos.ts";
```

En `layoutSpecDe`, antes del `return`, calcular fill/stroke; y agregar los campos al objeto devuelto
(width/height siempre; el resto solo si existen):
```typescript
  const fill = colorAtributo("fill", { hex: hexSolido(nodo.fills), variableName: nodo.fillVariableName, styleName: nodo.fillStyleName });
  const stroke = colorAtributo("stroke", { hex: hexSolido(nodo.strokes), variableName: nodo.strokeVariableName, styleName: nodo.strokeStyleName });
  const spec: LayoutSpec = {
    elementoNombre: nodo.name,
    tipo: nodo.type,
    direccion: nodo.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL",
    alineacionPrimaria: alineacion(nodo.primaryAxisAlignItems),
    alineacionContraria: alineacion(nodo.counterAxisAlignItems),
    resizingHorizontal: resizing(nodo.layoutSizingHorizontal),
    resizingVertical: resizing(nodo.layoutSizingVertical),
    padding: {
      left: nodo.paddingLeft ?? 0,
      top: nodo.paddingTop ?? 0,
      right: nodo.paddingRight ?? 0,
      bottom: nodo.paddingBottom ?? 0,
    },
    itemSpacing: nodo.itemSpacing ?? 0,
    wrap: nodo.layoutWrap === "WRAP",
    spacingAuto: nodo.primaryAxisAlignItems === "SPACE_BETWEEN",
    grids: nodo.layoutGrids ?? [],
    spacingVars: nodo.spacingVars ?? {},
    width: nodo.width ?? 0,
    height: nodo.height ?? 0,
  };
  if (nodo.widthVariableName) spec.widthVar = nodo.widthVariableName;
  if (nodo.heightVariableName) spec.heightVar = nodo.heightVariableName;
  if (typeof nodo.cornerRadius === "number" && nodo.cornerRadius > 0) spec.cornerRadius = nodo.cornerRadius;
  if (fill) spec.fill = fill;
  if (stroke) spec.stroke = stroke;
  return spec;
```
(Reemplaza el `return { … }` actual por este bloque `const spec … return spec;`.)

- [ ] **Step 6: Adaptador** — en `src/plugin/extraccion/adaptador.ts`, junto a los otros pasos de
copia (fuera del bloque Auto Layout, igual que `layoutGrids`):
```typescript
  if ("cornerRadius" in nodo && typeof nodo.cornerRadius === "number") base.cornerRadius = nodo.cornerRadius;
```

- [ ] **Step 7: Correr la suite y verificar que pasa**

Run: `node --test`
Expected: PASS (todos; `clave-layout`/`complete-layout` no comparan el objeto entero, solo claves).

- [ ] **Step 8: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/utils/atributos.ts src/plugin/extraccion/layout.ts src/plugin/extraccion/adaptador.ts tests/layout-extraccion.test.ts
git commit -m "feat: LayoutSpec con dimensiones, fill/stroke y corner radius (DesignDoc A)"
```

---

### Task 3: Generador — exhibit enriquecido

**Files:**
- Modify: `src/plugin/generadores/layout.ts` (función `exhibit`)

- [ ] **Step 1: Imports y helper** — en `src/plugin/generadores/layout.ts`, sumar `textoDimension`
al import de `../utils/marcadores-layout.ts`. Agregar el helper (cerca de `exhibit`):

```typescript
// Texto de un atributo de color para el exhibit: "valor (raw)" o "valor".
function lineaColor(attr: { valor: string; rawValue?: string }): string {
  return attr.rawValue ? `${attr.valor} (${attr.rawValue})` : attr.valor;
}
```

- [ ] **Step 2: Reescribir el cuerpo de `exhibit`** — reemplazar las líneas desde
`Direction`/`Alignment`/`Resizing` por el nuevo orden (Width/Height arriba, Fill/Stroke, Direction,
Alignment, Padding, Item spacing, Corner radius, Grid):

```typescript
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 4);
  fila.appendChild(await texto(`${spec.elementoNombre} · ${spec.tipo}`, 16));
  const u = unidadActual();
  fila.appendChild(await texto(`Width: ${textoDimension(spec.resizingHorizontal, spec.width, u, spec.widthVar)}`, 12));
  fila.appendChild(await texto(`Height: ${textoDimension(spec.resizingVertical, spec.height, u, spec.heightVar)}`, 12));
  if (spec.fill) fila.appendChild(await texto(`Fill: ${lineaColor(spec.fill)}`, 12));
  if (spec.stroke) fila.appendChild(await texto(`Stroke: ${lineaColor(spec.stroke)}`, 12));
  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  fila.appendChild(await texto(`Direction: ${direccion}`, 12));
  fila.appendChild(await texto(`Alignment: ${spec.alineacionPrimaria} / ${spec.alineacionContraria}`, 12));
  const sv = spec.spacingVars;
  fila.appendChild(await texto(`Padding: ${textoPadding(spec.padding, u, sv)}`, 12));
  fila.appendChild(await texto(`Item spacing: ${etiquetaSpacing(spec.itemSpacing, u, sv.itemSpacing)}`, 12));
  if (spec.cornerRadius) fila.appendChild(await texto(`Corner radius: ${etiquetaSpacing(spec.cornerRadius, u)}`, 12));
  for (const g of spec.grids) fila.appendChild(await texto(`Grid: ${textoGrid(g)}`, 12));
  return fila;
}
```

(Verificar que `unidadActual`, `etiquetaSpacing`, `textoPadding`, `textoGrid` ya estén importados —
lo están tras las rebanadas anteriores.)

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: exhibit de Layout con Width/Height, Fill/Stroke y Corner radius (DesignDoc A)"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite**

Run: `npm run build && node --test`
Expected: build OK, ~268 tests PASS.

- [ ] **Step 2: Verificación manual en Figma (usuario)**

Frame con Auto Layout (width fijo atado a variable, height hug, fill+stroke con variable, corner
radius) → Layout & Spacing → el exhibit muestra `Width: Fixed sizing/card-width (240)`,
`Height: Hug 88`, `Fill: color/surface (#FFFFFF)`, `Stroke: color/border (#A6ACB0)`,
`Corner radius: 8`. Combinar con Units = rem. Comparar contra `designdoc.pdf`.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A && git commit -m "fix: ajustes del exhibit enriquecido"
```
