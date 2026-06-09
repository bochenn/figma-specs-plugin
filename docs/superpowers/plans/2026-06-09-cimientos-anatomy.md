# Cimientos + Anatomy — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar la infraestructura del plugin de Figma y la primera feature (Anatomy) generando output real en el canvas, de punta a punta.

**Architecture:** Plugin de Figma en TypeScript con dos mundos separados que se comunican por `postMessage`: el código del sandbox (`src/plugin/`, único con acceso a `figma.*`) y la UI en iframe (`src/ui/`). La lógica se parte en *traversal* (recorrer capas), *extracción* (nodos → datos planos, lógica pura testeable) y *generación* (datos → frames con Auto Layout). La validación vive solo en `main.ts`.

**Tech Stack:** TypeScript, esbuild (build), `@figma/plugin-typings` (tipos), `node --test` (tests de lógica pura). Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `manifest.json` | Metadata del plugin y entry points (`main`, `ui`). |
| `package.json` | Scripts de build/test y devDependencies. |
| `tsconfig.json` | Config de TypeScript (target ES2017, tipos de Figma). |
| `esbuild.config.mjs` | Compila `src/plugin/main.ts` → `dist/code.js` y embebe la UI en `dist/ui.html`. |
| `src/plugin/modelo/tipos.ts` | Interfaces del dominio: `ElementoAnatomy`, `Atributo`, `NodoLike`, y los mensajes `MensajeUI` / `MensajePlugin`. |
| `src/plugin/traversal/recorrer.ts` | Recorre un nodo y devuelve la lista plana de nodos-elemento; frena en instancias. Lógica pura. |
| `src/plugin/utils/atributos.ts` | Lee atributos visuales (background color, width, opacity) de un nodo. Lógica pura. |
| `src/plugin/extraccion/anatomy.ts` | Convierte nodos-elemento → `ElementoAnatomy[]`. Lógica pura. |
| `src/plugin/utils/marcadores.ts` | Calcula la posición de un marcador numerado proyectada al perímetro. Lógica pura. |
| `src/plugin/generadores/anatomy.ts` | Construye los frames del output con Auto Layout. Toca `figma.*`. |
| `src/plugin/main.ts` | Orquestador delgado: escucha mensajes, valida la selección, llama a los módulos, responde. |
| `src/ui/index.html` | Panel con botón "Generate" y zona de estado. |
| `src/ui/ui.ts` | Lógica del panel: manda/recibe mensajes. |
| `tests/recorrer.test.ts` | Tests de `recorrer.ts`. |
| `tests/atributos.test.ts` | Tests de `atributos.ts`. |
| `tests/anatomy-extraccion.test.ts` | Tests de `extraccion/anatomy.ts`. |
| `tests/marcadores.test.ts` | Tests de `utils/marcadores.ts`. |

**Nota sobre tests y tipos:** los módulos puros (`recorrer`, `atributos`, `extraccion`, `marcadores`) trabajan contra una interfaz mínima `NodoLike` definida por nosotros, NO contra los tipos globales de Figma. Eso permite alimentarlos con objetos de prueba en `node --test` sin cargar Figma. Los tests se ejecutan compilando TS a JS con esbuild a una carpeta temporal y corriéndolos con `node --test` (ver Task 2).

---

## Task 1: Scaffolding del proyecto (manifest, package, tsconfig)

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "figma-specs-plugin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "node esbuild.config.mjs",
    "watch": "node esbuild.config.mjs --watch",
    "test": "node esbuild.config.mjs --test && node --test dist-test/"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.100.0",
    "esbuild": "^0.24.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Crear `manifest.json`**

```json
{
  "name": "Specs Plugin",
  "id": "figma-specs-plugin-dev",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "capabilities": []
}
```

