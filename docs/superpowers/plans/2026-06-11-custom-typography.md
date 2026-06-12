# Custom Typography Format — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extraer la tipografía (family + style + size) de los nodos de texto y mostrarla como atributo `typography` en Anatomy, con un selector "Type" (Plain / CSS).

**Architecture:** El adaptador lee la fuente de los nodos TEXT a nuevos campos de `NodoLike`. `formatearTipografia` (pura) la formatea según el formato actual (estado de módulo, como color/spacing). `leerAtributos` agrega el atributo `typography`; `main` setea el formato antes de generar.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `NodoLike` suma fuente; `FormatoTipo` + `MensajeUI` suma `formatoTipo?`. |
| `src/plugin/utils/tipografia.ts` | **Nuevo.** `formatearTipografia` + estado del formato. |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** Lee la fuente de los nodos TEXT. |
| `src/plugin/utils/atributos.ts` | **Modificar.** `leerAtributos` agrega el atributo `typography`. |
| `src/plugin/main.ts` | **Modificar.** `aplicarFormatoTipo` antes de generar. |
| `src/ui/index.html` | **Modificar.** `<select id="formatoTipo">`. |
| `src/ui/ui.ts` | **Modificar.** Manda `formatoTipo`. |
| `tests/tipografia.test.ts` | **Nuevo.** Tests de `formatearTipografia` y del atributo `typography`. |

---

## Task 1: `NodoLike` fuente + `FormatoTipo` + `formatearTipografia` (puro)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/tipografia.test.ts`
- Create: `src/plugin/utils/tipografia.ts`

- [ ] **Step 1: `NodoLike` suma los campos de fuente**

En `src/plugin/modelo/tipos.ts`, dentro de `interface NodoLike`, después de la línea `textStyleName?: string;`, agregar:

```typescript
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
```

- [ ] **Step 2: `FormatoTipo` y `formatoTipo?` en `MensajeUI`**

Después de `export type Unidad = "px" | "rem";`, agregar:

```typescript
export type FormatoTipo = "Plain" | "CSS";
```

Y reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor; unidad?: Unidad };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor; unidad?: Unidad; formatoTipo?: FormatoTipo };
```

- [ ] **Step 3: Escribir el test que falla**

Crear `tests/tipografia.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { formatearTipografia } from "../src/plugin/utils/tipografia.ts";

test("formatearTipografia en Plain y CSS", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16 }, "Plain"), "Inter Regular 16");
  assert.equal(formatearTipografia({ family: "Inter", style: "Bold", size: 24 }, "CSS"), "24px Bold Inter");
});
```

- [ ] **Step 4: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/tipografia.ts"`.

- [ ] **Step 5: Crear `src/plugin/utils/tipografia.ts`**

```typescript
import type { FormatoTipo } from "../modelo/tipos.ts";

// Formatea la tipografía de un nodo según el formato elegido.
export function formatearTipografia(t: { family: string; style: string; size: number }, formato: FormatoTipo): string {
  if (formato === "CSS") return `${t.size}px ${t.style} ${t.family}`;
  return `${t.family} ${t.style} ${t.size}`;
}

let formato: FormatoTipo = "Plain";

// Setea el formato de tipografía actual (default Plain).
export function aplicarFormatoTipo(f: FormatoTipo): void {
  formato = f;
}

// Devuelve el formato de tipografía actual.
export function formatoTipoActual(): FormatoTipo {
  return formato;
}
```

- [ ] **Step 6: Correr para verificar que pasa**

