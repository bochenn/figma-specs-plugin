# Variable Formatting (motor en Anatomy) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que Anatomy muestre los atributos de color (fill + stroke) con la prioridad variable > style > hardcoded, como pills con swatch.

**Architecture:** La prioridad/formato vive en una función pura `colorAtributo` (en `utils/atributos.ts`), usada por `leerAtributos` para `background-color` y `border-color`. El adaptador (impure) detecta la variable de color vinculada y captura los strokes crudos. El generador de Anatomy dibuja un pill (swatch + texto) para los atributos con color.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** Enriquece `Atributo` (`rawValue?`, `swatchHex?`); agrega a `NodoLike`: `strokes?`, `fillVariableName?`, `strokeVariableName?`. |
| `src/plugin/utils/atributos.ts` | **Modificar.** Agrega `colorAtributo` (pura); reescribe `leerAtributos` para usarla en fill (`background-color`) y stroke (`border-color`). |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** Captura `strokes` crudos y resuelve `fillVariableName`/`strokeVariableName`. |
| `src/plugin/generadores/anatomy.ts` | **Modificar.** `filaAtributo` dibuja un pill (swatch + texto) para atributos con color. |
| `tests/atributos.test.ts` | **Modificar.** Actualiza el test de background-color; agrega variable y stroke. |
| `tests/color-atributo.test.ts` | **Nuevo.** Tests de `colorAtributo`. |
| `tests/anatomy-extraccion.test.ts` | **Modificar.** Actualiza la expectativa de atributos (ahora con `swatchHex`). |

---

## Task 1: Tipos (Atributo enriquecido + NodoLike)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Enriquecer `Atributo`**

Reemplazar la interfaz `Atributo` por:

```typescript
export interface Atributo {
  clave: string;        // "background-color", "border-color", "width", "opacity"
  valor: string;        // hex, "Colección/Variable", o nombre del style
  formato: "HARDCODED" | "VARIABLE" | "STYLE";
  rawValue?: string;    // hex resuelto (para variable/style)
  swatchHex?: string;   // color del swatch (presente en atributos de color)
}
```

- [ ] **Step 2: Agregar campos a `NodoLike`**

En la interfaz `NodoLike`, después de la línea `fills?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;`, agregar:

```typescript
  strokes?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;
```

Y después de `textStyleName?: string;`, agregar:

```typescript
  fillVariableName?: string;     // "Colección/Variable" del fill
  strokeVariableName?: string;   // idem stroke
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: Atributo con rawValue/swatchHex y NodoLike con strokes/variables de color"
```

---

## Task 2: `colorAtributo` (motor de prioridad)