- [ ] **Step 3: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "typeRoots": ["./node_modules/@figma"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Instalar dependencias**

Run: `npm install`
Expected: crea `node_modules/` y `package-lock.json` sin errores.

- [ ] **Step 5: Commit**

```bash
git add package.json manifest.json tsconfig.json package-lock.json
git commit -m "chore: scaffolding del plugin (manifest, package, tsconfig)"
```

---

## Task 2: Build con esbuild (plugin + UI + tests)

El build hace tres cosas: compila el código del plugin, embebe la UI en un HTML, y (con `--test`) compila los tests a `dist-test/` para correrlos con `node --test`.

**Files:**
- Create: `esbuild.config.mjs`
- Create: `src/plugin/main.ts` (stub temporal)
- Create: `src/ui/index.html` (stub temporal)
- Create: `src/ui/ui.ts` (stub temporal)

- [ ] **Step 1: Crear stub `src/plugin/main.ts`**

```typescript
figma.showUI(__html__, { width: 280, height: 200 });

figma.ui.onmessage = (msg: { tipo: string }) => {
  if (msg.tipo === "generar") {
    figma.ui.postMessage({ tipo: "resultado", ok: true });
  }
};
```

- [ ] **Step 2: Crear stub `src/ui/index.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <button id="generar">Generate</button>
    <p id="estado"></p>
    <script src="ui.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Crear stub `src/ui/ui.ts`**

```typescript
const boton = document.getElementById("generar") as HTMLButtonElement;
const estado = document.getElementById("estado") as HTMLParagraphElement;

boton.onclick = () => {
  parent.postMessage({ pluginMessage: { tipo: "generar" } }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Generado" : "Error: " + msg.error;
  }
};
```

- [ ] **Step 4: Crear `esbuild.config.mjs`**

```javascript
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";

const watch = process.argv.includes("--watch");
const test = process.argv.includes("--test");

// Construye dist/ui.html: compila ui.ts y lo embebe inline en el HTML.
async function buildUI() {
  const out = await esbuild.build({
    entryPoints: ["src/ui/ui.ts"],
    bundle: true,
    write: false,
    format: "iife",
  });
  const js = out.outputFiles[0].text;
  let html = readFileSync("src/ui/index.html", "utf8");
  html = html.replace('<script src="ui.js"></script>', `<script>${js}</script>`);
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/ui.html", html);
}

// Construye dist/code.js (código del plugin).
async function buildPlugin() {
  await esbuild.build({
    entryPoints: ["src/plugin/main.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    format: "iife",
  });
}

// Compila los tests a dist-test/ para node --test.
// Lee dinámicamente los .test.ts que existan (en TDD aparecen de a uno).
// bundle:true → cada test arrastra sus imports y queda como un .js autónomo
// (node:test y node:assert quedan externos por ser builtins de Node).
async function buildTests() {
  const archivos = existsSync("tests")
    ? readdirSync("tests").filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`)
    : [];
  if (archivos.length === 0) {
    console.log("no hay tests todavía");
    return;
  }
  await esbuild.build({
    entryPoints: archivos,
    bundle: true,
    outdir: "dist-test",
    platform: "node",
    format: "cjs",
  });
}

if (test) {
  await buildTests();
} else if (watch) {
  const ctxPlugin = await esbuild.context({
    entryPoints: ["src/plugin/main.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    format: "iife",
  });
  await ctxPlugin.watch();
  await buildUI();
  console.log("watch activo (recargá el plugin en Figma tras cada cambio)");
} else {
  await buildPlugin();
  await buildUI();
  console.log("build OK → dist/code.js + dist/ui.html");
}
```

- [ ] **Step 5: Correr el build**

Run: `npm run build`
Expected: imprime "build OK → dist/code.js + dist/ui.html" y crea ambos archivos en `dist/`.

- [ ] **Step 6: Cargar el plugin en Figma y verificar el ida y vuelta**

En Figma Desktop: menú → Plugins → Development → Import plugin from manifest → elegir `manifest.json`. Correr el plugin, apretar "Generate".
Expected: el panel muestra "✓ Generado".

- [ ] **Step 7: Commit**

```bash
git add esbuild.config.mjs src/plugin/main.ts src/ui/index.html src/ui/ui.ts
git commit -m "build: esbuild para plugin, UI embebida y tests; stub end-to-end funcionando"
```

---

## Task 3: Modelo de tipos del dominio

**Files:**
- Create: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Crear `src/plugin/modelo/tipos.ts`**

```typescript
// Interfaz mínima de un nodo de Figma: solo lo que leen los módulos puros.
// Permite testear sin cargar la API real de Figma.
export interface NodoLike {
  id: string;
  name: string;
  type: string;
  children?: NodoLike[];
  // atributos visuales (opcionales según el tipo de nodo):
  width?: number;
  height?: number;
  opacity?: number;
  fills?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;
  // solo en instancias:
  mainComponentName?: string;
}

export interface Atributo {
  clave: string; // "background-color", "width", "opacity"
  valor: string; // valor legible: "#0E68D4", "240", "80%"
  formato: "HARDCODED" | "VARIABLE" | "STYLE";
}

export interface ElementoAnatomy {
  id: string;
  nombre: string;
  tipo: string; // NodeType de Figma: "FRAME" | "TEXT" | "INSTANCE" | ...
  esInstancia: boolean;
  dependeDe?: string; // "Depends on"
  atributos: Atributo[];
}

// Mensajes UI ↔ plugin.
export type MensajeUI = { tipo: "generar" };

export type MensajePlugin =
  | { tipo: "resultado"; ok: true }
  | { tipo: "resultado"; ok: false; error: string };
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: modelo de tipos del dominio (NodoLike, Atributo, ElementoAnatomy, mensajes)"
```

---

## Task 4: Traversal — recorrer capas

`recorrer(nodo)` devuelve la lista plana de nodos-elemento siguiendo la regla: shapes y textos son hojas; las instancias son elemento y NO se recorren sus hijos; frames y groups son elemento y además se recorren hacia adentro. El nodo raíz no se incluye a sí mismo, solo sus descendientes-elemento.

**Files:**
- Create: `tests/recorrer.test.ts`
- Create: `src/plugin/traversal/recorrer.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { recorrer } from "../src/plugin/traversal/recorrer.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

function nodo(parcial: Partial<NodoLike> & { id: string; type: string }): NodoLike {
  return { name: parcial.id, ...parcial };
}

test("itemiza textos y shapes como hojas, en orden de árbol", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({ id: "titulo", type: "TEXT" }),
      nodo({ id: "fondo", type: "RECTANGLE" }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["titulo", "fondo"]);
});

test("frena en instancias: la instancia es elemento pero sus hijos NO", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({
        id: "boton",
        type: "INSTANCE",
        children: [nodo({ id: "label-interno", type: "TEXT" })],
      }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["boton"]);
});

test("frames: son elemento y además se recorren hacia adentro", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({
        id: "grupo",
        type: "FRAME",
        children: [nodo({ id: "hijo", type: "TEXT" })],
      }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["grupo", "hijo"]);
});

test("nodo sin hijos devuelve lista vacía", () => {
  const raiz = nodo({ id: "raiz", type: "FRAME", children: [] });
  assert.deepEqual(recorrer(raiz), []);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`
Expected: FALLA con error de módulo no encontrado / `recorrer is not a function`.

- [ ] **Step 3: Implementar `src/plugin/traversal/recorrer.ts`**

```typescript
import type { NodoLike } from "../modelo/tipos.ts";

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Recorre los descendientes de un nodo y devuelve la lista plana de elementos.
// Regla del PRD: las instancias son elemento pero NO se itemizan sus hijos;
// los contenedores son elemento y además se recorren hacia adentro;
// el resto (textos, shapes) son hojas.
export function recorrer(nodo: NodoLike): NodoLike[] {
  const elementos: NodoLike[] = [];
  for (const hijo of nodo.children ?? []) {
    elementos.push(hijo);
    if (hijo.type !== TIPOS_INSTANCIA && TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo));
    }
  }
  return elementos;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test`
Expected: los 4 tests de `recorrer` PASAN.

- [ ] **Step 5: Commit**

```bash
git add tests/recorrer.test.ts src/plugin/traversal/recorrer.ts
git commit -m "feat: traversal de capas (frena en instancias, recorre contenedores)"
```

---

## Task 5: Lectura de atributos visuales

`leerAtributos(nodo)` devuelve los atributos visuales que un nodo expone: background color (del primer fill SOLID), width y opacity. Devuelve solo los presentes.

**Files:**
- Create: `tests/atributos.test.ts`
- Create: `src/plugin/utils/atributos.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("lee background color del primer fill SOLID como hex", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "#FFFFFF", formato: "HARDCODED" },
  );
});

test("incluye width cuando está presente", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "width"),
    { clave: "width", valor: "240", formato: "HARDCODED" },
  );
});

test("incluye opacity como porcentaje cuando es menor a 1", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 0.8 };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "opacity"),
    { clave: "opacity", valor: "80%", formato: "HARDCODED" },
  );
});

test("opacity 1 (totalmente opaco) no se incluye", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 1 };
  const attrs = leerAtributos(nodo);
  assert.equal(attrs.find((a) => a.clave === "opacity"), undefined);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`
Expected: FALLA con `leerAtributos is not a function`.

- [ ] **Step 3: Implementar `src/plugin/utils/atributos.ts`**

```typescript
import type { NodoLike, Atributo } from "../modelo/tipos.ts";

// Convierte un canal de color (0..1) a dos dígitos hex.
function canalHex(canal: number): string {
  return Math.round(canal * 255).toString(16).padStart(2, "0").toUpperCase();
}

function aHex(color: { r: number; g: number; b: number }): string {
  return "#" + canalHex(color.r) + canalHex(color.g) + canalHex(color.b);
}

// Lee los atributos visuales presentes en un nodo.
export function leerAtributos(nodo: NodoLike): Atributo[] {
  const atributos: Atributo[] = [];

  const fillSolido = nodo.fills?.find((f) => f.type === "SOLID" && f.color);
  if (fillSolido && fillSolido.color) {
    atributos.push({
      clave: "background-color",
      valor: aHex(fillSolido.color),
      formato: "HARDCODED",
    });
  }

  if (typeof nodo.width === "number") {
    atributos.push({ clave: "width", valor: String(nodo.width), formato: "HARDCODED" });
  }

  if (typeof nodo.opacity === "number" && nodo.opacity < 1) {
    atributos.push({
      clave: "opacity",
      valor: Math.round(nodo.opacity * 100) + "%",
      formato: "HARDCODED",
    });
  }

  return atributos;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test`
Expected: los 4 tests de `atributos` PASAN.

- [ ] **Step 5: Commit**

```bash
git add tests/atributos.test.ts src/plugin/utils/atributos.ts
git commit -m "feat: lectura de atributos visuales (background-color, width, opacity)"
```

---

## Task 6: Extracción — nodos a ElementoAnatomy

`extraerAnatomy(nodoRaiz)` combina traversal + lectura de atributos: recorre, y por cada nodo-elemento produce un `ElementoAnatomy` con nombre, tipo, si es instancia, `dependeDe` (para instancias) y atributos.

**Files:**
- Create: `tests/anatomy-extraccion.test.ts`
- Create: `src/plugin/extraccion/anatomy.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerAnatomy } from "../src/plugin/extraccion/anatomy.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("convierte un texto en ElementoAnatomy básico", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{ id: "t", name: "Título", type: "TEXT" }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.equal(elementos.length, 1);
  assert.deepEqual(elementos[0], {
    id: "t", nombre: "Título", tipo: "TEXT", esInstancia: false, atributos: [],
  });
});

test("marca instancia y resuelve dependeDe desde mainComponentName", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{ id: "b", name: "Botón", type: "INSTANCE", mainComponentName: "ESDSV Button" }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.equal(elementos[0].esInstancia, true);
  assert.equal(elementos[0].dependeDe, "ESDSV Button");
});

test("incluye atributos visuales del elemento", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{
      id: "fondo", name: "Fondo", type: "RECTANGLE", width: 100,
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.deepEqual(elementos[0].atributos, [
    { clave: "background-color", valor: "#000000", formato: "HARDCODED" },
    { clave: "width", valor: "100", formato: "HARDCODED" },
  ]);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`
Expected: FALLA con `extraerAnatomy is not a function`.

- [ ] **Step 3: Implementar `src/plugin/extraccion/anatomy.ts`**

```typescript
import type { NodoLike, ElementoAnatomy } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

// Recorre el nodo raíz y produce la lista de elementos de Anatomy.
export function extraerAnatomy(nodoRaiz: NodoLike): ElementoAnatomy[] {
  return recorrer(nodoRaiz).map((nodo) => {
    const esInstancia = nodo.type === "INSTANCE";
    const elemento: ElementoAnatomy = {
      id: nodo.id,
      nombre: nodo.name,
      tipo: nodo.type,
      esInstancia,
      atributos: leerAtributos(nodo),
    };
    if (esInstancia && nodo.mainComponentName) {
      elemento.dependeDe = nodo.mainComponentName;
    }
    return elemento;
  });
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test`
Expected: los 3 tests de extracción PASAN (y siguen pasando los anteriores).

- [ ] **Step 5: Commit**

```bash
git add tests/anatomy-extraccion.test.ts src/plugin/extraccion/anatomy.ts
git commit -m "feat: extraccion de Anatomy (nodos -> ElementoAnatomy)"
```

---

## Task 7: Posicionamiento de marcadores

`posicionMarcador(elemento, artwork)` toma la caja del elemento (x, y, width, height, relativa al artwork) y el tamaño del artwork, y devuelve la posición `{ x, y }` donde colocar el marcador, proyectada al perímetro priorizando el borde izquierdo. Regla: el marcador se ubica a la altura vertical del centro del elemento, pegado al borde izquierdo del artwork (un offset hacia afuera).

**Files:**
- Create: `tests/marcadores.test.ts`
- Create: `src/plugin/utils/marcadores.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { posicionMarcador, OFFSET_MARCADOR, TAM_MARCADOR } from "../src/plugin/utils/marcadores.ts";

test("ubica el marcador a la izquierda del artwork, centrado verticalmente con el elemento", () => {
  // elemento de alto 20 que empieza en y=40 → su centro vertical es 50
  const caja = { x: 30, y: 40, width: 100, height: 20 };
  const pos = posicionMarcador(caja);
  // x: pegado al borde izquierdo, empujado hacia afuera por OFFSET + tamaño del marcador
  assert.equal(pos.x, -(OFFSET_MARCADOR + TAM_MARCADOR));
  // y: centro del elemento (50) menos medio marcador
  assert.equal(pos.y, 50 - TAM_MARCADOR / 2);
});

test("dos elementos a distinta altura dan distinta y, misma x", () => {
  const a = posicionMarcador({ x: 0, y: 0, width: 10, height: 10 });
  const b = posicionMarcador({ x: 0, y: 100, width: 10, height: 10 });
  assert.equal(a.x, b.x);
  assert.notEqual(a.y, b.y);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`
Expected: FALLA con `posicionMarcador is not a function`.

- [ ] **Step 3: Implementar `src/plugin/utils/marcadores.ts`**

```typescript
export const TAM_MARCADOR = 24; // diámetro del círculo del marcador, en px
export const OFFSET_MARCADOR = 16; // separación entre el marcador y el borde del artwork

export interface Caja {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Calcula dónde colocar el marcador de un elemento: proyectado al borde
// izquierdo del artwork, centrado verticalmente con el elemento.
export function posicionMarcador(caja: Caja): { x: number; y: number } {
  const centroY = caja.y + caja.height / 2;
  return {
    x: -(OFFSET_MARCADOR + TAM_MARCADOR),
    y: centroY - TAM_MARCADOR / 2,
  };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test`
Expected: los 2 tests de marcadores PASAN.

- [ ] **Step 5: Commit**

```bash
git add tests/marcadores.test.ts src/plugin/utils/marcadores.ts
git commit -m "feat: posicionamiento de marcadores (proyeccion al borde izquierdo)"
```

---

## Task 8: Generador del output (frames con Auto Layout)

Construye los frames del output. Este módulo toca `figma.*`, así que NO tiene test unitario: se valida manualmente en Figma (Task 10). Recibe el nodo seleccionado real y la lista de `ElementoAnatomy` ya extraída.

**Files:**
- Create: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Implementar `src/plugin/generadores/anatomy.ts`**

```typescript
import type { ElementoAnatomy } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Crea un frame con Auto Layout vertical configurado.
function frameVertical(nombre: string, gap: number, padding = 0): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = padding;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un texto. fontSize en px; carga la fuente antes de escribir.
async function texto(contenido: string, fontSize: number): Promise<TextNode> {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.fontName = { family: "Inter", style: "Regular" };
  t.characters = contenido;
  t.fontSize = fontSize;
  return t;
}

// Construye la entrada de un elemento en la lista de contenido.
async function entradaLista(indice: number, el: ElementoAnatomy): Promise<FrameNode> {
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  fila.appendChild(await texto(`${indice}. ${el.nombre} · ${el.tipo}`, 16));
  if (el.dependeDe) {
    fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  }
  for (const attr of el.atributos) {
    fila.appendChild(await texto(`${attr.clave}: ${attr.valor}`, 12));
  }
  return fila;
}

// Crea un marcador numerado (círculo + número).
async function marcador(numero: number, x: number, y: number): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.4, b: 0.85 } }];

  const num = await texto(String(numero), 14);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];

  const cont = figma.createFrame();
  cont.name = `Marcador ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
  cont.appendChild(circulo);
  cont.appendChild(num);
  num.x = (TAM_MARCADOR - num.width) / 2;
  num.y = (TAM_MARCADOR - num.height) / 2;
  cont.x = x;
  cont.y = y;
  return cont;
}

// Genera el spec completo para un nodo y su lista de elementos.
// Devuelve el frame Specifications creado.
export async function generarAnatomy(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
): Promise<FrameNode> {
  // Contenedores principales.
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Anatomy", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Anatomy", 48));

  // Display horizontal: lista a la izquierda, artwork a la derecha.
  const display = figma.createFrame();
  display.name = "Display";
  display.layoutMode = "HORIZONTAL";
  display.itemSpacing = 64;
  display.primaryAxisSizingMode = "AUTO";
  display.counterAxisSizingMode = "AUTO";
  display.fills = [];
  seccion.appendChild(display);

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

  // Artwork: clon del seleccionado + marcadores.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
  display.appendChild(artwork);

  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);

  // Un marcador por elemento, posicionado por su caja relativa al clon.
  // Los hijos directos del clon comparten orden con los primeros elementos;
  // para la primera versión, ubicamos los marcadores por índice usando la
  // posición vertical distribuida del clon (suficiente para validar el flujo).
  for (let i = 0; i < elementos.length; i++) {
    const altura = elementos.length > 0 ? clon.height / elementos.length : 0;
    const caja = { x: 0, y: i * altura, width: clon.width, height: altura };
    const pos = posicionMarcador(caja);
    artwork.appendChild(await marcador(i + 1, pos.x, pos.y));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

> Nota de fidelidad: el posicionamiento de marcadores de esta versión distribuye verticalmente por índice (no usa la caja real de cada layer dentro del clon). Es suficiente para validar el flujo end-to-end. Mapear cada marcador a la caja exacta de su layer es una mejora de una rebanada posterior, registrada en "Fuera de alcance" del spec.

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: generador de Anatomy (frames con Auto Layout + marcadores)"
```

---

## Task 9: Orquestación en main.ts (validación + flujo real)

Reemplaza el stub de `main.ts` por el orquestador real: valida la selección, adapta el nodo de Figma a `NodoLike` para la extracción, llama al generador y responde a la UI.

**Files:**
- Modify: `src/plugin/main.ts` (reemplazo completo)
- Create: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Crear el adaptador `src/plugin/extraccion/adaptador.ts`**

El generador necesita el `SceneNode` real (para clonar), pero la extracción trabaja con `NodoLike`. Este adaptador convierte un `SceneNode` de Figma en `NodoLike` para alimentar la lógica pura.

```typescript
import type { NodoLike } from "../modelo/tipos.ts";

// Convierte un nodo real de Figma en NodoLike (solo lo que leen los módulos puros).
export function aNodoLike(nodo: SceneNode): NodoLike {
  const base: NodoLike = { id: nodo.id, name: nodo.name, type: nodo.type };

  if ("width" in nodo) base.width = nodo.width;
  if ("height" in nodo) base.height = nodo.height;
  if ("opacity" in nodo) base.opacity = nodo.opacity;
  if ("fills" in nodo && Array.isArray(nodo.fills)) {
    base.fills = nodo.fills.map((f) => ({
      type: f.type,
      color: f.type === "SOLID" ? f.color : undefined,
    }));
  }
  if (nodo.type === "INSTANCE") {
    const main = (nodo as InstanceNode).mainComponent;
    if (main) base.mainComponentName = main.name;
  }
  if ("children" in nodo) {
    base.children = nodo.children.map((c) => aNodoLike(c));
  }
  return base;
}
```

- [ ] **Step 2: Reemplazar `src/plugin/main.ts`**

```typescript
import type { MensajeUI, MensajePlugin } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 200 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná un componente, instancia o frame para generar specs." });
    return;
  }

  const nodo = seleccion[0];
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }

  try {
    const elementos = extraerAnatomy(aNodoLike(nodo));
    const specifications = await generarAnatomy(nodo, elementos);
    figma.viewport.scrollAndZoomIntoView([specifications]);
    if (seleccion.length > 1) {
      responder({ tipo: "resultado", ok: false, error: "Se generó para el primer elemento; la selección múltiple llega después." });
    } else {
      responder({ tipo: "resultado", ok: true });
    }
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: "build OK → dist/code.js + dist/ui.html".

- [ ] **Step 5: Commit**

```bash
git add src/plugin/main.ts src/plugin/extraccion/adaptador.ts
git commit -m "feat: orquestacion en main.ts (validacion, adaptador, flujo real)"
```

---

## Task 10: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un componente de prueba**

En un archivo de Figma, crear un FRAME (o COMPONENT) con Auto Layout que contenga: un texto (título), un rectángulo de fondo con color, y (si se puede) una instancia de otro componente adentro.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin (o "Run last plugin").

- [ ] **Step 3: Caso feliz**

Seleccionar el componente de prueba → correr el plugin → "Generate".
Expected: aparece un frame `Specifications` con `[Nombre] Spec` → `Anatomy` → lista de elementos a la izquierda (con nombre · tipo y atributos) y artwork clonado con marcadores numerados a la derecha. El panel muestra "✓ Generado". La numeración de la lista coincide con la de los marcadores.

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/1. anatomy/` y comparar estructura/jerarquía del output generado contra las imágenes. Anotar diferencias visuales (spacing, tipografía, layout) como ítems para rebanadas de pulido — NO arreglarlas ahora.

- [ ] **Step 5: Casos de error**

- Sin nada seleccionado → "Generate" → Expected: panel muestra "Seleccioná un componente, instancia o frame…".
- Seleccionar un texto suelto → "Generate" → Expected: panel muestra "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.".
- Seleccionar un frame vacío → "Generate" → Expected: spec generado con "Sin elementos detectados" en la lista.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Anatomy en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Estructura y build | Task 1, 2 |
| 2 — Flujo de comunicación | Task 2 (stub), Task 9 (real) |
| 3 — Modelo de datos y recorrido | Task 3, 4 |
| 4 — Generación visual (lista + artwork + marcadores) | Task 5, 6, 7, 8 |
| 5 — Manejo de errores y casos límite | Task 9, 10 |
| 6 — Testing (lógica pura + manual) | Task 4–7 (unit), Task 10 (manual) |
