# Layout and Spacing — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la feature Layout and Spacing (lista textual): detectar capas con Auto Layout y generar una sección con dirección, alineación, resizing, padding e item spacing de cada una; y reemplazar el disparo único de la UI por un selector de sección (Anatomy / Properties / Layout & Spacing).

**Architecture:** Reutiliza la infra de las rebanadas previas. Traversal pura `recorrerAutoLayout` (incluye la raíz, frena en instancias) y extracción pura `extraerLayout` (con traductores de alineación/resizing) sobre `NodoLike`. El generador `generadores/layout.ts` traduce `LayoutSpec[]` a frames. La UI pasa a tres botones y manda `{ tipo: "generar", seccion }`; `main.ts` ramifica por sección.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** Extiende `NodoLike` con campos de layout; agrega `LayoutSpec`, `Seccion`; cambia `MensajeUI` para incluir `seccion`. |
| `src/plugin/traversal/recorrer-autolayout.ts` | **Nuevo.** `recorrerAutoLayout(nodo)`: nodos con Auto Layout (incluida la raíz), frena en instancias. Lógica pura. |
| `src/plugin/extraccion/layout.ts` | **Nuevo.** `alineacion`, `resizing` (traductores) y `extraerLayout(raiz) → LayoutSpec[]`. Lógica pura. |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** `aNodoLike` captura además los campos de Auto Layout cuando el nodo los tiene. |
| `src/plugin/generadores/layout.ts` | **Nuevo.** `generarLayout(nombre, specs)` construye la sección Layout and Spacing. Toca `figma.*`. |
| `src/ui/index.html` | **Modificar.** Tres botones (Anatomy / Properties / Layout & Spacing). |
| `src/ui/ui.ts` | **Modificar.** Cada botón manda `{ tipo: "generar", seccion }`. |
| `src/plugin/main.ts` | **Modificar.** Ramifica por `seccion` (reemplaza la heurística set→Properties/else→Anatomy). |
| `tests/recorrer-autolayout.test.ts` | **Nuevo.** Tests de `recorrerAutoLayout`. |
| `tests/layout-traductores.test.ts` | **Nuevo.** Tests de `alineacion`/`resizing`. |
| `tests/layout-extraccion.test.ts` | **Nuevo.** Tests de `extraerLayout`. |

---

## Task 1: Tipos (extender NodoLike, LayoutSpec, Seccion, MensajeUI)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Extender `NodoLike` con los campos de layout**

En `src/plugin/modelo/tipos.ts`, dentro de la interfaz `NodoLike`, después de la línea `mainComponentName?: string;`, agregar:

```typescript
  // layout (solo en nodos con Auto Layout):
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN"
  counterAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "BASELINE"
  paddingLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
```

- [ ] **Step 2: Cambiar `MensajeUI` y agregar `Seccion`**

Reemplazar la línea `export type MensajeUI = { tipo: "generar" };` por:

```typescript
export type Seccion = "anatomy" | "properties" | "layout";

export type MensajeUI = { tipo: "generar"; seccion: Seccion };
```

- [ ] **Step 3: Agregar `LayoutSpec` al final del archivo**

```typescript
// --- Layout and Spacing ---

export interface LayoutSpec {
  elementoNombre: string;
  tipo: string;                  // FRAME, COMPONENT, etc.
  direccion: "HORIZONTAL" | "VERTICAL";
  alineacionPrimaria: string;    // "Start" | "Center" | "End" | "Space between"
  alineacionContraria: string;
  resizingHorizontal: string;    // "Fill" | "Hug" | "Fixed"
  resizingVertical: string;
  padding: { left: number; top: number; right: number; bottom: number };
  itemSpacing: number;
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`. (main.ts y ui.ts siguen compilando: main lee `msg.tipo`; ui usa `postMessage` sin tipar.)

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: tipos de Layout (NodoLike layout, LayoutSpec, Seccion, MensajeUI)"
```

---

## Task 2: `recorrerAutoLayout`

Devuelve los nodos con Auto Layout incluyendo la raíz; baja por contenedores; frena en instancias.

**Files:**
- Create: `tests/recorrer-autolayout.test.ts`
- Create: `src/plugin/traversal/recorrer-autolayout.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { recorrerAutoLayout } from "../src/plugin/traversal/recorrer-autolayout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("raíz con Auto Layout se incluye", () => {
  const raiz: NodoLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r"]);
});

