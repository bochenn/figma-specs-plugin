# Marcadores de Layout — Plan de Implementación (Rebanada 27)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar las anotaciones de Layout and Spacing: un artwork por contenedor con Auto Layout, con marcadores numéricos de padding/spacing, cotas azules de resizing (Fixed/Fill/Hug) e ícono de dirección, según `docs/superpowers/specs/2026-06-12-layout-markers-design.md`.

**Architecture:** La geometría nueva (posición y valor de cada marca, estilo de cota, elección de ícono) vive en funciones puras en `src/plugin/utils/marcadores-layout.ts`, testeadas con `node --test`. El generador `src/plugin/generadores/layout.ts` se reestructura: en vez de un clon único con todos los overlays, produce una fila artwork+exhibit por cada contenedor; el dibujo (rects, textos, SVGs) es impuro y se verifica a mano en Figma.

**Tech Stack:** TypeScript sin dependencias, API de plugins de Figma, `node --test` (corre los `.ts` directo), esbuild (`npm run build`).

**Nota sobre la spec:** la spec definía `marcasEjeX`/`marcasEjeY` recibiendo bandas ya clasificadas, pero `rectsPadding` devuelve rects sin etiquetar (y omite los de grosor 0), así que clasificarlos después es frágil. Se unifican en una sola función `marcasLayout(frame, padding, gaps, direccion, spacingAuto)` que recibe el padding crudo y los gaps de `rectsSpacing`, y devuelve `{ ejeX, ejeY }`. Misma matemática, API más robusta.

**Nota sobre Dark mode:** todas las anotaciones se dibujan **dentro** del artwork, cuyo fondo gris claro (`0.96`) es fijo e independiente del tema. Por eso los colores de marcadores son constantes y Dark mode no requiere cambios (se confirma en la verificación manual).

---

## Estructura de archivos

- **Modificar** `src/plugin/modelo/tipos.ts` — `NodoLike` += `layoutWrap`; `LayoutSpec` += `wrap`, `spacingAuto`.
- **Modificar** `src/plugin/extraccion/layout.ts` — `layoutSpecDe` completa los campos nuevos.
- **Crear** `src/plugin/utils/marcadores-layout.ts` — geometría pura de marcas, cotas e íconos.
- **Modificar** `src/plugin/generadores/layout.ts` — un artwork anotado por contenedor.
- **Modificar** `tests/layout-extraccion.test.ts` — campos nuevos.
- **Crear** `tests/marcadores-layout.test.ts` — tests de la geometría pura.

---

### Task 1: Modelo y extracción — `wrap` y `spacingAuto`

**Files:**
- Modify: `src/plugin/modelo/tipos.ts` (interfaces `NodoLike` y `LayoutSpec`)
- Modify: `src/plugin/extraccion/layout.ts:25-42`
- Test: `tests/layout-extraccion.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/layout-extraccion.test.ts`, actualizar el `assert.deepEqual` del primer test agregando los dos campos nuevos al objeto esperado:

```typescript
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
    wrap: false,
    spacingAuto: false,
  });
```

Y agregar al final del archivo:

```typescript
test("wrap y space between → wrap/spacingAuto true", () => {
  const raiz: NodoLike = {
    id: "r", name: "Tags", type: "FRAME",
    layoutMode: "HORIZONTAL",
    layoutWrap: "WRAP",
    primaryAxisAlignItems: "SPACE_BETWEEN",
    children: [],
  };
  const s = extraerLayout(raiz)[0];
  assert.equal(s.wrap, true);
  assert.equal(s.spacingAuto, true);
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/layout-extraccion.test.ts`
Expected: FAIL — el `deepEqual` no encuentra `wrap`/`spacingAuto` en el spec extraído.

- [ ] **Step 3: Implementar**

En `src/plugin/modelo/tipos.ts`, dentro de `NodoLike`, después de `itemSpacing?: number;` (línea 34):

```typescript
  layoutWrap?: "NO_WRAP" | "WRAP";
```

En `LayoutSpec`, después de `itemSpacing: number;`:

