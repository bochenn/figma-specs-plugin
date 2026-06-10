# Variables en Styling Inventory — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la tabla Variables (de color, fill + stroke, con color chip) a Styling Inventory, con prioridad variable > style.

**Architecture:** El recolector (`inventario/recolectar.ts`) emite entradas `variable` con su `swatchHex` (prioridad variable > style); la agrupación arrastra el swatch. El generador dibuja la tercera tabla con un chip en la celda Name. Se extrae `hexARgb` a `utils/color.ts` (hoy local en Anatomy).

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `EntradaEstilo`/`FilaInventario`: `tabla` suma `"variable"`; ambos suman `swatchHex?`. |
| `src/plugin/utils/color.ts` | **Nuevo.** `hexARgb(hex) → RGB`. Pura. |
| `src/plugin/generadores/anatomy.ts` | **Modificar.** Importa `hexARgb` desde `utils/color.ts` (borra el local). |
| `src/plugin/inventario/recolectar.ts` | **Modificar.** Emite entradas `variable` (prioridad variable > style) con `swatchHex`. |
| `src/plugin/inventario/agrupar.ts` | **Modificar.** `agruparInventario` arrastra `swatchHex`. |
| `src/plugin/generadores/styling.ts` | **Modificar.** Tres tablas (Variables/Color/Text); chip en la celda Name. |
| `tests/hex-a-rgb.test.ts` | **Nuevo.** Tests de `hexARgb`. |
| `tests/recolectar.test.ts` | **Modificar.** Agrega casos de variable. |
| `tests/agrupar-inventario.test.ts` | **Modificar.** Agrega caso de variable con swatchHex. |

---

## Task 1: Tipos (tabla "variable" + swatchHex)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Actualizar `EntradaEstilo` y `FilaInventario`**

Reemplazar las interfaces `EntradaEstilo` y `FilaInventario` por:

```typescript
export interface EntradaEstilo {
  tabla: "color" | "text" | "variable";
  nombre: string;       // nombre del estilo o variable
  appliedAs: string;    // "Background color" | "Text color" | "Border color" | "Text style"
  capa: string;         // nombre de la capa
  swatchHex?: string;   // color del chip (solo variables)
}

export interface FilaInventario {
  tabla: "color" | "text" | "variable";
  nombre: string;
  appliedAs: string;
  appliedTo: string;    // capas formateadas
  swatchHex?: string;   // color del chip (solo variables)
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: EntradaEstilo/FilaInventario con tabla variable y swatchHex"
```

---

## Task 2: Extraer `hexARgb` a un util compartido

**Files:**
- Create: `tests/hex-a-rgb.test.ts`
- Create: `src/plugin/utils/color.ts`
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { hexARgb } from "../src/plugin/utils/color.ts";

test("#FFFFFF → blanco", () => {
  assert.deepEqual(hexARgb("#FFFFFF"), { r: 1, g: 1, b: 1 });
});

test("#000000 → negro", () => {
  assert.deepEqual(hexARgb("#000000"), { r: 0, g: 0, b: 0 });
});