test("raíz sin Auto Layout pero hijo con sí → solo el hijo", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["h"]);
});

test("frena en instancias (no entra a su contenido)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r"]);
});

test("frame anidado con Auto Layout se incluye además de la raíz", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "n", name: "Nested", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r", "n"]);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/traversal/recorrer-autolayout.ts"`.

- [ ] **Step 3: Implementar `src/plugin/traversal/recorrer-autolayout.ts`**

```typescript
import type { NodoLike } from "../modelo/tipos.ts";

const CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Devuelve los nodos con Auto Layout: incluye la raíz si la tiene, baja por
// los contenedores y frena en instancias (no documenta su layout interno).
export function recorrerAutoLayout(nodo: NodoLike): NodoLike[] {
  const resultado: NodoLike[] = [];
  if (tieneAutoLayout(nodo)) resultado.push(nodo);
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "INSTANCE") continue;
    if (CONTENEDOR.includes(hijo.type)) resultado.push(...recorrerAutoLayout(hijo));
  }
  return resultado;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 4 tests nuevos PASAN (34 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/recorrer-autolayout.test.ts src/plugin/traversal/recorrer-autolayout.ts
git commit -m "feat: recorrerAutoLayout (capas con Auto Layout, frena en instancias)"
```

---

## Task 3: Traductores `alineacion` y `resizing`

**Files:**
- Create: `tests/layout-traductores.test.ts`
- Create: `src/plugin/extraccion/layout.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { alineacion, resizing } from "../src/plugin/extraccion/layout.ts";

test("alineacion traduce los valores de Figma", () => {
  assert.equal(alineacion("MIN"), "Start");
  assert.equal(alineacion("CENTER"), "Center");
  assert.equal(alineacion("MAX"), "End");
  assert.equal(alineacion("SPACE_BETWEEN"), "Space between");
  assert.equal(alineacion("BASELINE"), "Baseline");
  assert.equal(alineacion(undefined), "Start");
});

test("resizing traduce los valores de Figma", () => {
  assert.equal(resizing("FILL"), "Fill");
  assert.equal(resizing("HUG"), "Hug");
  assert.equal(resizing("FIXED"), "Fixed");
  assert.equal(resizing(undefined), "Fixed");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/extraccion/layout.ts"`.

- [ ] **Step 3: Crear `src/plugin/extraccion/layout.ts` con los traductores**

```typescript
// Traduce el valor de alineación de Figma a texto legible.
export function alineacion(valor: string | undefined): string {
  switch (valor) {
    case "CENTER": return "Center";
    case "MAX": return "End";
    case "SPACE_BETWEEN": return "Space between";
    case "BASELINE": return "Baseline";
    default: return "Start"; // "MIN" y ausentes
  }
}

// Traduce el valor de resizing de Figma a texto legible.
export function resizing(valor: string | undefined): string {
  switch (valor) {
    case "FILL": return "Fill";
    case "HUG": return "Hug";
    default: return "Fixed"; // "FIXED" y ausentes
  }
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (36 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/layout-traductores.test.ts src/plugin/extraccion/layout.ts
git commit -m "feat: traductores de alineacion y resizing de layout"
```

---

## Task 4: `extraerLayout`

Combina la traversal y los traductores: nodo raíz → `LayoutSpec[]`.

**Files:**
- Create: `tests/layout-extraccion.test.ts`
- Modify: `src/plugin/extraccion/layout.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerLayout } from "../src/plugin/extraccion/layout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("arma un LayoutSpec completo desde un nodo con Auto Layout", () => {
  const raiz: NodoLike = {
    id: "r", name: "Card", type: "FRAME",
    layoutMode: "VERTICAL",
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "MIN",
    paddingLeft: 16, paddingTop: 8, paddingRight: 16, paddingBottom: 8,
    itemSpacing: 12,
    layoutSizingHorizontal: "FILL",
    layoutSizingVertical: "HUG",
    children: [],
  };
  const specs = extraerLayout(raiz);
  assert.equal(specs.length, 1);
  assert.deepEqual(specs[0], {
    elementoNombre: "Card",
    tipo: "FRAME",
    direccion: "VERTICAL",
    alineacionPrimaria: "Center",
    alineacionContraria: "Start",
    resizingHorizontal: "Fill",
    resizingVertical: "Hug",
    padding: { left: 16, top: 8, right: 16, bottom: 8 },
    itemSpacing: 12,
  });
});

test("padding e itemSpacing ausentes → 0", () => {
  const raiz: NodoLike = { id: "r", name: "Row", type: "FRAME", layoutMode: "HORIZONTAL", children: [] };
  const specs = extraerLayout(raiz);
  assert.deepEqual(specs[0].padding, { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(specs[0].itemSpacing, 0);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `extraerLayout is not a function` / export no encontrado.

- [ ] **Step 3: Agregar `extraerLayout` a `src/plugin/extraccion/layout.ts`**

Agregar al inicio del archivo los imports, y al final la función:

```typescript
import type { NodoLike, LayoutSpec } from "../modelo/tipos.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
```

```typescript
// Produce un LayoutSpec por cada capa con Auto Layout de la selección.
export function extraerLayout(raiz: NodoLike): LayoutSpec[] {
  return recorrerAutoLayout(raiz).map((nodo) => ({
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
  }));
}
```

(El bloque `import type` va arriba de todo en el archivo; la función `extraerLayout` va al final, debajo de `alineacion` y `resizing`.)

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (38 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/layout-extraccion.test.ts src/plugin/extraccion/layout.ts
git commit -m "feat: extraerLayout (NodoLike -> LayoutSpec[])"
```

---

## Task 5: Adaptador captura los campos de Auto Layout

`aNodoLike` debe leer los campos de layout de los nodos que los tienen, para alimentar la extracción.

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Agregar la captura de layout en `aNodoLike`**

En `src/plugin/extraccion/adaptador.ts`, justo antes de la línea `if ("children" in nodo) {`, agregar:

```typescript
  if ("layoutMode" in nodo && nodo.layoutMode !== "NONE") {
    base.layoutMode = nodo.layoutMode;
    base.primaryAxisAlignItems = nodo.primaryAxisAlignItems;
    base.counterAxisAlignItems = nodo.counterAxisAlignItems;
    base.paddingLeft = nodo.paddingLeft;
    base.paddingTop = nodo.paddingTop;
    base.paddingRight = nodo.paddingRight;
    base.paddingBottom = nodo.paddingBottom;
    base.itemSpacing = nodo.itemSpacing;
    if ("layoutSizingHorizontal" in nodo) base.layoutSizingHorizontal = nodo.layoutSizingHorizontal;
    if ("layoutSizingVertical" in nodo) base.layoutSizingVertical = nodo.layoutSizingVertical;
  }
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Verificar que los tests siguen verdes**

Run: `npm test`
Expected: `pass 38`, `fail 0`.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador captura campos de Auto Layout"
```

---

## Task 6: Generador de Layout and Spacing

**Files:**
- Create: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Implementar `src/plugin/generadores/layout.ts`**

```typescript
import type { LayoutSpec } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

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

// Genera el output de Layout and Spacing. Devuelve el frame Specifications.
export async function generarLayout(nombre: string, specs: LayoutSpec[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

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

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: generador de Layout and Spacing (exhibit por capa)"
```

---

## Task 7: UI con tres botones (selector de sección)

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Reemplazar `src/ui/index.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <button id="anatomy">Anatomy</button>
    <button id="properties">Properties</button>
    <button id="layout">Layout &amp; Spacing</button>
    <p id="estado"></p>
    <script src="ui.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Reemplazar `src/ui/ui.ts`**

```typescript
const estado = document.getElementById("estado") as HTMLParagraphElement;

function generar(seccion: "anatomy" | "properties" | "layout"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion } }, "*");
}

