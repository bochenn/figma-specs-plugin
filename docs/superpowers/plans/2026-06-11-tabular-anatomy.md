# Tabular Anatomy — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un checkbox "Tabular anatomy" que renderiza el contenido de Anatomy como tabla `# / Name / Type` en vez de la lista, dejando el artwork sin cambios.

**Architecture:** `filaAnatomy` (pura) mapea cada elemento a `[#, nombre, tipo]`. `tablaDe` (impure, en frames.ts) arma una tabla alineando columnas por ancho máximo. `specDeAnatomy` usa la tabla cuando el flag `tabla` está activo; el flag se propaga por `generarAnatomy`/`generarAnatomyConNested` desde `main`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `MensajeUI` suma `tabla?`. |
| `src/plugin/utils/tabla-anatomy.ts` | **Nuevo.** `HEADERS_ANATOMY` + `filaAnatomy`. Pura. |
| `src/plugin/generadores/frames.ts` | **Modificar.** `tablaDe(headers, filas)`. Toca `figma.*`. |
| `src/plugin/generadores/anatomy.ts` | **Modificar.** `specDeAnatomy`/`generarAnatomy`/`generarAnatomyConNested` con `tabla`. |
| `src/plugin/main.ts` | **Modificar.** `generarSeccionAnatomy(nodo, nested, tabla)`. |
| `src/ui/index.html` | **Modificar.** Checkbox "Tabular anatomy". |
| `src/ui/ui.ts` | **Modificar.** Manda `tabla`. |
| `tests/tabla-anatomy.test.ts` | **Nuevo.** Test de `filaAnatomy`. |

---

## Task 1: `filaAnatomy` (puro) + `MensajeUI` tabla

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/tabla-anatomy.test.ts`
- Create: `src/plugin/utils/tabla-anatomy.ts`

- [ ] **Step 1: Agregar `tabla?` a `MensajeUI`**

Reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean };
```

- [ ] **Step 2: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { filaAnatomy, HEADERS_ANATOMY } from "../src/plugin/utils/tabla-anatomy.ts";
import type { ElementoAnatomy } from "../src/plugin/modelo/tipos.ts";

test("filaAnatomy → [#, nombre, tipo]", () => {
  const el: ElementoAnatomy = { id: "1", nombre: "Label", tipo: "TEXT", esInstancia: false, atributos: [] };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Label", "TEXT"]);
});

test("HEADERS_ANATOMY son # / Name / Type", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type"]);
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/tabla-anatomy.ts"`.

- [ ] **Step 4: Crear `src/plugin/utils/tabla-anatomy.ts`**

```typescript
import type { ElementoAnatomy } from "../modelo/tipos.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type"];

// Mapea un elemento a una fila de la tabla de Anatomy.
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  return [String(numero), elemento.nombre, elemento.tipo];
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (101 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/tabla-anatomy.test.ts src/plugin/utils/tabla-anatomy.ts
git commit -m "feat: filaAnatomy + MensajeUI tabla"
```

---

## Task 2: Helper `tablaDe`

**Files:**
- Modify: `src/plugin/generadores/frames.ts`

- [ ] **Step 1: Agregar `tablaDe` al final de `src/plugin/generadores/frames.ts`**

```typescript
// Arma una tabla: text nodes de todas las celdas, alineadas fijando cada celda
// al ancho máximo de su columna (≥ su ancho natural → sin overflow). Header arriba.
export async function tablaDe(headers: string[], filas: string[][]): Promise<FrameNode> {
  const registros = [headers, ...filas];
  const ncols = headers.length;

  const celdas: TextNode[][] = [];
  for (const registro of registros) {
    const row: TextNode[] = [];
    for (let c = 0; c < ncols; c++) row.push(await texto(registro[c] ?? "", 14));
    celdas.push(row);
  }

  const maxW: number[] = [];
  for (let c = 0; c < ncols; c++) {
    let m = 0;
    for (const row of celdas) m = Math.max(m, row[c].width);
    maxW.push(m);
  }

  const cont = frameVertical("Table", 8);
  for (const row of celdas) {
    const filaFrame = frameHorizontal("Row", 24);
    for (let c = 0; c < ncols; c++) {
      filaFrame.appendChild(row[c]);
      row[c].layoutSizingHorizontal = "FIXED";
      row[c].resize(maxW[c], row[c].height);
    }
    cont.appendChild(filaFrame);
  }
  return cont;
}
```

(`frameVertical`, `frameHorizontal` y `texto` ya están definidos en este archivo.)

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 101`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/frames.ts
git commit -m "feat: tablaDe (tabla con columnas alineadas)"
```

---

## Task 3: `specDeAnatomy` con tabla + propagación + main

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Imports en `anatomy.ts`**

Reemplazar:

```typescript
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
```

por:

```typescript
import { frameVertical, frameHorizontal, texto, tablaDe } from "./frames.ts";
import { HEADERS_ANATOMY, filaAnatomy } from "../utils/tabla-anatomy.ts";
```

- [ ] **Step 2: `specDeAnatomy` recibe `tabla` y usa la tabla**

Reemplazar la firma de `specDeAnatomy`:

```typescript
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[]): Promise<FrameNode> {
```

por:

```typescript
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
```

Y reemplazar el bloque de la lista:

```typescript
  // Lista de contenido.
  const lista = frameVertical("Content", 16);
  display.appendChild(lista);
  if (elementos.length === 0) {
    lista.appendChild(await texto("Sin elementos detectados", 16));
  } else {
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i]));
    }
  }
```

por:

```typescript
  // Contenido: tabla o lista.
  if (elementos.length === 0) {
    display.appendChild(await texto("Sin elementos detectados", 16));
  } else if (tabla) {
    display.appendChild(await tablaDe(HEADERS_ANATOMY, elementos.map((e, i) => filaAnatomy(i + 1, e))));
  } else {
    const lista = frameVertical("Content", 16);
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i]));
    }
    display.appendChild(lista);
  }
```

- [ ] **Step 3: Propagar `tabla` en `generarAnatomy` y `generarAnatomyConNested`**

Reemplazar:

```typescript
// Genera el spec de Anatomy de un solo ítem. Devuelve el frame Specifications.
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Genera el spec del principal + un spec por cada instancia anidada.
export async function generarAnatomyConNested(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
  nested: { nodo: SceneNode; elementos: ElementoAnatomy[] }[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

por:

```typescript
// Genera el spec de Anatomy de un solo ítem. Devuelve el frame Specifications.
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Genera el spec del principal + un spec por cada instancia anidada.
export async function generarAnatomyConNested(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
  nested: { nodo: SceneNode; elementos: ElementoAnatomy[] }[],
  tabla: boolean,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos, tabla));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 4: `main.ts` — pasar `tabla` a Anatomy**

