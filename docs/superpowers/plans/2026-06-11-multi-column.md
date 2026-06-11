# Multi-column Layout — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un selector "Columns" (1–4) que acomoda los exhibits de Layout en N columnas usando un contenedor wrap de ancho fijo.

**Architecture:** `anchoContenedor` (pura) calcula el ancho del contenedor. `enColumnas` (impure) crea un frame `layoutWrap="WRAP"` y fija cada ítem al ancho máximo del grupo. El generador de Layout lo usa cuando columnas > 1. La UI suma un `<select>`; el mensaje lleva `columnas`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `MensajeUI` suma `columnas?`. |
| `src/plugin/utils/columnas.ts` | **Nuevo.** `anchoContenedor(columnas, anchoItem, gap)`. Pura. |
| `src/plugin/generadores/frames.ts` | **Modificar.** `enColumnas(items, columnas)`. Toca `figma.*`. |
| `src/plugin/generadores/layout.ts` | **Modificar.** `generarLayout(seleccionado, specs, columnas)`. |
| `src/plugin/main.ts` | **Modificar.** `generarSeccionLayout` clamp + pasa columnas. |
| `src/ui/index.html` | **Modificar.** `<select id="columnas">`. |
| `src/ui/ui.ts` | **Modificar.** Manda `columnas`. |
| `tests/columnas.test.ts` | **Nuevo.** Tests de `anchoContenedor`. |

---

## Task 1: `anchoContenedor` + `MensajeUI` columnas

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/columnas.test.ts`
- Create: `src/plugin/utils/columnas.ts`

- [ ] **Step 1: Agregar `columnas?` a `MensajeUI`**

Reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number };
```

- [ ] **Step 2: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { anchoContenedor } from "../src/plugin/utils/columnas.ts";

test("3 columnas de 100 con gap 64 → 428", () => {
  assert.equal(anchoContenedor(3, 100, 64), 428);
});

test("1 columna → solo el ancho del ítem", () => {
  assert.equal(anchoContenedor(1, 100, 64), 100);
});

test("2 columnas de 50 con gap 10 → 110", () => {
  assert.equal(anchoContenedor(2, 50, 10), 110);
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/columnas.ts"`.

- [ ] **Step 4: Crear `src/plugin/utils/columnas.ts`**

```typescript
// Ancho fijo del contenedor wrap para que entren exactamente `columnas` ítems por fila.
export function anchoContenedor(columnas: number, anchoItem: number, gap: number): number {
  return columnas * anchoItem + (columnas - 1) * gap;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (97 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/columnas.test.ts src/plugin/utils/columnas.ts
git commit -m "feat: anchoContenedor + MensajeUI columnas"
```

---

## Task 2: Helper `enColumnas`

**Files:**
- Modify: `src/plugin/generadores/frames.ts`

- [ ] **Step 1: Agregar el import y el helper `enColumnas`**

En `src/plugin/generadores/frames.ts`, agregar el import al inicio (junto a los otros imports):

```typescript
import { anchoContenedor } from "../utils/columnas.ts";
```

Y al final del archivo, agregar:

```typescript
const GAP_COL = 64;

// Acomoda los ítems en `columnas` columnas: un contenedor wrap de ancho fijo,
// con cada ítem fijado al ancho máximo del grupo (≥ su ancho natural → sin overflow).
export function enColumnas(items: FrameNode[], columnas: number): FrameNode {
  let maxW = 0;
  for (const it of items) maxW = Math.max(maxW, it.width);

  const cont = figma.createFrame();
  cont.name = "Columns";
  cont.layoutMode = "HORIZONTAL";
  cont.layoutWrap = "WRAP";
  cont.itemSpacing = GAP_COL;
  cont.counterAxisSpacing = GAP_COL;
  cont.counterAxisSizingMode = "AUTO";
  cont.fills = [];
  cont.primaryAxisSizingMode = "FIXED";
  cont.resize(anchoContenedor(columnas, maxW, GAP_COL), 1);

  for (const it of items) {
    cont.appendChild(it);
    it.layoutSizingHorizontal = "FIXED";
    it.resize(maxW, it.height);
  }
  return cont;
}
```

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 97`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/frames.ts
git commit -m "feat: enColumnas (wrap de ancho fijo en N columnas)"
```

---

## Task 3: Generador de Layout usa columnas + main

**Files:**
- Modify: `src/plugin/generadores/layout.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Importar `enColumnas` en `layout.ts`**

Reemplazar:

```typescript
import { frameVertical, texto } from "./frames.ts";
```

por:

```typescript
import { frameVertical, texto, enColumnas } from "./frames.ts";
```

- [ ] **Step 2: Cambiar `generarLayout` para usar columnas**

Reemplazar la firma y el bloque de los exhibits. La firma:

```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[]): Promise<FrameNode> {
```

pasa a:

```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number): Promise<FrameNode> {
```

Y el bloque final (la nota de vacío + el loop de exhibits):

```typescript
  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  }
  for (const s of specs) {
    seccion.appendChild(await exhibit(s));
  }
```

pasa a:

```typescript
  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    const exhibits: FrameNode[] = [];
    for (const s of specs) exhibits.push(await exhibit(s));
    seccion.appendChild(enColumnas(exhibits, columnas));
  } else {
    for (const s of specs) {
      seccion.appendChild(await exhibit(s));
    }
  }