(document.getElementById("anatomy") as HTMLButtonElement).onclick = () => generar("anatomy");
(document.getElementById("properties") as HTMLButtonElement).onclick = () => generar("properties");
(document.getElementById("layout") as HTMLButtonElement).onclick = () => generar("layout");

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Generado" : "Error: " + msg.error;
  }
};
```

- [ ] **Step 3: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts
git commit -m "feat: UI con selector de seccion (Anatomy/Properties/Layout)"
```

---

## Task 8: Orquestación en main.ts (ramificar por sección)

**Files:**
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Reemplazar `src/plugin/main.ts`**

```typescript
import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties } from "./generadores/properties.ts";
import { extraerLayout } from "./extraccion/layout.ts";
import { generarLayout } from "./generadores/layout.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 220 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

// Construye el SetNorm para la extracción pura a partir del Component Set real.
function normalizarSet(componentSet: ComponentSetNode): SetNorm {
  const propiedades: Record<string, string[]> = {};
  const grupos = componentSet.variantGroupProperties;
  for (const nombre of Object.keys(grupos)) {
    propiedades[nombre] = grupos[nombre].values;
  }
  const variantes = componentSet.children
    .filter((c): c is ComponentNode => c.type === "COMPONENT")
    .map((c) => ({ variantProperties: c.variantProperties ?? {}, raiz: aNodoLike(c) }));
  const defaultProps = componentSet.defaultVariant?.variantProperties ?? {};
  return { propiedades, variantes, defaultProps };
}

async function generarSeccionAnatomy(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  const frame = await generarAnatomy(nodo, elementos);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionProperties(nodo: SceneNode): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Properties necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const specs = extraerProperties(setNorm);
  const frame = await generarProperties(componentSet, specs, setNorm.defaultProps);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionLayout(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo.name, specs);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná algo para generar specs." });
    return;
  }

  const nodo = seleccion[0];
  try {
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo);
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo);
    else await generarSeccionLayout(nodo);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 4: Verificar que todos los tests siguen verdes**

Run: `npm test`
Expected: `pass 38`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: orquestacion por seccion (anatomy/properties/layout)"
```