**Files:**
- Create: `tests/color-atributo.test.ts`
- Modify: `src/plugin/utils/atributos.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { colorAtributo } from "../src/plugin/utils/atributos.ts";

test("solo hex → HARDCODED con swatchHex, sin rawValue", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#000000" }), {
    clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000",
  });
});

test("hex + variableName → VARIABLE con rawValue", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action" }), {
    clave: "background-color", valor: "Color/Action", formato: "VARIABLE", rawValue: "#0E68D4", swatchHex: "#0E68D4",
  });
});

test("hex + styleName (sin variable) → STYLE", () => {
  assert.deepEqual(colorAtributo("background-color", { hex: "#FFFFFF", styleName: "Brand/Surface" }), {
    clave: "background-color", valor: "Brand/Surface", formato: "STYLE", rawValue: "#FFFFFF", swatchHex: "#FFFFFF",
  });
});

test("variable + style → gana la variable", () => {
  const a = colorAtributo("background-color", { hex: "#0E68D4", variableName: "Color/Action", styleName: "Brand/Surface" });
  assert.equal(a?.formato, "VARIABLE");
  assert.equal(a?.valor, "Color/Action");
});

test("sin hex → undefined", () => {
  assert.equal(colorAtributo("background-color", { variableName: "Color/Action" }), undefined);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `colorAtributo is not a function` / export no encontrado.

- [ ] **Step 3: Agregar `colorAtributo` a `src/plugin/utils/atributos.ts`**

Justo después de la función `aHex` (antes de `leerAtributos`), agregar:

```typescript
// Aplica la prioridad variable > style > hardcoded para un atributo de color.
// Devuelve undefined si no hay un color resuelto (hex).
export function colorAtributo(
  clave: string,
  opts: { hex?: string; variableName?: string; styleName?: string },
): Atributo | undefined {
  if (!opts.hex) return undefined;
  if (opts.variableName) {
    return { clave, valor: opts.variableName, formato: "VARIABLE", rawValue: opts.hex, swatchHex: opts.hex };
  }
  if (opts.styleName) {
    return { clave, valor: opts.styleName, formato: "STYLE", rawValue: opts.hex, swatchHex: opts.hex };
  }
  return { clave, valor: opts.hex, formato: "HARDCODED", swatchHex: opts.hex };
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 5 tests nuevos PASAN (62 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/color-atributo.test.ts src/plugin/utils/atributos.ts
git commit -m "feat: colorAtributo (prioridad variable > style > hardcoded)"
```

---

## Task 3: Reescribir `leerAtributos` (fill + stroke con prioridad)

**Files:**
- Modify: `tests/atributos.test.ts`
- Modify: `tests/anatomy-extraccion.test.ts`
- Modify: `src/plugin/utils/atributos.ts`

- [ ] **Step 1: Reemplazar `tests/atributos.test.ts` (actualiza background-color, agrega variable y stroke)**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("fill SOLID hardcoded → background-color HARDCODED con swatchHex", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "#FFFFFF", formato: "HARDCODED", swatchHex: "#FFFFFF" },
  );
});

test("fill con variable → background-color VARIABLE con rawValue", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    fillVariableName: "Color/Action",
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "Color/Action", formato: "VARIABLE", rawValue: "#000000", swatchHex: "#000000" },
  );
});

test("stroke SOLID → border-color", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "FRAME",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "border-color"),
    { clave: "border-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" },
  );
});

test("incluye width cuando está presente (sin swatch)", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "240", formato: "HARDCODED" },
  );
});

test("incluye opacity como porcentaje cuando es menor a 1", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 0.8 };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "opacity"),
    { clave: "opacity", valor: "80%", formato: "HARDCODED" },
  );
});

test("opacity 1 (totalmente opaco) no se incluye", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 1 };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "opacity"), undefined);
});
```

- [ ] **Step 2: Actualizar `tests/anatomy-extraccion.test.ts`**

En el test `"incluye atributos visuales del elemento"`, reemplazar el bloque `assert.deepEqual(...)` por:

```typescript
  assert.deepEqual(elementos[0].atributos, [
    { clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" },
    { clave: "width", valor: "100", formato: "HARDCODED" },
  ]);
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — los tests de `leerAtributos` esperan `swatchHex`/`border-color` que la implementación vieja no produce.

- [ ] **Step 4: Reescribir `leerAtributos` en `src/plugin/utils/atributos.ts`**

Reemplazar la función `leerAtributos` completa por:

```typescript
// Devuelve el hex del primer paint SOLID de una lista, o undefined.
function hexSolido(paints: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }> | undefined): string | undefined {
  const p = paints?.find((f) => f.type === "SOLID" && f.color);
  return p && p.color ? aHex(p.color) : undefined;
}

// Lee los atributos visuales presentes en un nodo.
export function leerAtributos(nodo: NodoLike): Atributo[] {
  const atributos: Atributo[] = [];

  const bg = colorAtributo("background-color", {
    hex: hexSolido(nodo.fills),
    variableName: nodo.fillVariableName,
    styleName: nodo.fillStyleName,
  });
  if (bg) atributos.push(bg);

  const bd = colorAtributo("border-color", {
    hex: hexSolido(nodo.strokes),
    variableName: nodo.strokeVariableName,
    styleName: nodo.strokeStyleName,
  });
  if (bd) atributos.push(bd);

  if (typeof nodo.width === "number") {
    atributos.push({ clave: "width", valor: String(nodo.width), formato: "HARDCODED" });
  }

  if (typeof nodo.opacity === "number" && nodo.opacity < 1) {
    atributos.push({ clave: "opacity", valor: Math.round(nodo.opacity * 100) + "%", formato: "HARDCODED" });
  }

  return atributos;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (64 en total).

- [ ] **Step 6: Commit**

```bash
git add tests/atributos.test.ts tests/anatomy-extraccion.test.ts src/plugin/utils/atributos.ts
git commit -m "feat: leerAtributos con prioridad de color (fill + stroke) via colorAtributo"
```

---

## Task 4: Adaptador captura strokes y variables de color

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Capturar `strokes` crudos**

En `src/plugin/extraccion/adaptador.ts`, justo después del bloque que captura `fills` (el `if ("fills" in nodo && Array.isArray(nodo.fills)) { ... }`), agregar:

```typescript
  if ("strokes" in nodo && Array.isArray(nodo.strokes)) {
    base.strokes = nodo.strokes.map((f) => ({
      type: f.type,
      color: f.type === "SOLID" ? f.color : undefined,
    }));
  }
```

- [ ] **Step 2: Resolver los nombres de variable de color**

En el mismo archivo, justo antes de la línea `if ("children" in nodo) {`, agregar:

```typescript
  if ("boundVariables" in nodo && nodo.boundVariables) {
    const bv = nodo.boundVariables as {
      fills?: readonly VariableAlias[];
      strokes?: readonly VariableAlias[];
    };
    if (bv.fills && bv.fills.length > 0) {
      const nombre = nombreVariable(bv.fills[0].id);
      if (nombre) base.fillVariableName = nombre;
    }
    if (bv.strokes && bv.strokes.length > 0) {
      const nombre = nombreVariable(bv.strokes[0].id);
      if (nombre) base.strokeVariableName = nombre;
    }
  }
```

- [ ] **Step 3: Agregar el helper `nombreVariable` al inicio del archivo**

Después de la línea `import type { NodoLike } from "../modelo/tipos.ts";`, agregar:

```typescript

// Resuelve una variable a "Colección/Variable" (o solo su nombre si no hay collection).
function nombreVariable(id: string): string | undefined {
  const variable = figma.variables.getVariableById(id);
  if (!variable) return undefined;
  const col = figma.variables.getVariableCollectionById(variable.variableCollectionId);
  return col ? `${col.name}/${variable.name}` : variable.name;
}
```

- [ ] **Step 4: Verificar que compila y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm test`
Expected: `pass 64`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador captura strokes y nombres de variable de color"
```

---

## Task 5: Render del pill en el generador de Anatomy

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Actualizar los imports de `anatomy.ts`**

Reemplazar:

```typescript
import type { ElementoAnatomy } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, texto } from "./frames.ts";
```

por:

```typescript
import type { ElementoAnatomy, Atributo } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
```

- [ ] **Step 2: Agregar el helper `hexARgb` y `filaAtributo`**

Justo después de la línea `const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });`, agregar:

```typescript
// Convierte "#RRGGBB" a RGB (canales 0..1).
function hexARgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// Dibuja un atributo: pill (swatch + texto) si es color; texto plano si no.
async function filaAtributo(attr: Atributo): Promise<SceneNode> {
  const linea = attr.rawValue ? `${attr.clave}: ${attr.valor} (${attr.rawValue})` : `${attr.clave}: ${attr.valor}`;
  if (!attr.swatchHex) {
    return await texto(linea, 12);
  }
  const fila = frameHorizontal("Atributo", 8);
  fila.counterAxisAlignItems = "CENTER";
  const swatch = figma.createRectangle();
  swatch.resize(12, 12);
  swatch.fills = [{ type: "SOLID", color: hexARgb(attr.swatchHex) }];
  swatch.strokes = [{ type: "SOLID", color: GRIS(0.8) }];
  swatch.strokeWeight = 1;
  fila.appendChild(swatch);
  fila.appendChild(await texto(linea, 12));
  return fila;
}
```

- [ ] **Step 3: Usar `filaAtributo` en `entradaLista`**

En la función `entradaLista`, reemplazar el bloque:

```typescript
  for (const attr of el.atributos) {
    fila.appendChild(await texto(`${attr.clave}: ${attr.valor}`, 12));
  }
```

por:

```typescript
  for (const attr of el.atributos) {
    fila.appendChild(await filaAtributo(attr));
  }
```

- [ ] **Step 4: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Verificar que los tests siguen verdes**

Run: `npm test`
Expected: `pass 64`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: pill con swatch para atributos de color en Anatomy"
```

---

## Task 6: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame de prueba con los tres formatos**

En Figma, dentro de un frame, crear:
- un rectángulo con **fill hardcoded** (color directo),
- un rectángulo con **fill vinculado a una variable de color**,
- un rectángulo con un **color style** aplicado al fill,
- un rectángulo con **stroke vinculado a una variable de color**.

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Anatomy con pills)**

Seleccionar el frame → botón **"Anatomy"**.
Expected: en la lista de elementos, los atributos de color aparecen como **pills**: un swatch de 12×12 con el
color + el texto. Según el caso:
- hardcoded → `background-color: #RRGGBB`
- variable → `background-color: Colección/Variable (#RRGGBB)`
- style → `background-color: NombreStyle (#RRGGBB)`
- stroke con variable → `border-color: Colección/Variable (#RRGGBB)`

La prioridad se respeta (si hay variable y style, gana la variable). Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/9. Variable formatting/` y comparar el formato de los pills. Anotar diferencias como
pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar que las otras secciones siguen funcionando**

- Properties → ahora los diffs muestran nombres de variable/style donde corresponda (sin swatch).
- Layout / Data / Styling / Modes desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Variable Formatting en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Modelo y motor de prioridad | Task 1 (tipos), Task 2 (colorAtributo), Task 3 (leerAtributos) |
| 2 — Captura en el adaptador | Task 4 |
| 3 — Render del pill en Anatomy | Task 5 |
| 4 — Errores y casos límite | Task 2 (sin hex → undefined), Task 3 (no SOLID → sin atributo) |
| 5 — Testing | Tasks 2–3 (unit), Task 6 (manual) |
