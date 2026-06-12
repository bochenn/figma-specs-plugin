# Custom Value Formats — Plan de Implementación (Rebanada 28)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los tres controles de Custom Value Formats del PRD: formato del valor resuelto de variables/styles (HEX/RGB/HSL), toggle "Show raw value" y preferencia Variable/Style cuando un color tiene ambos, según `docs/superpowers/specs/2026-06-12-value-formats-design.md`.

**Architecture:** Estado de módulo nuevo en `utils/valores.ts` (patrón `aplicarX`/`xActual` de `color.ts`/`espaciado.ts`). Toda la lógica de comportamiento vive en `colorAtributo` (`utils/atributos.ts`, puro y testeado). Plumbing: tres controles en la UI HTML, tres campos opcionales en `MensajeUI` y tres `aplicarX` en `main.ts` con defaults que replican el comportamiento actual (`HEX`, `true`, `VARIABLE`).

**Tech Stack:** TypeScript sin dependencias, API de plugins de Figma, `node --test`, esbuild (`npm run build`).

---

## Estructura de archivos

- **Crear** `src/plugin/utils/valores.ts` — estado de módulo de los tres controles.
- **Modificar** `src/plugin/modelo/tipos.ts` — tipo `Preferencia` y campos nuevos en `MensajeUI`.
- **Modificar** `src/plugin/utils/atributos.ts` — `colorAtributo` con preferencia, formato y toggle.
- **Modificar** `src/ui/index.html` y `src/ui/ui.ts` — controles nuevos.
- **Modificar** `src/plugin/main.ts` — aplicar las tres opciones del mensaje.
- **Crear** `tests/valores.test.ts`; **modificar** `tests/color-atributo.test.ts`.

---

### Task 1: Estado de módulo (`utils/valores.ts`)

**Files:**
- Create: `src/plugin/utils/valores.ts`
- Modify: `src/plugin/modelo/tipos.ts:76` (tipo `Preferencia`)
- Test: `tests/valores.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/valores.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import {
  aplicarFormatoRaw, formatoRawActual,
  aplicarMostrarRaw, mostrarRawActual,
  aplicarPreferencia, preferenciaActual,
} from "../src/plugin/utils/valores.ts";

test("defaults: HEX, mostrar true, preferencia VARIABLE", () => {
  assert.equal(formatoRawActual(), "HEX");
  assert.equal(mostrarRawActual(), true);
  assert.equal(preferenciaActual(), "VARIABLE");
});

test("aplicarX cambia el estado y se puede restaurar", () => {
  aplicarFormatoRaw("RGB");
  aplicarMostrarRaw(false);
  aplicarPreferencia("STYLE");
  assert.equal(formatoRawActual(), "RGB");
  assert.equal(mostrarRawActual(), false);
  assert.equal(preferenciaActual(), "STYLE");
  aplicarFormatoRaw("HEX");
  aplicarMostrarRaw(true);
  aplicarPreferencia("VARIABLE");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/valores.test.ts`
Expected: FAIL — `Cannot find module .../utils/valores.ts`.

- [ ] **Step 3: Implementar**

En `src/plugin/modelo/tipos.ts`, después de `export type Unidad = "px" | "rem";` (línea 74):

```typescript
export type Preferencia = "VARIABLE" | "STYLE";
```

Crear `src/plugin/utils/valores.ts`:

```typescript
import type { FormatoColor, Preferencia } from "../modelo/tipos.ts";

// Opciones de Custom Value Formats: formato del valor resuelto de
// variables/styles, si se muestra, y cuál gana si hay variable y style.

let formatoRaw: FormatoColor = "HEX";
let mostrarRaw = true;
let preferencia: Preferencia = "VARIABLE";

export function aplicarFormatoRaw(f: FormatoColor): void {
  formatoRaw = f;
}

export function formatoRawActual(): FormatoColor {
  return formatoRaw;
}

export function aplicarMostrarRaw(b: boolean): void {
  mostrarRaw = b;
}

export function mostrarRawActual(): boolean {
  return mostrarRaw;
}

export function aplicarPreferencia(p: Preferencia): void {
  preferencia = p;
}

export function preferenciaActual(): Preferencia {
  return preferencia;
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `node --test tests/valores.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/valores.ts src/plugin/modelo/tipos.ts tests/valores.test.ts
git commit -m "feat: estado de módulo para Custom Value Formats (valores.ts)"
```

---

### Task 2: Lógica en `colorAtributo`

**Files:**
- Modify: `src/plugin/utils/atributos.ts:15-29`
- Test: `tests/color-atributo.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `tests/color-atributo.test.ts` (y los imports nuevos arriba del archivo):

```typescript
import { aplicarFormatoRaw, aplicarMostrarRaw, aplicarPreferencia } from "../src/plugin/utils/valores.ts";
```

```typescript
test("rawValue respeta el formato raw (RGB)", () => {
  aplicarFormatoRaw("RGB");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, "rgb(14, 104, 212)");
  assert.equal(a?.swatchHex, "#0E68D4"); // el swatch sigue en hex crudo
  aplicarFormatoRaw("HEX");
});

test("mostrarRaw false → sin rawValue (pero con swatchHex)", () => {
  aplicarMostrarRaw(false);
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.rawValue, undefined);
  assert.equal(a?.swatchHex, "#0E68D4");
  aplicarMostrarRaw(true);
});

test("preferencia STYLE + variable y style → gana el style", () => {
  aplicarPreferencia("STYLE");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.formato, "STYLE");
  assert.equal(a?.valor, "Brand/Surface");
  aplicarPreferencia("VARIABLE");
});

test("preferencia STYLE + solo variable → variable igual", () => {
  aplicarPreferencia("STYLE");
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" });
  assert.equal(a?.formato, "VARIABLE");
  aplicarPreferencia("VARIABLE");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/color-atributo.test.ts`
