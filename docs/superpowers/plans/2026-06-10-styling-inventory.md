# Styling Inventory — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inventariar los Color styles y Text styles aplicados en la selección y generar dos tablas (Name / Applied as / Applied to), disparado por un quinto botón "Styling Inventory".

**Architecture:** El adaptador resuelve los `styleId` a nombres con `figma.getStyleById`. La recolección (`inventario/recolectar.ts`) y la agrupación (`inventario/agrupar.ts`) son puras sobre `NodoLike`. El generador `generadores/styling.ts` dibuja las dos tablas. La UI suma un botón; `main.ts` agrega la rama `styling`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** Extiende `NodoLike` con nombres de estilo; agrega `EntradaEstilo`, `FilaInventario`; suma `"styling"` a `Seccion`. |
| `src/plugin/inventario/recolectar.ts` | **Nuevo.** `recolectarEstilos(raiz) → EntradaEstilo[]`. Lógica pura. |
| `src/plugin/inventario/agrupar.ts` | **Nuevo.** `formatearAplicadoA`, `agruparInventario`. Lógica pura. |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** `aNodoLike` resuelve `fillStyleId`/`strokeStyleId`/`textStyleId` a nombres. |
| `src/plugin/generadores/styling.ts` | **Nuevo.** `generarStyling(nombre, filas)` dibuja las dos tablas. Toca `figma.*`. |
| `src/ui/index.html` | **Modificar.** Quinto botón "Styling Inventory". |
| `src/ui/ui.ts` | **Modificar.** Binding del botón styling. |
| `src/plugin/main.ts` | **Modificar.** Rama `styling`. |
| `tests/recolectar.test.ts` | **Nuevo.** Tests de `recolectarEstilos`. |
| `tests/formatear-aplicado.test.ts` | **Nuevo.** Tests de `formatearAplicadoA`. |
| `tests/agrupar-inventario.test.ts` | **Nuevo.** Tests de `agruparInventario`. |

---

## Task 1: Tipos (NodoLike estilos, EntradaEstilo, FilaInventario, sección styling)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Extender `NodoLike` con los nombres de estilo**

En la interfaz `NodoLike`, después de `layoutSizingVertical?: "FIXED" | "HUG" | "FILL";`, agregar:

```typescript
  // estilos resueltos (Styling Inventory):
  fillStyleName?: string;
  strokeStyleName?: string;
  textStyleName?: string;
```

- [ ] **Step 2: Sumar `"styling"` a `Seccion`**

Reemplazar `export type Seccion = "anatomy" | "properties" | "layout" | "data";` por:

```typescript
export type Seccion = "anatomy" | "properties" | "layout" | "data" | "styling";
```

- [ ] **Step 3: Agregar los tipos de inventario al final del archivo**

```typescript
// --- Styling Inventory ---

export interface EntradaEstilo {
  tabla: "color" | "text";
  nombre: string;       // nombre del estilo
  appliedAs: string;    // "Background color" | "Text color" | "Border color" | "Text style"
  capa: string;         // nombre de la capa
}

export interface FilaInventario {
  tabla: "color" | "text";
  nombre: string;
  appliedAs: string;
  appliedTo: string;    // capas formateadas
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: tipos de Styling Inventory (NodoLike estilos, EntradaEstilo, FilaInventario)"
```

---

## Task 2: `recolectarEstilos`

**Files:**
- Create: `tests/recolectar.test.ts`
- Create: `src/plugin/inventario/recolectar.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { recolectarEstilos } from "../src/plugin/inventario/recolectar.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("fill style en nodo no-TEXT → Background color", () => {
  const raiz: NodoLike = { id: "r", name: "Card", type: "FRAME", fillStyleName: "Surface", children: [] };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "color", nombre: "Surface", appliedAs: "Background color", capa: "Card" },
  ]);
});

test("fill style en TEXT → Text color; text style → Text style", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "t", name: "Label", type: "TEXT", fillStyleName: "OnSurface", textStyleName: "Body" }],
  };
  const entradas = recolectarEstilos(raiz);
  assert.deepEqual(entradas, [
    { tabla: "color", nombre: "OnSurface", appliedAs: "Text color", capa: "Label" },
    { tabla: "text", nombre: "Body", appliedAs: "Text style", capa: "Label" },
  ]);
});

test("stroke style → Border color", () => {
  const raiz: NodoLike = { id: "r", name: "Box", type: "FRAME", strokeStyleName: "Outline", children: [] };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "color", nombre: "Outline", appliedAs: "Border color", capa: "Box" },
  ]);
});

test("recorre descendientes y frena en instancias", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", fillStyleName: "A",
    children: [
      { id: "f", name: "Inner", type: "FRAME", fillStyleName: "B",
        children: [{ id: "x", name: "Deep", type: "TEXT", fillStyleName: "C" }] },
      { id: "i", name: "Btn", type: "INSTANCE", fillStyleName: "D",
        children: [{ id: "h", name: "Hidden", type: "TEXT", fillStyleName: "E" }] },
    ],
  };
  const nombres = recolectarEstilos(raiz).map((e) => e.nombre);
  // A (raíz), B (Inner), C (Deep), D (instancia sí); E NO (dentro de instancia)
  assert.deepEqual(nombres, ["A", "B", "C", "D"]);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/inventario/recolectar.ts"`.