---

## Task 9: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame de prueba**

En Figma, crear un FRAME con **Auto Layout** (dirección vertical, padding ej. 16, item spacing ej. 12, con un par de hijos) que contenga además un **frame interno con su propio Auto Layout** (ej. horizontal). Así hay al menos dos exhibits.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que el panel muestra **tres botones**.

- [ ] **Step 3: Caso feliz (Layout)**

Seleccionar el frame de prueba → botón **"Layout & Spacing"**.
Expected: aparece `Specifications → [Nombre] Spec → Layout and Spacing`, con un exhibit por cada frame con Auto Layout, mostrando Direction, Alignment, Resizing, Padding e Item spacing. Los valores coinciden con el panel Design de Figma. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/3. Layout and Spacing/` y comparar la lista de atributos. Anotar diferencias (overlays de color, íconos) como pulido para la rebanada siguiente — NO arreglarlas ahora.

- [ ] **Step 5: Verificar que Anatomy y Properties siguen funcionando**

- Seleccionar un frame común → botón **"Anatomy"** → Expected: genera Anatomy.
- Seleccionar un Component Set con variantes → botón **"Properties"** → Expected: genera Properties.
- Seleccionar un frame **sin** Auto Layout → botón "Layout & Spacing" → Expected: sección con "No se detectaron capas con Auto Layout."

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Layout and Spacing en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Detección y modelo de datos | Task 1 (tipos), Task 2 (recorrerAutoLayout), Task 5 (adaptador) |
| 2 — Extracción y traducción | Task 3 (traductores), Task 4 (extraerLayout) |
| 3 — Output visual y disparador UI | Task 6 (generador), Task 7 (UI), Task 8 (main por sección) |
| 4 — Errores y casos límite | Task 6 (sin Auto Layout), Task 8 (validación/try-catch) |
| 5 — Testing | Tasks 2–4 (unit), Task 9 (manual) |