Run: `npm test`
Expected: 1 test nuevo PASA (105 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 7: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/tipografia.test.ts src/plugin/utils/tipografia.ts
git commit -m "feat: NodoLike fuente + FormatoTipo + formatearTipografia"
```

---

## Task 2: Extracción de la fuente en el adaptador

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Leer la fuente de los nodos TEXT**

En `src/plugin/extraccion/adaptador.ts`, después del bloque del text style:

```typescript
  if ("textStyleId" in nodo && typeof nodo.textStyleId === "string" && nodo.textStyleId !== "") {
    const estilo = figma.getStyleById(nodo.textStyleId);
    if (estilo) base.textStyleName = estilo.name;
  }
```

agregar:

```typescript
  if (nodo.type === "TEXT") {
    const fn = nodo.fontName;
    if (fn !== figma.mixed) {
      base.fontFamily = fn.family;
      base.fontStyle = fn.style;
    }
    if (nodo.fontSize !== figma.mixed) base.fontSize = nodo.fontSize;
  }
```

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 105`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador lee la fuente de los nodos TEXT"
```

---

## Task 3: Atributo `typography` + main

**Files:**
- Modify: `tests/tipografia.test.ts`
- Modify: `src/plugin/utils/atributos.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Escribir el test que falla**

Al final de `tests/tipografia.test.ts`, agregar:

```typescript
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("leerAtributos agrega typography para nodos con fuente", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16 };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16");
});

test("leerAtributos no agrega typography sin fuente", () => {
  const nodo: NodoLike = { id: "f", name: "Frame", type: "FRAME" };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "typography"), undefined);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — el atributo `typography` no existe todavía (el `assert.ok(typo)` falla).

- [ ] **Step 3: `leerAtributos` agrega el atributo `typography`**

En `src/plugin/utils/atributos.ts`, agregar el import al inicio:

```typescript
import { formatearTipografia, formatoTipoActual } from "./tipografia.ts";
```

Y dentro de `leerAtributos`, antes de `return atributos;`, agregar:

```typescript
  if (nodo.fontFamily && typeof nodo.fontSize === "number") {
    atributos.push({
      clave: "typography",
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize }, formatoTipoActual()),
      formato: "HARDCODED",
    });
  }
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (107 en total).

- [ ] **Step 5: `main.ts` — setear el formato de tipografía antes de generar**

Agregar el import (junto a los otros imports de utils):

```typescript
import { aplicarFormatoTipo } from "./utils/tipografia.ts";
```

En el handler `figma.ui.onmessage`, después de la línea `aplicarUnidad(msg.unidad ?? "px");`, agregar:

```typescript
  aplicarFormatoTipo(msg.formatoTipo ?? "Plain");
```

- [ ] **Step 6: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 107`, `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add tests/tipografia.test.ts src/plugin/utils/atributos.ts src/plugin/main.ts
git commit -m "feat: atributo typography en leerAtributos y formato en main"
```

---

## Task 4: Selector "Type" en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar el select en `src/ui/index.html`**

Reemplazar la línea del select de Units
(`<label>Units <select id="unidad">...</select></label>`) por la misma seguida del nuevo select:

```html
    <label>Units <select id="unidad"><option>px</option><option>rem</option></select></label>
    <label>Type <select id="formatoTipo"><option>Plain</option><option>CSS</option></select></label>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar el bloque de los `const ...`/`generar` por (agregando `formatoTipoSelect` y el campo `formatoTipo`):

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;
const formatoColorSelect = document.getElementById("formatoColor") as HTMLSelectElement;
const unidadSelect = document.getElementById("unidad") as HTMLSelectElement;
const formatoTipoSelect = document.getElementById("formatoTipo") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value, formatoTipo: formatoTipoSelect.value } }, "*");
}
```

- [ ] **Step 3: Subir el alto del panel en `main.ts`**

Reemplazar `figma.showUI(__html__, { width: 280, height: 440 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 460 });
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: selector Type en la UI"
```

---

## Task 5: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar el selector **"Type"** (Plain / CSS).

- [ ] **Step 2: Caso feliz (Plain)**

Seleccionar un componente/frame con **texto** → **Type: Plain** → "Anatomy".
Expected: el elemento de texto muestra un atributo `typography` con `Family Style Size` (ej. `Inter Regular 16`).
Panel: "✓ Generado".

- [ ] **Step 3: CSS**

Type: CSS → "Anatomy" → el atributo sale como `16px Regular Inter`.

- [ ] **Step 4: Casos límite**

- Un texto con **estilos mixtos** (varios tamaños/fuentes en el mismo nodo) → no muestra `typography`.
- Un nodo no-texto → sin `typography` (como antes).

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Custom Typography en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Extracción de tipografía | Task 1 (NodoLike), Task 2 (adaptador) |
| 2 — Selector, tipo y formato puro | Task 1 (FormatoTipo + formatearTipografia), Task 4 (select) |
| 3 — Atributo de tipografía y main | Task 3 |
| 4 — Errores y casos límite | Task 3 (sin fuente), Task 5 (mixed) |
| 5 — Testing | Tasks 1 y 3 (unit), Task 5 (manual) |
