# Custom Spacing Format (px/rem) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un selector "Units" (px / rem) que cambia la unidad de los valores de longitud: padding e item spacing (Layout) y width (Anatomy).

**Architecture:** `formatearEspaciado` (pura) convierte un número px al formato elegido. `espaciado.ts` guarda la unidad actual (estado de módulo, como `color.ts`); `main` la setea antes de generar y `atributos`/`layout` la leen. Default px = output idéntico al de hoy.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `Unidad` + `MensajeUI` suma `unidad?`. |
| `src/plugin/utils/espaciado.ts` | **Nuevo.** `formatearEspaciado` + estado de la unidad. |
| `src/plugin/utils/atributos.ts` | **Modificar.** `width` usa la unidad. |
| `src/plugin/generadores/layout.ts` | **Modificar.** padding + item spacing usan la unidad. |
| `src/plugin/main.ts` | **Modificar.** `aplicarUnidad` antes de generar. |
| `src/ui/index.html` | **Modificar.** `<select id="unidad">`. |
| `src/ui/ui.ts` | **Modificar.** Manda `unidad`. |
| `tests/espaciado.test.ts` | **Nuevo.** Tests de `formatearEspaciado`. |

---

## Task 1: `Unidad` + `formatearEspaciado` (puro) + estado

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/espaciado.test.ts`
- Create: `src/plugin/utils/espaciado.ts`

- [ ] **Step 1: Agregar `Unidad` y `unidad?` en `tipos.ts`**

Antes de `export type MensajeUI`, agregar:

```typescript
export type Unidad = "px" | "rem";
```

Y reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor; unidad?: Unidad };
```

- [ ] **Step 2: Escribir el test que falla**

Crear `tests/espaciado.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { formatearEspaciado } from "../src/plugin/utils/espaciado.ts";

test("formatearEspaciado en px y rem", () => {
  assert.equal(formatearEspaciado(8, "px"), "8");
  assert.equal(formatearEspaciado(8, "rem"), "0.5rem");
  assert.equal(formatearEspaciado(16, "rem"), "1rem");
  assert.equal(formatearEspaciado(24, "rem"), "1.5rem");
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/espaciado.ts"`.

- [ ] **Step 4: Crear `src/plugin/utils/espaciado.ts`**

```typescript
import type { Unidad } from "../modelo/tipos.ts";

// Formatea un valor en px al formato elegido (px = número pelado; rem = n/16).
export function formatearEspaciado(n: number, unidad: Unidad): string {
  return unidad === "rem" ? `${n / 16}rem` : String(n);
}

let unidad: Unidad = "px";

// Setea la unidad actual (default px).
export function aplicarUnidad(u: Unidad): void {
  unidad = u;
}

// Devuelve la unidad actual.
export function unidadActual(): Unidad {
  return unidad;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: 1 test nuevo PASA (104 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/espaciado.test.ts src/plugin/utils/espaciado.ts
git commit -m "feat: Unidad + formatearEspaciado (px/rem)"
```

---

## Task 2: Aplicar la unidad en width, Layout y main

**Files:**
- Modify: `src/plugin/utils/atributos.ts`
- Modify: `src/plugin/generadores/layout.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: `atributos.ts` — el atributo `width` usa la unidad**

Agregar el import al inicio:

```typescript
import { formatearEspaciado, unidadActual } from "./espaciado.ts";
```

Y reemplazar:

```typescript
    atributos.push({ clave: "width", valor: String(nodo.width), formato: "HARDCODED" });
```

por:

```typescript
    atributos.push({ clave: "width", valor: formatearEspaciado(nodo.width, unidadActual()), formato: "HARDCODED" });
```

- [ ] **Step 2: `layout.ts` — padding + item spacing usan la unidad**

Agregar el import al inicio:

```typescript
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";
```

Y reemplazar, dentro de `exhibit`:

```typescript
  const p = spec.padding;
  fila.appendChild(await texto(`Padding: L${p.left} T${p.top} R${p.right} B${p.bottom}`, 12));
  fila.appendChild(await texto(`Item spacing: ${spec.itemSpacing}`, 12));
```

por:

```typescript
  const p = spec.padding;
  const E = (n: number) => formatearEspaciado(n, unidadActual());
  fila.appendChild(await texto(`Padding: L${E(p.left)} T${E(p.top)} R${E(p.right)} B${E(p.bottom)}`, 12));
  fila.appendChild(await texto(`Item spacing: ${E(spec.itemSpacing)}`, 12));
```

- [ ] **Step 3: `main.ts` — setear la unidad antes de generar**

Agregar el import (junto a los otros imports de utils):

```typescript
import { aplicarUnidad } from "./utils/espaciado.ts";
```

En el handler `figma.ui.onmessage`, después de la línea `aplicarFormatoColor(msg.formatoColor ?? "HEX");`, agregar:

```typescript
  aplicarUnidad(msg.unidad ?? "px");
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 104`, `fail 0` (los tests de `width` siguen verdes porque el default es px).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/atributos.ts src/plugin/generadores/layout.ts src/plugin/main.ts
git commit -m "feat: width/padding/item-spacing usan la unidad elegida"
```

---

## Task 3: Selector "Units" en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar el select en `src/ui/index.html`**

Reemplazar la línea del select de Color
(`<label>Color <select id="formatoColor">...</select></label>`) por la misma seguida del nuevo select:

```html
    <label>Color <select id="formatoColor"><option>HEX</option><option>RGB</option><option>HSL</option></select></label>
    <label>Units <select id="unidad"><option>px</option><option>rem</option></select></label>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar el bloque de los `const ...`/`generar` por (agregando `unidadSelect` y el campo `unidad`):

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;
const formatoColorSelect = document.getElementById("formatoColor") as HTMLSelectElement;
const unidadSelect = document.getElementById("unidad") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value } }, "*");
}
```

- [ ] **Step 3: Subir el alto del panel en `main.ts`**

Reemplazar `figma.showUI(__html__, { width: 280, height: 420 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 440 });
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: selector Units en la UI"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar el selector **"Units"** (px / rem).

- [ ] **Step 2: Caso feliz (rem)**

Seleccionar un frame con **Auto Layout** (padding e item spacing) → **Units: rem** → "Layout & Spacing".
Expected: el padding y el item spacing salen en `Xrem` (n/16). En "Anatomy", el `width` también en rem.
Panel: "✓ Generado".

- [ ] **Step 3: px (default)**

Units: px → "Layout"/"Anatomy" → los valores salen como números pelados, igual que antes.

- [ ] **Step 4: Verificar que el resto sigue**

Las otras secciones y los demás selectores/toggles (Color, Columns, Dark, Tabular) funcionan igual.

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Custom Spacing en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Selector, tipo y formato puro | Task 1 (Unidad + formatearEspaciado), Task 3 (select) |
| 2 — Aplicar la unidad | Task 2 (atributos + layout + main) |
| 3 — Errores y casos límite | Task 2 (default px) |
| 4 — Testing | Task 1 (unit), Task 4 (manual) |