test("#FF0000 → rojo puro", () => {
  assert.deepEqual(hexARgb("#FF0000"), { r: 1, g: 0, b: 0 });
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/color.ts"`.

- [ ] **Step 3: Crear `src/plugin/utils/color.ts`**

```typescript
// Convierte "#RRGGBB" a RGB (canales 0..1).
export function hexARgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
```

- [ ] **Step 4: Borrar el `hexARgb` local de `anatomy.ts` e importarlo**

En `src/plugin/generadores/anatomy.ts`, reemplazar el bloque:

```typescript
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Convierte "#RRGGBB" a RGB (canales 0..1).
function hexARgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
```

por:

```typescript
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
import { hexARgb } from "../utils/color.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });
```

- [ ] **Step 5: Correr tests y verificar build**

Run: `npm test`
Expected: 3 tests nuevos PASAN (67 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 6: Commit**

```bash
git add tests/hex-a-rgb.test.ts src/plugin/utils/color.ts src/plugin/generadores/anatomy.ts
git commit -m "refactor: extraer hexARgb a utils/color.ts (compartido)"
```

---

## Task 3: `recolectarEstilos` emite entradas de variable

**Files:**
- Modify: `tests/recolectar.test.ts`
- Modify: `src/plugin/inventario/recolectar.ts`

- [ ] **Step 1: Agregar tests de variable a `tests/recolectar.test.ts`**

Antes de la última línea del archivo, agregar:

```typescript
test("fill con variable → entrada variable con swatchHex (prioridad sobre style)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Card", type: "FRAME",
    fillVariableName: "Color/Action", fillStyleName: "Surface",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    children: [],
  };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", capa: "Card", swatchHex: "#000000" },
  ]);
});

test("stroke con variable → entrada variable / Border color", () => {
  const raiz: NodoLike = {
    id: "r", name: "Box", type: "FRAME",
    strokeVariableName: "Color/Outline",
    strokes: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
    children: [],
  };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "variable", nombre: "Color/Outline", appliedAs: "Border color", capa: "Box", swatchHex: "#FFFFFF" },
  ]);
});

test("variable sin fill sólido → sin swatchHex", () => {
  const raiz: NodoLike = { id: "r", name: "Card", type: "FRAME", fillVariableName: "Color/Action", children: [] };
  const entradas = recolectarEstilos(raiz);
  assert.equal(entradas[0].tabla, "variable");
  assert.equal(entradas[0].swatchHex, undefined);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — la implementación vieja emite `color` (style) en vez de `variable`.

- [ ] **Step 3: Reescribir `emitir` en `src/plugin/inventario/recolectar.ts`**

Reemplazar el import y la función `emitir` por:

```typescript
import type { NodoLike, EntradaEstilo } from "../modelo/tipos.ts";
import { hexDeColor } from "../variables/modes.ts";

// Hex del primer paint SOLID de una lista, o undefined.
function hexSolido(paints: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }> | undefined): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? hexDeColor(p.color) : undefined;
}

// Emite las entradas de estilo/variable de un solo nodo (prioridad variable > style).
function emitir(nodo: NodoLike, entradas: EntradaEstilo[]): void {
  const appliedFill = nodo.type === "TEXT" ? "Text color" : "Background color";

  if (nodo.fillVariableName) {
    entradas.push({ tabla: "variable", nombre: nodo.fillVariableName, appliedAs: appliedFill, capa: nodo.name, swatchHex: hexSolido(nodo.fills) });
  } else if (nodo.fillStyleName) {
    entradas.push({ tabla: "color", nombre: nodo.fillStyleName, appliedAs: appliedFill, capa: nodo.name });
  }

  if (nodo.strokeVariableName) {
    entradas.push({ tabla: "variable", nombre: nodo.strokeVariableName, appliedAs: "Border color", capa: nodo.name, swatchHex: hexSolido(nodo.strokes) });
  } else if (nodo.strokeStyleName) {
    entradas.push({ tabla: "color", nombre: nodo.strokeStyleName, appliedAs: "Border color", capa: nodo.name });
  }

  if (nodo.textStyleName) {
    entradas.push({ tabla: "text", nombre: nodo.textStyleName, appliedAs: "Text style", capa: nodo.name });
  }
}
```

(Las funciones `visitar` y `recolectarEstilos` no cambian.)

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (70 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/recolectar.test.ts src/plugin/inventario/recolectar.ts
git commit -m "feat: recolectarEstilos emite entradas variable (prioridad variable > style)"
```

---

## Task 4: `agruparInventario` arrastra `swatchHex`

**Files:**
- Modify: `tests/agrupar-inventario.test.ts`
- Modify: `src/plugin/inventario/agrupar.ts`

- [ ] **Step 1: Agregar test de variable a `tests/agrupar-inventario.test.ts`**

Antes de la última línea del archivo, agregar:

```typescript
test("entradas variable con swatchHex → fila con swatchHex", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", capa: "A", swatchHex: "#0E68D4" },
    { tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", capa: "B", swatchHex: "#0E68D4" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 1);
  assert.deepEqual(filas[0], {
    tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", appliedTo: "A, B", swatchHex: "#0E68D4",
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — la fila no incluye `swatchHex`.

- [ ] **Step 3: Modificar `agruparInventario` en `src/plugin/inventario/agrupar.ts`**

Reemplazar la función `agruparInventario` por:

```typescript
// Agrupa las entradas por (tabla, nombre, appliedAs); cada combinación única
// es una fila, con las capas juntadas en "Applied to" y el swatchHex de la primera.
export function agruparInventario(entradas: EntradaEstilo[]): FilaInventario[] {
  const orden: string[] = [];
  const grupos = new Map<string, { tabla: "color" | "text" | "variable"; nombre: string; appliedAs: string; capas: string[]; swatchHex?: string }>();

  for (const e of entradas) {
    const clave = `${e.tabla}|${e.nombre}|${e.appliedAs}`;
    let grupo = grupos.get(clave);
    if (!grupo) {
      orden.push(clave);
      grupo = { tabla: e.tabla, nombre: e.nombre, appliedAs: e.appliedAs, capas: [], swatchHex: e.swatchHex };
      grupos.set(clave, grupo);
    }
    grupo.capas.push(e.capa);
  }

  return orden.map((clave) => {
    const g = grupos.get(clave)!;
    const fila: FilaInventario = { tabla: g.tabla, nombre: g.nombre, appliedAs: g.appliedAs, appliedTo: formatearAplicadoA(g.capas) };
    if (g.swatchHex) fila.swatchHex = g.swatchHex;
    return fila;
  });
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (71 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/agrupar-inventario.test.ts src/plugin/inventario/agrupar.ts
git commit -m "feat: agruparInventario arrastra swatchHex"
```

---

## Task 5: Tabla de Variables con chip en el generador

**Files:**
- Modify: `src/plugin/generadores/styling.ts`

- [ ] **Step 1: Reemplazar `src/plugin/generadores/styling.ts`**

```typescript
import type { FilaInventario } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
import { hexARgb } from "../utils/color.ts";

const COL_NAME = 280;
const COL_AS = 160;
const COL_TO = 280;
const CHIP = 12;

// Crea una celda de texto con ancho fijo y wrap.
async function celda(contenido: string, ancho: number): Promise<TextNode> {
  const t = await texto(contenido, 12);
  t.textAutoResize = "HEIGHT";
  t.resize(ancho, t.height);
  return t;
}

// Celda Name: con chip (variables) o solo texto. Ancho total ≈ COL_NAME.
async function celdaNombre(nombre: string, swatchHex: string | undefined): Promise<SceneNode> {
  if (!swatchHex) return await celda(nombre, COL_NAME);
  const cont = frameHorizontal("Name", 8);
  cont.counterAxisAlignItems = "CENTER";
  const chip = figma.createRectangle();
  chip.resize(CHIP, CHIP);
  chip.fills = [{ type: "SOLID", color: hexARgb(swatchHex) }];
  chip.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  chip.strokeWeight = 1;
  cont.appendChild(chip);
  cont.appendChild(await celda(nombre, COL_NAME - CHIP - 8));
  return cont;
}

// Fila de header (3 textos).
async function filaHeader(): Promise<FrameNode> {
  const f = frameHorizontal("Header", 16);
  f.appendChild(await celda("Name", COL_NAME));
  f.appendChild(await celda("Applied as", COL_AS));
  f.appendChild(await celda("Applied to", COL_TO));
  return f;
}

// Fila de datos: celda Name (con chip si hay) + applied as + applied to.
async function filaDatos(fila: FilaInventario): Promise<FrameNode> {
  const f = frameHorizontal("Fila", 16);
  f.appendChild(await celdaNombre(fila.nombre, fila.swatchHex));
  f.appendChild(await celda(fila.appliedAs, COL_AS));
  f.appendChild(await celda(fila.appliedTo, COL_TO));
  return f;
}

// Subsección con su tabla (o nota si no hay filas).
async function tabla(titulo: string, filas: FilaInventario[], vacio: string): Promise<FrameNode> {
  const sub = frameVertical(titulo, 16);
  sub.appendChild(await texto(titulo, 36));
  if (filas.length === 0) {
    sub.appendChild(await texto(vacio, 16));
    return sub;
  }
  const cuerpo = frameVertical("Tabla", 8);
  cuerpo.appendChild(await filaHeader());
  for (const f of filas) {
    cuerpo.appendChild(await filaDatos(f));
  }
  sub.appendChild(cuerpo);
  return sub;
}

// Genera el output de Styling Inventory con las tablas Variables, Color y Text styles.
export async function generarStyling(nombre: string, filas: FilaInventario[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Styling Inventory", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Styling Inventory", 48));

  seccion.appendChild(await tabla("Variables", filas.filter((f) => f.tabla === "variable"), "Sin variables"));
  seccion.appendChild(await tabla("Color styles", filas.filter((f) => f.tabla === "color"), "Sin color styles"));
  seccion.appendChild(await tabla("Text styles", filas.filter((f) => f.tabla === "text"), "Sin text styles"));

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 71`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/styling.ts
git commit -m "feat: tabla Variables con chip en Styling Inventory"
```

---

## Task 6: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame con variables, styles y text styles**

En Figma, dentro de un frame: capas con **variables de color** en fill y stroke, una capa con un **color
style**, y un texto con un **text style**.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Styling Inventory con Variables)**

Seleccionar el frame → botón **"Styling Inventory"**.
Expected: aparecen **tres tablas** (Variables, Color styles, Text styles). En **Variables**, cada fila
tiene un **chip** de color a la izquierda del nombre `Colección/Variable`, su Applied as y Applied to. La
prioridad se respeta: una capa con variable aparece en Variables (no en Color styles). El output se ubica a
la derecha del frame. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/5. Styling Inventory/` y comparar la tabla Variables con su chip. Anotar diferencias
(Token Studio, chip en Color styles) como pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Frame con styles pero **sin variables** → tabla Variables con "Sin variables"; las otras con datos.
- Anatomy / Properties / Layout / Data / Modes desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Variables en Styling Inventory"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Modelo y recolección | Task 1 (tipos), Task 3 (recolectar) |
| 2 — Tabla, chip, util | Task 2 (hexARgb), Task 4 (agrupar swatchHex), Task 5 (generador) |
| 3 — Errores y casos límite | Task 3 (sin sólido → sin chip), Task 5 (tabla vacía) |
| 4 — Testing | Tasks 2–4 (unit), Task 6 (manual) |