Reemplazar la firma de `generarSeccionAnatomy`:

```typescript
async function generarSeccionAnatomy(nodo: SceneNode, nested: boolean): Promise<void> {
```

por:

```typescript
async function generarSeccionAnatomy(nodo: SceneNode, nested: boolean, tabla: boolean): Promise<void> {
```

Y reemplazar las dos llamadas dentro de esa función:

```typescript
    frame = await generarAnatomyConNested(nodo, elementos, nestedSpecs);
```

por:

```typescript
    frame = await generarAnatomyConNested(nodo, elementos, nestedSpecs, tabla);
```

y

```typescript
    frame = await generarAnatomy(nodo, elementos);
```

por:

```typescript
    frame = await generarAnatomy(nodo, elementos, tabla);
```

En el dispatcher, reemplazar:

```typescript
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo, msg.nested ?? false);
```

por:

```typescript
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo, msg.nested ?? false, msg.tabla ?? false);
```

- [ ] **Step 5: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 101`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/anatomy.ts src/plugin/main.ts
git commit -m "feat: Anatomy tabular segun el toggle"
```

---

## Task 4: Checkbox "Tabular anatomy" en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Agregar el checkbox en `src/ui/index.html`**

Reemplazar la línea `<label><input type="checkbox" id="dark" /> Dark mode</label>` por:

```html
    <label><input type="checkbox" id="dark" /> Dark mode</label>
    <label><input type="checkbox" id="tabla" /> Tabular anatomy</label>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar el bloque de los `const ...Check`/`...Select` + `generar` por:

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10) } }, "*");
}
```

(El resto de `ui.ts` no cambia.)

- [ ] **Step 3: Subir el alto del panel en `main.ts`**

Reemplazar `figma.showUI(__html__, { width: 280, height: 380 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 400 });
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: checkbox Tabular anatomy en la UI"
```

---

## Task 5: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar el checkbox **"Tabular anatomy"**.

- [ ] **Step 2: Caso feliz (tabular on)**

Seleccionar un componente → **Tabular anatomy ON** → "Anatomy".
Expected: el contenido sale como **tabla alineada** `# / Name / Type` (header arriba, una fila por elemento),
con el **artwork** al lado, sin cambios. Panel: "✓ Generado".

- [ ] **Step 3: Tabular off**

Tabular anatomy OFF → "Anatomy" → la **lista** de siempre (con atributos/pills).

- [ ] **Step 4: Combinaciones**

- Tabular ON + Dark mode ON → tabla con texto claro y fondo oscuro.
- Tabular ON + Spec nested ON (con instancias anidadas) → cada spec (principal y nested) sale tabular.

- [ ] **Step 5: Verificar que el resto sigue**

Las otras secciones ignoran el checkbox y funcionan igual.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Tabular anatomy en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Toggle y mapeo puro | Task 1 (filaAnatomy + MensajeUI), Task 4 (checkbox) |
| 2 — Helper de tabla y aplicación | Task 2 (tablaDe), Task 3 (specDeAnatomy + propagación + main) |
| 3 — Errores y casos límite | Task 3 (sin elementos, propagación a nested) |
| 4 — Testing | Task 1 (unit), Task 5 (manual) |