- [ ] **Step 3: Implementar `src/plugin/inventario/recolectar.ts`**

```typescript
import type { NodoLike, EntradaEstilo } from "../modelo/tipos.ts";

// Emite las entradas de estilo de un solo nodo.
function emitir(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  if (nodo.fillStyleName) {
    entradas.push({
      tabla: "color",
      nombre: nodo.fillStyleName,
      appliedAs: nodo.type === "TEXT" ? "Text color" : "Background color",
      capa: nodo.name,
    });
  }
  if (nodo.strokeStyleName) {
    entradas.push({ tabla: "color", nombre: nodo.strokeStyleName, appliedAs: "Border color", capa: nodo.name });
  }
  if (nodo.textStyleName) {
    entradas.push({ tabla: "text", nombre: nodo.textStyleName, appliedAs: "Text style", capa: nodo.name });
  }
}

// Visita un nodo: emite sus estilos y baja por sus hijos, salvo en instancias.
function visitar(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  emitir(nodo, entradas);
  if (nodo.type === "INSTANCE") return;
  for (const hijo of nodo.children ?? []) {
    visitar(hijo, entradas);
  }
}

// Recolecta todas las entradas de estilo de la selección (raíz + descendientes).
export function recolectarEstilos(raiz: NodoLike): EntradaEstilo[] {
  const entradas: EntradaEstilo[] = [];
  visitar(raiz, entradas);
  return entradas;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 4 tests nuevos PASAN (46 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/recolectar.test.ts src/plugin/inventario/recolectar.ts
git commit -m "feat: recolectarEstilos (entradas de color/text styles, frena en instancias)"
```

---

## Task 3: `formatearAplicadoA`

**Files:**
- Create: `tests/formatear-aplicado.test.ts`
- Create: `src/plugin/inventario/agrupar.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { formatearAplicadoA } from "../src/plugin/inventario/agrupar.ts";

test("nombres distintos → separados por coma", () => {
  assert.equal(formatearAplicadoA(["Active indicator", "Caret"]), "Active indicator, Caret");
});

test("nombre repetido → cantidad entre paréntesis", () => {
  assert.equal(formatearAplicadoA(["label-text", "label-text"]), "label-text (2)");
});

test("mezcla → orden de primera aparición con conteos", () => {
  assert.equal(formatearAplicadoA(["a", "b", "a"]), "a (2), b");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/inventario/agrupar.ts"`.

- [ ] **Step 3: Crear `src/plugin/inventario/agrupar.ts` con `formatearAplicadoA`**

```typescript
import type { EntradaEstilo, FilaInventario } from "../modelo/tipos.ts";

// Junta nombres de capa separados por coma, en orden de primera aparición;
// los repetidos se muestran una vez con la cantidad entre paréntesis.
export function formatearAplicadoA(capas: string[]): string {
  const orden: string[] = [];
  const conteo = new Map<string, number>();
  for (const c of capas) {
    if (!conteo.has(c)) orden.push(c);
    conteo.set(c, (conteo.get(c) ?? 0) + 1);
  }
  return orden
    .map((c) => {
      const n = conteo.get(c) ?? 1;
      return n > 1 ? `${c} (${n})` : c;
    })
    .join(", ");
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (49 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/formatear-aplicado.test.ts src/plugin/inventario/agrupar.ts
git commit -m "feat: formatearAplicadoA (capas con conteo de repetidos)"
```

---

## Task 4: `agruparInventario`

