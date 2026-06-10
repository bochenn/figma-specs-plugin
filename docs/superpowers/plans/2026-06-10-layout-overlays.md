# Overlays de Layout — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a Layout and Spacing un artwork clonado con overlays de color (azul = elemento, verde = padding, naranja = item spacing) sobre cada frame con Auto Layout.

**Architecture:** La geometría (bandas de padding, gaps de spacing) vive en funciones puras testeadas (`utils/overlays.ts`). El generador de Layout clona el nodo y dibuja los overlays recorriendo el clon por acumulación de `x`/`y`. `main.ts` pasa el nodo real a `generarLayout`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/utils/overlays.ts` | **Nuevo.** `Rect`, `rectsPadding`, `rectsSpacing`. Lógica pura. |
| `src/plugin/generadores/layout.ts` | **Modificar.** `generarLayout(seleccionado, specs)`: clon + overlays + exhibits. |
| `src/plugin/main.ts` | **Modificar.** `generarSeccionLayout` pasa el nodo real. |
| `tests/rects-padding.test.ts` | **Nuevo.** Tests de `rectsPadding`. |
| `tests/rects-spacing.test.ts` | **Nuevo.** Tests de `rectsSpacing`. |

---

## Task 1: `rectsPadding`

**Files:**
- Create: `tests/rects-padding.test.ts`
- Create: `src/plugin/utils/overlays.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { rectsPadding } from "../src/plugin/utils/overlays.ts";

test("padding uniforme → 4 bandas (top, bottom, left, right)", () => {
  const rects = rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 10, top: 10, right: 10, bottom: 10 });
  assert.deepEqual(rects, [
    { x: 0, y: 0, width: 100, height: 10 },     // top
    { x: 0, y: 90, width: 100, height: 10 },    // bottom
    { x: 0, y: 10, width: 10, height: 80 },     // left
    { x: 90, y: 10, width: 10, height: 80 },    // right
  ]);
});

test("solo top → 1 banda", () => {
  const rects = rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 0, top: 10, right: 0, bottom: 0 });
  assert.deepEqual(rects, [{ x: 0, y: 0, width: 100, height: 10 }]);
});