Expected: FAIL — los 4 tests nuevos (los `aplicarX` existen desde la Task 1, pero `colorAtributo` todavía no los lee).

- [ ] **Step 3: Implementar**

En `src/plugin/utils/atributos.ts`, sumar el import:

```typescript
import { formatoRawActual, mostrarRawActual, preferenciaActual } from "./valores.ts";
```

y reemplazar la función `colorAtributo` completa por:

```typescript
// Atributo de color: variable o style (según la preferencia cuando hay ambos),
// con el valor resuelto formateado según las opciones de Custom Value Formats;
// hardcoded si no hay ninguno. Devuelve undefined si no hay un color resuelto.
export function colorAtributo(
  clave: string,
  opts: { hex?: string; variableName?: string; styleName?: string },
): Atributo | undefined {
  const hex = opts.hex;
  if (!hex) return undefined;
  const nombrado = (valor: string, formato: "VARIABLE" | "STYLE"): Atributo => {
    const a: Atributo = { clave, valor, formato, swatchHex: hex };
    if (mostrarRawActual()) a.rawValue = formatearColor(hex, formatoRawActual());
    return a;
  };
  if (preferenciaActual() === "STYLE" && opts.styleName) return nombrado(opts.styleName, "STYLE");
  if (opts.variableName) return nombrado(opts.variableName, "VARIABLE");
  if (opts.styleName) return nombrado(opts.styleName, "STYLE");
  return { clave, valor: formatearColor(hex, formatoColorActual()), formato: "HARDCODED", swatchHex: hex };
}
```

Nota: con los defaults (`HEX`, `true`, `VARIABLE`) el comportamiento es idéntico al actual, así
que los 5 tests existentes del archivo siguen pasando sin cambios.

- [ ] **Step 4: Correr la suite completa y verificar que pasa**

Run: `node --test`
Expected: PASS (todos verdes).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/atributos.ts tests/color-atributo.test.ts
git commit -m "feat: colorAtributo respeta formato raw, toggle y preferencia"
```

---

### Task 3: Plumbing — UI, mensaje y main

Código impuro/UI: se valida con build + verificación manual (Task 4).

**Files:**
- Modify: `src/plugin/modelo/tipos.ts:78` (`MensajeUI`)
- Modify: `src/ui/index.html:13`
- Modify: `src/ui/ui.ts`
- Modify: `src/plugin/main.ts:186-188`

- [ ] **Step 1: Campos en `MensajeUI`**

En `src/plugin/modelo/tipos.ts`, reemplazar la línea 78 por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; formatoColor?: FormatoColor; unidad?: Unidad; formatoTipo?: FormatoTipo; formatoRaw?: FormatoColor; mostrarRaw?: boolean; preferencia?: Preferencia };
```

- [ ] **Step 2: Controles en la UI**

En `src/ui/index.html`, después de la línea del select `formatoTipo` (línea 13), agregar:

```html
    <label><input type="checkbox" id="mostrarRaw" checked /> Show raw value</label>
    <label>Raw value <select id="formatoRaw"><option>HEX</option><option>RGB</option><option>HSL</option></select></label>
    <label>Preferred <select id="preferencia"><option value="VARIABLE">Variable</option><option value="STYLE">Style</option></select></label>
```

En `src/ui/ui.ts`, después de la línea de `formatoTipoSelect` (línea 8), agregar:

```typescript
const mostrarRawCheck = document.getElementById("mostrarRaw") as HTMLInputElement;
const formatoRawSelect = document.getElementById("formatoRaw") as HTMLSelectElement;
const preferenciaSelect = document.getElementById("preferencia") as HTMLSelectElement;
```

y reemplazar el `postMessage` (línea 11) por:

```typescript
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value, formatoTipo: formatoTipoSelect.value, formatoRaw: formatoRawSelect.value, mostrarRaw: mostrarRawCheck.checked, preferencia: preferenciaSelect.value } }, "*");
```

- [ ] **Step 3: Aplicar en `main.ts`**

En `src/plugin/main.ts`, sumar el import:

```typescript
import { aplicarFormatoRaw, aplicarMostrarRaw, aplicarPreferencia } from "./utils/valores.ts";
```

y después de `aplicarFormatoTipo(msg.formatoTipo ?? "Plain");` (línea 188), agregar:

```typescript
  aplicarFormatoRaw(msg.formatoRaw ?? "HEX");
  aplicarMostrarRaw(msg.mostrarRaw ?? true);
  aplicarPreferencia(msg.preferencia ?? "VARIABLE");
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos los tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: controles de Custom Value Formats en la UI"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, todos verdes (~6 tests nuevos sobre los 234 actuales).

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

Checklist contra `prd-images/16. Custom Value Formats/format-values-1.*.webp`:

1. Nodo con fill atado a una variable → Anatomy con `Raw value: RGB` → el valor entre paréntesis
   sale como `rgb(…)`; con `HSL`, como `hsl(…)`. El swatch se pinta igual en todos los casos.
2. `Show raw value` desactivado → el nombre de la variable aparece sin `(…)`.
3. Nodo con fill que tenga **variable y style a la vez** → con `Preferred: Variable` se muestra el
   nombre de la variable; con `Preferred: Style`, el del style.
4. Selector `Color` (HEX/RGB/HSL) sigue afectando solo a los colores hardcodeados.

- [ ] **Step 3: Ajustes si hacen falta**

Si la verificación manual revela algo, ajustar y commitear:

```bash
git add -A
git commit -m "fix: ajustes de Custom Value Formats"
```