```

- [ ] **Step 3: Pasar columnas en `main.ts`**

Reemplazar la función `generarSeccionLayout` por:

```typescript
async function generarSeccionLayout(nodo: SceneNode, columnasRaw: number | undefined): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const columnas = Math.min(Math.max(columnasRaw ?? 1, 1), 4);
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo, specs, columnas);
  finalizar(frame, nodo);
}
```

Y en el dispatcher, reemplazar:

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo);
```

por:

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, msg.columnas);
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 97`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts src/plugin/main.ts
git commit -m "feat: Layout en N columnas segun el selector"
```

---

## Task 4: Selector "Columns" en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Agregar el select en `src/ui/index.html`**

Reemplazar la línea `<label><input type="checkbox" id="dark" /> Dark mode</label>` por:

```html
    <label><input type="checkbox" id="dark" /> Dark mode</label>
    <label>Columns <select id="columnas"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar el bloque de `nestedCheck`/`darkCheck` + `generar` por:

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, columnas: parseInt(columnasSelect.value, 10) } }, "*");
}
```

(El resto de `ui.ts` no cambia.)

- [ ] **Step 3: Subir el alto del panel en `main.ts`**

Reemplazar `figma.showUI(__html__, { width: 280, height: 360 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 380 });
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: selector Columns en la UI"
```

---

## Task 5: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame con varios frames con Auto Layout**

En Figma: un frame que contenga **varios** frames con Auto Layout (para tener varios exhibits, ej. 5–6).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que aparece el selector **"Columns"**.

- [ ] **Step 3: Caso feliz (multi-columna)**

Seleccionar el frame → elegir **Columns: 3** → "Layout & Spacing".
Expected: los exhibits se acomodan en **3 columnas parejas** (mismo ancho), con el artwork full-width arriba.
Panel: "✓ Generado".

- [ ] **Step 4: Probar 1 / 2 / 4 columnas**

- Columns: 1 → exhibits apilados verticalmente (como antes).
- Columns: 2 y 4 → 2 y 4 columnas parejas.

- [ ] **Step 5: Comparar contra la referencia del PRD y verificar el resto**

Abrir `prd-images/12. Multi-Column Layout/` y comparar. Verificar que las otras secciones siguen andando
(ignoran el selector). Anotar diferencias (Properties/Modes en columnas, reflow) como pulido.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Multi-column en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — UI, mensaje y cálculo puro | Task 1 (anchoContenedor + MensajeUI), Task 4 (select) |
| 2 — Helper enColumnas + Layout | Task 2 (enColumnas), Task 3 (generarLayout + main) |
| 3 — Errores y casos límite | Task 3 (clamp, columnas=1) |
| 4 — Testing | Task 1 (unit), Task 5 (manual) |
