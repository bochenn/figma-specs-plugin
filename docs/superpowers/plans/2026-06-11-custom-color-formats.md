# Custom Color Formats — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un selector "Color" (HEX / RGB / HSL) que cambia cómo se muestra el valor de los colores hardcoded, dejando el swatch y los tokens de variable/style sin cambios.

**Architecture:** `formatearColor` (pura) convierte un hex al formato elegido. `color.ts` guarda el formato actual (estado de módulo, como `tema`); `main` lo setea antes de generar y `colorAtributo` lo lee. Default HEX = output idéntico al de hoy.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `FormatoColor` + `MensajeUI` suma `formatoColor?`. |
| `src/plugin/utils/color.ts` | **Modificar.** `formatearColor` + `rgbAHsl` + estado del formato. |
| `src/plugin/utils/atributos.ts` | **Modificar.** `colorAtributo` formatea el valor hardcoded. |
| `src/plugin/main.ts` | **Modificar.** `aplicarFormatoColor` antes de generar. |
| `src/ui/index.html` | **Modificar.** `<select id="formatoColor">`. |
| `src/ui/ui.ts` | **Modificar.** Manda `formatoColor`. |
| `tests/color.test.ts` | **Nuevo.** Tests de `formatearColor`. |

---

## Task 1: `FormatoColor` + `formatearColor` (puro)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/color.test.ts`
- Modify: `src/plugin/utils/color.ts`

- [ ] **Step 1: Agregar `FormatoColor` y `formatoColor?` en `tipos.ts`**

Antes de `export type MensajeUI`, agregar:

```typescript
export type FormatoColor = "HEX" | "RGB" | "HSL";
```

Y reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor };
```

- [ ] **Step 2: Escribir el test que falla**

Crear `tests/color.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { formatearColor } from "../src/plugin/utils/color.ts";

test("formatearColor de #FF0000 en cada formato", () => {
  assert.equal(formatearColor("#FF0000", "HEX"), "#FF0000");
  assert.equal(formatearColor("#FF0000", "RGB"), "rgb(255, 0, 0)");
  assert.equal(formatearColor("#FF0000", "HSL"), "hsl(0, 100%, 50%)");
});

test("formatearColor de negro y blanco", () => {
  assert.equal(formatearColor("#000000", "RGB"), "rgb(0, 0, 0)");
  assert.equal(formatearColor("#FFFFFF", "HSL"), "hsl(0, 0%, 100%)");
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `formatearColor` no exportado / no es función.

- [ ] **Step 4: Implementar `formatearColor` + `rgbAHsl` en `src/plugin/utils/color.ts`**

Agregar el import del tipo al inicio del archivo:

```typescript
import type { FormatoColor } from "../modelo/tipos.ts";
```

Y al final del archivo, agregar:

```typescript
// Convierte RGB (canales 0..1) a HSL (h: 0..360, s/l: 0..100), redondeado.
function rgbAHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Formatea un hex "#RRGGBB" al formato elegido (HEX / RGB / HSL).
export function formatearColor(hex: string, formato: FormatoColor): string {
  if (formato === "HEX") return hex.toUpperCase();
  const { r, g, b } = hexARgb(hex);
  const R = Math.round(r * 255);
  const G = Math.round(g * 255);
  const B = Math.round(b * 255);
  if (formato === "RGB") return `rgb(${R}, ${G}, ${B})`;
  const { h, s, l } = rgbAHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (103 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/color.test.ts src/plugin/utils/color.ts
git commit -m "feat: FormatoColor + formatearColor (HEX/RGB/HSL)"
```

---

## Task 2: Estado del formato + `colorAtributo` + main

**Files:**
- Modify: `src/plugin/utils/color.ts`
- Modify: `src/plugin/utils/atributos.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar el estado del formato en `color.ts`**

Al final de `src/plugin/utils/color.ts`, agregar:

```typescript
let formato: FormatoColor = "HEX";

// Setea el formato de color actual (default HEX).
export function aplicarFormatoColor(f: FormatoColor): void {
  formato = f;
}

// Devuelve el formato de color actual.
export function formatoColorActual(): FormatoColor {
  return formato;
}
```

- [ ] **Step 2: `colorAtributo` formatea el valor hardcoded**

En `src/plugin/utils/atributos.ts`, agregar el import al inicio:

```typescript
import { formatearColor, formatoColorActual } from "./color.ts";
```

Y reemplazar la rama HARDCODED de `colorAtributo`:

```typescript
  return { clave, valor: opts.hex, formato: "HARDCODED", swatchHex: opts.hex };
```

por:

```typescript
  return { clave, valor: formatearColor(opts.hex, formatoColorActual()), formato: "HARDCODED", swatchHex: opts.hex };
```

- [ ] **Step 3: `main.ts` — setear el formato antes de generar**

Agregar el import (junto a los otros imports de utils):

```typescript
import { aplicarFormatoColor } from "./utils/color.ts";
```

En el handler `figma.ui.onmessage`, después de la línea `aplicarTema(msg.dark ?? false);`, agregar:

```typescript
  aplicarFormatoColor(msg.formatoColor ?? "HEX");
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 103`, `fail 0` (los tests de `colorAtributo` siguen verdes porque el default es HEX).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/color.ts src/plugin/utils/atributos.ts src/plugin/main.ts
git commit -m "feat: colorAtributo formatea el valor segun el formato de color"
```

---

## Task 3: Selector "Color" en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar el select en `src/ui/index.html`**

Reemplazar la línea del select de Columns
(`<label>Columns <select id="columnas">...</select></label>`) por la misma seguida del nuevo select:

```html
    <label>Columns <select id="columnas"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
    <label>Color <select id="formatoColor"><option>HEX</option><option>RGB</option><option>HSL</option></select></label>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar el bloque de los `const ...Check`/`columnasSelect` + `generar` por (agregando
`formatoColorSelect` y el campo `formatoColor` en el mensaje):

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;
const formatoColorSelect = document.getElementById("formatoColor") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value } }, "*");
}
```

- [ ] **Step 3: Subir el alto del panel en `main.ts`**

Reemplazar `figma.showUI(__html__, { width: 280, height: 400 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 420 });
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: selector Color en la UI"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar el selector **"Color"** (HEX / RGB / HSL).

- [ ] **Step 2: Caso feliz (RGB / HSL)**

Seleccionar un componente con colores **hardcoded** → **Color: RGB** → "Anatomy".
Expected: los valores de color salen como `rgb(R, G, B)`; el swatch (pill) no cambia. Cambiar a **HSL** →
`hsl(H, S%, L%)`. Panel: "✓ Generado".

- [ ] **Step 3: HEX (default)**

Color: HEX → "Anatomy" → los valores salen en hex, igual que antes.

- [ ] **Step 4: Verificar variable/style y el resto**

- Un atributo de color que viene de una **variable** o **style** → el valor sigue mostrando el **nombre** del token (no cambia con el formato).
- Probar el formato también en Properties y Styling Inventory.

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Custom Color Formats en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Selector, tipo y formato puro | Task 1 (FormatoColor + formatearColor), Task 3 (select) |
| 2 — Aplicar el formato (estado de módulo) | Task 2 (estado + colorAtributo + main) |
| 3 — Errores y casos límite | Task 2 (default HEX), Task 4 (variable/style) |
| 4 — Testing | Task 1 (unit), Task 4 (manual) |