```typescript
  wrap: boolean;          // layoutWrap === "WRAP"
  spacingAuto: boolean;   // primaryAxisAlignItems === "SPACE_BETWEEN" → marcador "Auto"
```

En `src/plugin/extraccion/layout.ts`, en `layoutSpecDe`, después de `itemSpacing: nodo.itemSpacing ?? 0,`:

```typescript
    wrap: nodo.layoutWrap === "WRAP",
    spacingAuto: nodo.primaryAxisAlignItems === "SPACE_BETWEEN",
```

- [ ] **Step 4: Correr la suite completa y verificar que pasa**

Run: `node --test`
Expected: PASS (todos verdes; ningún otro test hace `deepEqual` de un `LayoutSpec` completo).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/extraccion/layout.ts tests/layout-extraccion.test.ts
git commit -m "feat: LayoutSpec con wrap y spacingAuto"
```

---

### Task 2: Geometría pura — `marcasLayout`

**Files:**
- Create: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/marcadores-layout.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { marcasLayout } from "../src/plugin/utils/marcadores-layout.ts";
import { aplicarUnidad } from "../src/plugin/utils/espaciado.ts";

test("padding asimétrico + gap horizontal → marcas en ambos ejes", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 8, right: 24, bottom: 0 };
  const gaps = [{ x: 60, y: 8, width: 12, height: 84 }];
  const { ejeX, ejeY } = marcasLayout(frame, padding, gaps, "HORIZONTAL", false);
  assert.deepEqual(ejeX, [
    { x: 8, desde: 0, hasta: 16, valor: "16", tipo: "padding" },
    { x: 188, desde: 176, hasta: 200, valor: "24", tipo: "padding" },
    { x: 66, desde: 60, hasta: 72, valor: "12", tipo: "spacing" },
  ]);
  assert.deepEqual(ejeY, [
    { y: 4, desde: 0, hasta: 8, valor: "8", tipo: "padding" },
  ]);
});

test("gaps verticales van al eje Y", () => {
  const frame = { x: 0, y: 0, width: 100, height: 200 };
  const padding = { left: 0, top: 0, right: 0, bottom: 0 };
  const gaps = [{ x: 0, y: 50, width: 100, height: 20 }];
  const { ejeX, ejeY } = marcasLayout(frame, padding, gaps, "VERTICAL", false);
  assert.deepEqual(ejeX, []);
  assert.deepEqual(ejeY, [
    { y: 60, desde: 50, hasta: 70, valor: "20", tipo: "spacing" },
  ]);
});

test("spacingAuto → las marcas de spacing dicen Auto (el padding no)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 0, right: 0, bottom: 0 };
  const gaps = [{ x: 60, y: 0, width: 30, height: 100 }];
  const { ejeX } = marcasLayout(frame, padding, gaps, "HORIZONTAL", true);
  assert.equal(ejeX[0].valor, "16");
  assert.equal(ejeX[1].valor, "Auto");
});

test("respeta el offset del frame", () => {
  const frame = { x: 56, y: 56, width: 100, height: 100 };
  const padding = { left: 10, top: 0, right: 0, bottom: 0 };
  const { ejeX } = marcasLayout(frame, padding, [], "HORIZONTAL", false);
  assert.deepEqual(ejeX, [
    { x: 61, desde: 56, hasta: 66, valor: "10", tipo: "padding" },
  ]);
});

test("formatea con la unidad actual (rem)", () => {
  aplicarUnidad("rem");
  const frame = { x: 0, y: 0, width: 100, height: 100 };
  const { ejeX } = marcasLayout(frame, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(ejeX[0].valor, "1rem");
  aplicarUnidad("px");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL — `Cannot find module .../utils/marcadores-layout.ts`.

- [ ] **Step 3: Implementar**

Crear `src/plugin/utils/marcadores-layout.ts`:

```typescript
import type { Rect } from "./overlays.ts";
import { formatearEspaciado, unidadActual } from "./espaciado.ts";