test("padding 0 → []", () => {
  assert.deepEqual(rectsPadding({ x: 0, y: 0, width: 100, height: 100 }, { left: 0, top: 0, right: 0, bottom: 0 }), []);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/overlays.ts"`.

- [ ] **Step 3: Crear `src/plugin/utils/overlays.ts`**

```typescript
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Bandas de padding (top, bottom, left, right), omitiendo las de padding 0.
export function rectsPadding(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
): Rect[] {
  const rects: Rect[] = [];
  const interiorH = frame.height - padding.top - padding.bottom;
  if (padding.top > 0) rects.push({ x: frame.x, y: frame.y, width: frame.width, height: padding.top });
  if (padding.bottom > 0) rects.push({ x: frame.x, y: frame.y + frame.height - padding.bottom, width: frame.width, height: padding.bottom });
  if (padding.left > 0) rects.push({ x: frame.x, y: frame.y + padding.top, width: padding.left, height: interiorH });
  if (padding.right > 0) rects.push({ x: frame.x + frame.width - padding.right, y: frame.y + padding.top, width: padding.right, height: interiorH });
  return rects;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (74 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/rects-padding.test.ts src/plugin/utils/overlays.ts
git commit -m "feat: rectsPadding (bandas de padding)"
```

---

## Task 2: `rectsSpacing`

**Files:**
- Create: `tests/rects-spacing.test.ts`
- Modify: `src/plugin/utils/overlays.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { rectsSpacing } from "../src/plugin/utils/overlays.ts";

test("dos hijos horizontales → gap medido entre ellos", () => {
  const rects = rectsSpacing(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 62, y: 0, width: 50, height: 30 }],
    "HORIZONTAL",
  );
  assert.deepEqual(rects, [{ x: 50, y: 0, width: 12, height: 30 }]);
});

test("dos hijos verticales → gap vertical", () => {
  const rects = rectsSpacing(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 0, y: 42, width: 50, height: 30 }],
    "VERTICAL",
  );
  assert.deepEqual(rects, [{ x: 0, y: 30, width: 50, height: 12 }]);
});

test("un solo hijo → []", () => {
  assert.deepEqual(rectsSpacing([{ x: 0, y: 0, width: 50, height: 30 }], "HORIZONTAL"), []);
});

test("hijos pegados (gap 0) → []", () => {
  const rects = rectsSpacing(
    [{ x: 0, y: 0, width: 50, height: 30 }, { x: 50, y: 0, width: 50, height: 30 }],
    "HORIZONTAL",
  );
  assert.deepEqual(rects, []);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `rectsSpacing is not a function`.

- [ ] **Step 3: Agregar `rectsSpacing` a `src/plugin/utils/overlays.ts`**

```typescript
// Gaps entre hijos consecutivos (hueco medido), omitiendo gaps ≤ 0.
export function rectsSpacing(children: Rect[], direccion: "HORIZONTAL" | "VERTICAL"): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i < children.length - 1; i++) {
    const a = children[i];
    const b = children[i + 1];
    if (direccion === "HORIZONTAL") {
      const x = a.x + a.width;
      const w = b.x - x;
      if (w > 0) rects.push({ x, y: a.y, width: w, height: a.height });
    } else {
      const y = a.y + a.height;
      const h = b.y - y;
      if (h > 0) rects.push({ x: a.x, y, width: a.width, height: h });
    }
  }
  return rects;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 4 tests nuevos PASAN (78 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/rects-spacing.test.ts src/plugin/utils/overlays.ts
git commit -m "feat: rectsSpacing (gaps de item spacing)"
```

---

## Task 3: Clon + overlays en el generador de Layout

**Files:**
- Modify: `src/plugin/generadores/layout.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Reemplazar `src/plugin/generadores/layout.ts`**

```typescript
import type { LayoutSpec } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };

// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 4);
  fila.appendChild(await texto(`${spec.elementoNombre} · ${spec.tipo}`, 16));
  const direccion = spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
  fila.appendChild(await texto(`Direction: ${direccion}`, 12));
  fila.appendChild(await texto(`Alignment: ${spec.alineacionPrimaria} / ${spec.alineacionContraria}`, 12));
  fila.appendChild(await texto(`Resizing: ${spec.resizingHorizontal} × ${spec.resizingVertical}`, 12));
  const p = spec.padding;
  fila.appendChild(await texto(`Padding: L${p.left} T${p.top} R${p.right} B${p.bottom}`, 12));
  fila.appendChild(await texto(`Item spacing: ${spec.itemSpacing}`, 12));
  return fila;
}

// Dibuja un rect de overlay (semitransparente) en el artwork.
function rectOverlay(r: Rect, color: RGB, opacity: number, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity }];
  artwork.appendChild(rect);
}

// Recorre el clon (offset acumulado relativo a la raíz) dibujando overlays por
// cada frame con Auto Layout; frena en instancias.
function dibujarOverlays(node: SceneNode, offX: number, offY: number, artwork: FrameNode): void {
  if ("layoutMode" in node && (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL")) {
    const frameRect: Rect = { x: offX, y: offY, width: node.width, height: node.height };
    rectOverlay(frameRect, AZUL, 0.12, artwork);
    const padding = { left: node.paddingLeft, top: node.paddingTop, right: node.paddingRight, bottom: node.paddingBottom };
    for (const r of rectsPadding(frameRect, padding)) rectOverlay(r, VERDE, 0.35, artwork);
    const childrenRects: Rect[] = node.children.map((c) => ({ x: offX + c.x, y: offY + c.y, width: c.width, height: c.height }));
    for (const r of rectsSpacing(childrenRects, node.layoutMode)) rectOverlay(r, NARANJA, 0.5, artwork);
  }
  if (node.type === "INSTANCE") return;
  if ("children" in node) {
    for (const c of node.children) dibujarOverlays(c, offX + c.x, offY + c.y, artwork);
  }
}

// Genera el output de Layout and Spacing: artwork con overlays + exhibits de texto.
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  // Artwork: clon + overlays.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);
  dibujarOverlays(clon, 0, 0, artwork);
  seccion.appendChild(artwork);

  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  }
  for (const s of specs) {
    seccion.appendChild(await exhibit(s));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Actualizar `generarSeccionLayout` en `src/plugin/main.ts`**

Reemplazar la línea:

```typescript
  const frame = await generarLayout(nodo.name, specs);
```

por:

```typescript
  const frame = await generarLayout(nodo, specs);
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 4: Build y tests**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 78`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts src/plugin/main.ts
git commit -m "feat: artwork con overlays (azul/verde/naranja) en Layout and Spacing"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame de prueba**

En Figma, un FRAME con **Auto Layout** (dirección horizontal o vertical, **padding** ej. 16, **item
spacing** ej. 12, con varios hijos) que contenga además un **frame interno con su propio Auto Layout**.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Overlays)**

Seleccionar el frame → botón **"Layout & Spacing"**.
Expected: en la sección Layout and Spacing aparece un **Artwork** = clon del frame con overlays
semitransparentes: **azul** sobre cada frame con Auto Layout, **verde** en las bandas de padding, **naranja**
en los gaps entre hijos. Debajo, los **exhibits de texto** como antes. El frame interno también tiene sus
overlays. El output se ubica a la derecha del frame. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/3. Layout and Spacing/` y comparar la posición/colores de los overlays. Anotar
diferencias (marcadores, íconos) como pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Frame con **padding 0** → sin overlay verde.
- Frame con **1 hijo** → sin overlay naranja.
- Anatomy / Properties / Data / Styling / Modes desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Overlays de Layout en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Geometría pura | Task 1 (rectsPadding), Task 2 (rectsSpacing) |
| 2 — Clon, recorrido y dibujo | Task 3 (generador + main) |
| 3 — Errores y casos límite | Task 1/2 (omiten bandas/gaps vacíos), Task 3 (try/catch en main) |
| 4 — Testing | Tasks 1–2 (unit), Task 4 (manual) |