**Files:**
- Create: `tests/agrupar-inventario.test.ts`
- Modify: `src/plugin/inventario/agrupar.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { agruparInventario } from "../src/plugin/inventario/agrupar.ts";
import type { EntradaEstilo } from "../src/plugin/modelo/tipos.ts";

test("mismo estilo + mismo appliedAs en dos capas → una fila", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Active indicator" },
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Caret" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 1);
  assert.deepEqual(filas[0], {
    tabla: "color", nombre: "Error", appliedAs: "Border color", appliedTo: "Active indicator, Caret",
  });
});

test("mismo estilo con distinto appliedAs → dos filas", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Error", appliedAs: "Background color", capa: "Alert" },
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Caret" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 2);
  assert.equal(filas[0].appliedAs, "Background color");
  assert.equal(filas[1].appliedAs, "Border color");
});

test("separa por tabla color/text", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Surface", appliedAs: "Background color", capa: "Card" },
    { tabla: "text", nombre: "Body", appliedAs: "Text style", capa: "Label" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.filter((f) => f.tabla === "color").length, 1);
  assert.equal(filas.filter((f) => f.tabla === "text").length, 1);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `agruparInventario is not a function` / export no encontrado.

- [ ] **Step 3: Agregar `agruparInventario` a `src/plugin/inventario/agrupar.ts`**

```typescript
// Agrupa las entradas por (tabla, nombre, appliedAs); cada combinación única
// es una fila, con las capas juntadas en "Applied to".
export function agruparInventario(entradas: EntradaEstilo[]): FilaInventario[] {
  const orden: string[] = [];
  const grupos = new Map<string, { tabla: "color" | "text"; nombre: string; appliedAs: string; capas: string[] }>();

  for (const e of entradas) {
    const clave = `${e.tabla}|${e.nombre}|${e.appliedAs}`;
    let grupo = grupos.get(clave);
    if (!grupo) {
      orden.push(clave);
      grupo = { tabla: e.tabla, nombre: e.nombre, appliedAs: e.appliedAs, capas: [] };
      grupos.set(clave, grupo);
    }
    grupo.capas.push(e.capa);
  }

  return orden.map((clave) => {
    const g = grupos.get(clave)!;
    return { tabla: g.tabla, nombre: g.nombre, appliedAs: g.appliedAs, appliedTo: formatearAplicadoA(g.capas) };
  });
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (52 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/agrupar-inventario.test.ts src/plugin/inventario/agrupar.ts
git commit -m "feat: agruparInventario (entradas -> filas de tabla)"
```

---

## Task 5: Adaptador resuelve nombres de estilo

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Agregar la resolución de estilos en `aNodoLike`**

En `src/plugin/extraccion/adaptador.ts`, justo antes de la línea `if ("children" in nodo) {`, agregar:

```typescript
  if ("fillStyleId" in nodo && typeof nodo.fillStyleId === "string" && nodo.fillStyleId !== "") {
    const estilo = figma.getStyleById(nodo.fillStyleId);
    if (estilo) base.fillStyleName = estilo.name;
  }
  if ("strokeStyleId" in nodo && typeof nodo.strokeStyleId === "string" && nodo.strokeStyleId !== "") {
    const estilo = figma.getStyleById(nodo.strokeStyleId);
    if (estilo) base.strokeStyleName = estilo.name;
  }
  if ("textStyleId" in nodo && typeof nodo.textStyleId === "string" && nodo.textStyleId !== "") {
    const estilo = figma.getStyleById(nodo.textStyleId);
    if (estilo) base.textStyleName = estilo.name;
  }
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Verificar que los tests siguen verdes**

Run: `npm test`
Expected: `pass 52`, `fail 0`.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador resuelve nombres de color/text styles"
```

---

## Task 6: Generador de Styling Inventory

**Files:**
- Create: `src/plugin/generadores/styling.ts`

- [ ] **Step 1: Implementar `src/plugin/generadores/styling.ts`**

```typescript
import type { FilaInventario } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const COL_NAME = 280;
const COL_AS = 160;
const COL_TO = 280;

// Crea una celda de texto con ancho fijo y wrap.
async function celda(contenido: string, ancho: number): Promise<TextNode> {
  const t = await texto(contenido, 12);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Crea una fila de 3 celdas.
async function fila(a: string, b: string, c: string): Promise<FrameNode> {
  const f = frameHorizontal("Fila", 16);
  f.appendChild(await celda(a, COL_NAME));
  f.appendChild(await celda(b, COL_AS));
  f.appendChild(await celda(c, COL_TO));
  return f;
}

// Construye una subsección con su tabla (o una nota si no hay filas).
async function tabla(titulo: string, filas: FilaInventario[], vacio: string): Promise<FrameNode> {
  const sub = frameVertical(titulo, 16);
  sub.appendChild(await texto(titulo, 36));
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  const cuerpo = frameVertical("Tabla", 8);
  cuerpo.appendChild(await fila("Name", "Applied as", "Applied to"));
  for (const f of filas) {
    cuerpo.appendChild(await fila(f.nombre, f.appliedAs, f.appliedTo));
  }
  sub.appendChild(cuerpo);
  return sub;
}

// Genera el output de Styling Inventory con las tablas Color styles y Text styles.
export async function generarStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Styling Inventory", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Styling Inventory", 48));

  seccion.appendChild(await tabla("Color styles", filas.filter((f) => f.tabla === "color"), "Sin color styles"));
  seccion.appendChild(await tabla("Text styles", filas.filter((f) => f.tabla === "text"), "Sin text styles"));

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/styling.ts
git commit -m "feat: generador de Styling Inventory (tablas Color/Text styles)"
```

---

## Task 7: Quinto botón en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Agregar el botón en `src/ui/index.html`**

Reemplazar la línea `<button id="data">Data (JSON)</button>` por:

```html
    <button id="data">Data (JSON)</button>
    <button id="styling">Styling Inventory</button>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Cambiar la firma de `generar`:

```typescript
function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling"): void {
```

Y después de la línea `(document.getElementById("data") as HTMLButtonElement).onclick = () => generar("data");`, agregar:

```typescript
(document.getElementById("styling") as HTMLButtonElement).onclick = () => generar("styling");
```

- [ ] **Step 3: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts
git commit -m "feat: quinto boton Styling Inventory en la UI"
```

---

## Task 8: Rama `styling` en main.ts

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
import { serializarAnatomy } from "./serializacion/anatomy-json.ts";
import { generarData } from "./generadores/data.ts";
import { recolectarEstilos } from "./inventario/recolectar.ts";
import { agruparInventario } from "./inventario/agrupar.ts";
import { generarStyling } from "./generadores/styling.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 260 });

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

async function generarSeccionData(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Data necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  const json = serializarAnatomy(elementos);
  const frame = await generarData(nodo.name, json);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionStyling(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Styling Inventory necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const filas = agruparInventario(recolectarEstilos(aNodoLike(nodo)));
  const frame = await generarStyling(nodo.name, filas);
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
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo);
    else if (msg.seccion === "data") await generarSeccionData(nodo);
    else await generarSeccionStyling(nodo);
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
Expected: `pass 52`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: rama styling en main (Styling Inventory)"
```

---

## Task 9: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar estilos y aplicarlos**

En Figma: crear un **color style** local (ej. "Brand/Primary") y un **text style** local (ej. "Body").
Aplicar el color style al fill de un par de frames/shapes y al stroke de alguno; aplicar el text style a
uno o dos textos. Meter todo dentro de un frame contenedor.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que el panel muestra **cinco botones**.

- [ ] **Step 3: Caso feliz (Styling Inventory)**

Seleccionar el frame contenedor → botón **"Styling Inventory"**.
Expected: aparece `Specifications → [Nombre] Spec → Styling Inventory` con dos subsecciones
(Color styles, Text styles), cada una con su tabla `Name | Applied as | Applied to`. Las capas con el
mismo estilo+appliedAs aparecen juntas en "Applied to". Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/5. Styling Inventory/` y comparar la estructura de las tablas. Anotar diferencias
(chip de color, tabla de Variables) como pulido para rebanadas siguientes — NO arreglarlas ahora.

- [ ] **Step 5: Verificar que los otros botones siguen funcionando y casos límite**

- Frame común → "Anatomy"; Component Set → "Properties"; frame con Auto Layout → "Layout & Spacing"; cualquiera → "Data (JSON)".
- Frame **sin estilos** → "Styling Inventory" → tablas con "Sin color styles" / "Sin text styles".

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Styling Inventory en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Captura y recolección | Task 1 (tipos), Task 2 (recolectar), Task 5 (adaptador) |
| 2 — Agrupación en filas | Task 3 (formatearAplicadoA), Task 4 (agruparInventario) |
| 3 — Tablas y disparador | Task 6 (generador), Task 7 (UI), Task 8 (main rama styling) |
| 4 — Errores y casos límite | Task 6 (tablas vacías), Task 8 (validación/try-catch) |
| 5 — Testing | Tasks 2–4 (unit), Task 9 (manual) |