export interface MarcaX {
  x: number;       // centro de la banda (donde va el texto)
  desde: number;   // borde izquierdo de la banda (para los ticks)
  hasta: number;   // borde derecho
  valor: string;
  tipo: "padding" | "spacing";
}

export interface MarcaY {
  y: number;
  desde: number;
  hasta: number;
  valor: string;
  tipo: "padding" | "spacing";
}

// Marcas numéricas de un contenedor: las bandas verticales (padding left/right,
// gaps de dirección HORIZONTAL) se anotan arriba del artwork (eje X); las
// horizontales (padding top/bottom, gaps de dirección VERTICAL), a la izquierda
// (eje Y). Bandas de grosor 0 no generan marca. Con spacingAuto, las marcas de
// spacing dicen "Auto" (el padding conserva su número).
export function marcasLayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
): { ejeX: MarcaX[]; ejeY: MarcaY[] } {
  const E = (n: number) => formatearEspaciado(n, unidadActual());
  const ejeX: MarcaX[] = [];
  const ejeY: MarcaY[] = [];
  if (padding.left > 0) {
    ejeX.push({ x: frame.x + padding.left / 2, desde: frame.x, hasta: frame.x + padding.left, valor: E(padding.left), tipo: "padding" });
  }
  if (padding.right > 0) {
    const desde = frame.x + frame.width - padding.right;
    ejeX.push({ x: desde + padding.right / 2, desde, hasta: frame.x + frame.width, valor: E(padding.right), tipo: "padding" });
  }
  if (padding.top > 0) {
    ejeY.push({ y: frame.y + padding.top / 2, desde: frame.y, hasta: frame.y + padding.top, valor: E(padding.top), tipo: "padding" });
  }
  if (padding.bottom > 0) {
    const desde = frame.y + frame.height - padding.bottom;
    ejeY.push({ y: desde + padding.bottom / 2, desde, hasta: frame.y + frame.height, valor: E(padding.bottom), tipo: "padding" });
  }
  for (const g of gaps) {
    if (direccion === "HORIZONTAL") {
      ejeX.push({ x: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: spacingAuto ? "Auto" : E(g.width), tipo: "spacing" });
    } else {
      ejeY.push({ y: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: spacingAuto ? "Auto" : E(g.height), tipo: "spacing" });
    }
  }
  return { ejeX, ejeY };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: marcasLayout calcula las marcas numéricas de padding/spacing"
```

---

### Task 3: Geometría pura — `estiloCota` e `iconoDireccion`

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `tests/marcadores-layout.test.ts` (y sumar `estiloCota, iconoDireccion` al import de `marcadores-layout.ts`):

```typescript
test("estiloCota mapea el resizing a las puntas de la cota", () => {
  assert.equal(estiloCota("Fixed"), "fixed");
  assert.equal(estiloCota("Fill"), "fill");
  assert.equal(estiloCota("Hug"), "hug");
});

test("iconoDireccion elige según dirección y wrap", () => {
  assert.equal(iconoDireccion("HORIZONTAL", false), "flecha-h");
  assert.equal(iconoDireccion("VERTICAL", false), "flecha-v");
  assert.equal(iconoDireccion("HORIZONTAL", true), "grilla-h");
  assert.equal(iconoDireccion("VERTICAL", true), "grilla-v");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL — `estiloCota is not a function` (o error de import).

- [ ] **Step 3: Implementar**

Agregar al final de `src/plugin/utils/marcadores-layout.ts`:

```typescript
// Estilo de puntas de la cota azul según el resizing del eje:
// Fixed = topes, Fill = flechas hacia afuera, Hug = flechas hacia adentro.
export function estiloCota(resizing: string): "fixed" | "fill" | "hug" {
  if (resizing === "Fill") return "fill";
  if (resizing === "Hug") return "hug";
  return "fixed";
}

// Ícono de dirección del artwork (variante grilla cuando hay wrap).
export function iconoDireccion(
  direccion: "HORIZONTAL" | "VERTICAL",
  wrap: boolean,
): "flecha-h" | "flecha-v" | "grilla-h" | "grilla-v" {
  if (wrap) return direccion === "HORIZONTAL" ? "grilla-h" : "grilla-v";
  return direccion === "HORIZONTAL" ? "flecha-h" : "flecha-v";
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: estiloCota e iconoDireccion para las anotaciones de Layout"
```

---

### Task 4: Generador — un artwork por contenedor (overlays)

Reestructura `generarLayout`: desaparecen el clon único y `dibujarOverlays`; entra `artworkDe`, que clona **un** contenedor y pinta solo sus overlays (hijos directos azules, padding verde, gaps naranjas). Cada contenedor produce una fila artwork+exhibit. Las anotaciones (números, cotas, ícono) llegan en las Tasks 5 y 6. Código impuro: se valida con build + verificación manual al final.

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Reemplazar imports y agregar constantes**

En `src/plugin/generadores/layout.ts`, reemplazar las líneas 1-8 por:

```typescript
import type { LayoutSpec, NodoLike } from "../modelo/tipos.ts";
import { frameVertical, frameHorizontal, texto, enColumnas } from "./frames.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { formatearEspaciado, unidadActual } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };

// Margen del artwork reservado para las anotaciones (arriba e izquierda).
const MARGEN = 56;
const RESPIRO = 16; // borde derecho e inferior
```

- [ ] **Step 2: Reemplazar `dibujarOverlays` por `artworkDe`**

Borrar la función `dibujarOverlays` (líneas 35-50) y agregar en su lugar (la función `exhibit` y `rectOverlay` quedan como están):

```typescript
// Construye el artwork anotado de UN contenedor con Auto Layout: clon del
// subárbol + overlays de ese contenedor (hijos azules, padding verde, gaps
// naranjas). El clon va corrido (MARGEN, MARGEN) para dejar lugar a las
// anotaciones de las tasks siguientes.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementoNombre}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];
  const clon = contenedor.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN;
  clon.y = MARGEN;
  artwork.resize(clon.width + MARGEN + RESPIRO, clon.height + MARGEN + RESPIRO);

  const frameRect: Rect = { x: MARGEN, y: MARGEN, width: clon.width, height: clon.height };
  const hijosRects: Rect[] = contenedor.children.map((c) => ({
    x: MARGEN + c.x, y: MARGEN + c.y, width: c.width, height: c.height,
  }));
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  for (const r of rectsPadding(frameRect, spec.padding)) rectOverlay(r, VERDE, 0.35, artwork);
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  for (const r of gaps) rectOverlay(r, NARANJA, 0.5, artwork);

  return artwork;
}
```

- [ ] **Step 3: Reescribir `generarLayout`**

Reemplazar la función `generarLayout` completa por:

```typescript
// Genera el output de Layout and Spacing: una fila artwork+exhibit por cada
// contenedor con Auto Layout (raíz + anidados; mismo orden que extraerLayout).
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Layout and Spacing", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Layout and Spacing", 48));

  const contenedores = recorrerAutoLayout(seleccionado as unknown as NodoLike) as unknown as FrameNode[];

  if (specs.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else {
    const filas: FrameNode[] = [];
    const n = Math.min(contenedores.length, specs.length);
    for (let i = 0; i < n; i++) {
      const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
      fila.appendChild(await artworkDe(contenedores[i], specs[i]));
      fila.appendChild(await exhibit(specs[i]));
      filas.push(fila);
    }
    if (columnas > 1) {
      seccion.appendChild(enColumnas(filas, columnas));
    } else {
      for (const f of filas) seccion.appendChild(f);
    }
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

Notas:
- `recorrerAutoLayout` opera sobre `NodoLike` pero los `SceneNode` reales lo satisfacen estructuralmente (mismo truco que ya usa `main.ts` con `extraerLayout`). Devuelve los contenedores en el mismo orden que `extraerLayout`, por eso el apareo por índice es seguro.
- `main.ts:112` no cambia: la firma de `generarLayout` es la misma.

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos los tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: Layout genera un artwork por contenedor con Auto Layout"
```

---

### Task 5: Generador — marcadores numéricos con ticks

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Agregar helpers y colores de marcas**

Sumar al import de `marcadores-layout` (nuevo) en `src/plugin/generadores/layout.ts`:

```typescript
import { marcasLayout, estiloCota, iconoDireccion } from "../utils/marcadores-layout.ts";
```

(`estiloCota` e `iconoDireccion` se usan en la Task 6.)

Debajo de las constantes de color existentes, agregar:

```typescript
// Versiones oscuras para los textos de las marcas (legibles sobre el gris).
const VERDE_TEXTO: RGB = { r: 0.05, g: 0.5, b: 0.2 };
const NARANJA_TEXTO: RGB = { r: 0.85, g: 0.4, b: 0 };
```

Y debajo de `rectOverlay`, los dos helpers de dibujo:

```typescript
// Línea fina (rect de 1px) para ticks de las marcas.
function linea(x: number, y: number, w: number, h: number, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = x;
  r.y = y;
  r.resize(Math.max(w, 1), Math.max(h, 1));
  r.fills = [{ type: "SOLID", color }];
  artwork.appendChild(r);
}

// Texto chico de marca, coloreado; el caller lo posiciona después (necesita width/height).
async function textoMarca(valor: string, color: RGB, artwork: FrameNode): Promise<TextNode> {
  const t = await texto(valor, 10);
  t.fills = [{ type: "SOLID", color }];
  artwork.appendChild(t);
  return t;
}
```

- [ ] **Step 2: Dibujar las marcas en `artworkDe`**

En `artworkDe`, después del bucle de gaps naranjas y antes del `return artwork;`, agregar:

```typescript
  // Marcas numéricas: eje X arriba, eje Y a la izquierda, con ticks en los
  // bordes de cada banda.
  const { ejeX, ejeY } = marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto);
  for (const m of ejeX) {
    const color = m.tipo === "padding" ? VERDE_TEXTO : NARANJA_TEXTO;
    linea(m.desde, MARGEN - 12, 1, 12, color, artwork);
    linea(m.hasta - 1, MARGEN - 12, 1, 12, color, artwork);
    const t = await textoMarca(m.valor, color, artwork);
    t.x = m.x - t.width / 2;
    t.y = MARGEN - 26;
  }
  for (const m of ejeY) {
    const color = m.tipo === "padding" ? VERDE_TEXTO : NARANJA_TEXTO;
    linea(MARGEN - 12, m.desde, 12, 1, color, artwork);
    linea(MARGEN - 12, m.hasta - 1, 12, 1, color, artwork);
    const t = await textoMarca(m.valor, color, artwork);
    t.x = MARGEN - 16 - t.width;
    t.y = m.y - t.height / 2;
  }
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos los tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: marcadores numéricos de padding/spacing en el artwork de Layout"
```

---

### Task 6: Generador — cotas azules de resizing e ícono de dirección

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Agregar los SVG**

Debajo de `textoMarca` en `src/plugin/generadores/layout.ts`, agregar:

```typescript
const AZUL_HEX = "#0D66D9";
const GRIS_HEX = "#444444";

// Cota horizontal de `largo` px; las puntas codifican el resizing.
function svgCotaH(estilo: "fixed" | "fill" | "hug", largo: number): string {
  const L = largo;
  const base = `<line x1="0" y1="6" x2="${L}" y2="6" stroke="${AZUL_HEX}"/>`;
  const topes = `<line x1="0.5" y1="0" x2="0.5" y2="12" stroke="${AZUL_HEX}"/><line x1="${L - 0.5}" y1="0" x2="${L - 0.5}" y2="12" stroke="${AZUL_HEX}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M6 1 L1 6 L6 11" stroke="${AZUL_HEX}" fill="none"/><path d="M${L - 6} 1 L${L - 1} 6 L${L - 6} 11" stroke="${AZUL_HEX}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M2 1 L7 6 L2 11" stroke="${AZUL_HEX}" fill="none"/><path d="M${L - 2} 1 L${L - 7} 6 L${L - 2} 11" stroke="${AZUL_HEX}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="12">${base}${puntas}</svg>`;
}

// Cota vertical de `largo` px (misma idea, ejes intercambiados).
function svgCotaV(estilo: "fixed" | "fill" | "hug", largo: number): string {
  const L = largo;
  const base = `<line x1="6" y1="0" x2="6" y2="${L}" stroke="${AZUL_HEX}"/>`;
  const topes = `<line x1="0" y1="0.5" x2="12" y2="0.5" stroke="${AZUL_HEX}"/><line x1="0" y1="${L - 0.5}" x2="12" y2="${L - 0.5}" stroke="${AZUL_HEX}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M1 6 L6 1 L11 6" stroke="${AZUL_HEX}" fill="none"/><path d="M1 ${L - 6} L6 ${L - 1} L11 ${L - 6}" stroke="${AZUL_HEX}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M1 2 L6 7 L11 2" stroke="${AZUL_HEX}" fill="none"/><path d="M1 ${L - 2} L6 ${L - 7} L11 ${L - 2}" stroke="${AZUL_HEX}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="${L}">${base}${puntas}</svg>`;
}

// Íconos de dirección (24x24): flecha → / ↓, variante con grilla si hay wrap.
const ICONOS: Record<string, string> = {
  "flecha-h": `<path d="M3 12 H21 M15 6 L21 12 L15 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "flecha-v": `<path d="M12 3 V21 M6 15 L12 21 L18 15" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-h": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M14 17 H21 M18 14 L21 17 L18 20" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-v": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M17 14 V21 M14 18 L17 21 L20 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
};

function svgIcono(nombre: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${ICONOS[nombre]}</svg>`;
}
```

- [ ] **Step 2: Dibujar cotas e ícono en `artworkDe`**

En `artworkDe`, después de las marcas numéricas y antes del `return artwork;`, agregar:

```typescript
  // Cotas azules de resizing (sin número): horizontal arriba, vertical a la izquierda.
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = MARGEN;
  cotaH.y = MARGEN - 44;
  artwork.appendChild(cotaH);
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = MARGEN - 44;
  cotaV.y = MARGEN;
  artwork.appendChild(cotaV);

  // Ícono de dirección, arriba a la izquierda del artwork.
  const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
  icono.x = 8;
  icono.y = 8;
  artwork.appendChild(icono);
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos los tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: cotas de resizing e ícono de dirección en el artwork de Layout"
```

---

### Task 7: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, todos los tests PASS (los 224 previos + ~8 nuevos).

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

Checklist contra `prd-images/3. Layout and Spacing/layout-1.CrBWH8Xv_Z1yetUh.webp`:

1. Componente anidado estilo "ESDSV Alert" (raíz horizontal, padding 16, spacing 8; hijo vertical con spacing 4) → botón "Layout & Spacing":
   - Una fila artwork+exhibit por contenedor, en orden raíz → anidados.
   - Números verdes de padding arriba (left/right) y a la izquierda (top/bottom); naranjas para los gaps, con sus ticks.
   - Cota horizontal y vertical con las puntas correctas según el resizing de cada eje (Fixed = topes, Fill = flechas afuera, Hug = flechas adentro).
   - Ícono → en contenedores horizontales, ↓ en verticales.
2. Frame con wrap y "space between" → marcas de spacing dicen `Auto`, ícono con grilla.
3. Selector de unidades en rem → los números de las marcas salen en rem.
4. Dark mode ON → las anotaciones siguen legibles (fondo del artwork es gris claro fijo).
5. Multi-column (Columns = 2) → las filas se reparten en columnas sin romperse.

- [ ] **Step 3: Ajustes visuales si hacen falta**

Si la verificación manual revela posiciones/tamaños a afinar, ajustar las constantes (`MARGEN`, offsets de ticks/textos/cotas) en `src/plugin/generadores/layout.ts` y re-verificar. Commit de los ajustes:

```bash
git add src/plugin/generadores/layout.ts
git commit -m "fix: ajustes visuales de los marcadores de Layout"
```
