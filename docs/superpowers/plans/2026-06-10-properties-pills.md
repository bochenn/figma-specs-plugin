# Pills en Properties — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los cambios de color en Properties se muestren con un swatch (el color de la opción), reusando el pill de Anatomy.

**Architecture:** `AtributoCambiado` suma `swatchHex`; `diffAtributos` lo arrastra del atributo de la opción; el generador de Properties dibuja un pill cuando hay swatch. Se actualizan los tests existentes que asumían el shape viejo.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `AtributoCambiado` suma `swatchHex?`. |
| `src/plugin/comparacion/variantes.ts` | **Modificar.** `diffAtributos` arrastra `swatchHex`. |
| `src/plugin/generadores/properties.ts` | **Modificar.** `filaAtributoCambiado` dibuja el pill. |
| `tests/diff-atributos.test.ts` | **Modificar.** Agrega casos de swatch. |
| `tests/comparar-variante.test.ts` | **Modificar.** Expectativas de color con `swatchHex`. |
| `tests/properties-extraccion.test.ts` | **Modificar.** Expectativa de color con `swatchHex`. |

---

## Task 1: Tipos (AtributoCambiado + swatchHex)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Agregar `swatchHex?` a `AtributoCambiado`**

Reemplazar la interfaz `AtributoCambiado` por:

```typescript
export interface AtributoCambiado {
  clave: string;          // "background-color", "width", "opacity"
  valorDefault?: string;  // ausente si el atributo no existía en el default
  valorOpcion?: string;   // ausente si el atributo desaparece en la opción
  swatchHex?: string;     // color del swatch (el de la opción; solo atributos de color)
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: AtributoCambiado con swatchHex"
```

---

## Task 2: `diffAtributos` arrastra `swatchHex`

**Files:**
- Modify: `tests/diff-atributos.test.ts`
- Modify: `tests/comparar-variante.test.ts`
- Modify: `tests/properties-extraccion.test.ts`
- Modify: `src/plugin/comparacion/variantes.ts`

- [ ] **Step 1: Agregar casos a `tests/diff-atributos.test.ts`**

Al final del archivo, agregar:

```typescript
test("atributos de color con swatchHex distintos → cambio con swatchHex de la opción", () => {
  const def: Atributo[] = [{ clave: "background-color", valor: "#808080", formato: "HARDCODED", swatchHex: "#808080" }];
  const opc: Atributo[] = [{ clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" }];
  assert.deepEqual(diffAtributos(def, opc), [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000", swatchHex: "#000000" },
  ]);
});

test("cambio no-color → sin swatchHex", () => {
  const def: Atributo[] = [{ clave: "width", valor: "100", formato: "HARDCODED" }];
  const opc: Atributo[] = [{ clave: "width", valor: "200", formato: "HARDCODED" }];
  assert.deepEqual(diffAtributos(def, opc), [
    { clave: "width", valorDefault: "100", valorOpcion: "200" },
  ]);
});
```

- [ ] **Step 2: Actualizar `tests/comparar-variante.test.ts`**

En el test `"un atributo distinto produce un elemento modificado"`, reemplazar el bloque `assert.deepEqual(cambios[0].atributos, ...)` por:

```typescript
  assert.deepEqual(cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000", swatchHex: "#000000" },
  ]);
```

- [ ] **Step 3: Actualizar `tests/properties-extraccion.test.ts`**

En el test `"una propiedad con dos opciones: saltea el default y compara la otra"`, reemplazar el bloque `assert.deepEqual(specs[0].opciones[0].cambios[0].atributos, ...)` por:

```typescript
  assert.deepEqual(specs[0].opciones[0].cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000", swatchHex: "#000000" },
  ]);
```

- [ ] **Step 4: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `diffAtributos` todavía no agrega `swatchHex`.

- [ ] **Step 5: Modificar `diffAtributos` en `src/plugin/comparacion/variantes.ts`**

Reemplazar la función `diffAtributos` por:

```typescript
// Devuelve solo los atributos cuyo valor difiere entre default y opción,
// con ambos valores y el swatchHex de la opción (para los atributos de color).
export function diffAtributos(attrsDefault: Atributo[], attrsOpcion: Atributo[]): AtributoCambiado[] {
  const claves = new Set<string>();
  for (const a of attrsDefault) claves.add(a.clave);
  for (const a of attrsOpcion) claves.add(a.clave);

  const cambios: AtributoCambiado[] = [];
  for (const clave of claves) {
    const aDef = attrsDefault.find((a) => a.clave === clave);
    const aOpc = attrsOpcion.find((a) => a.clave === clave);
    if (aDef?.valor !== aOpc?.valor) {
      const cambio: AtributoCambiado = { clave, valorDefault: aDef?.valor, valorOpcion: aOpc?.valor };
      const swatch = aOpc?.swatchHex ?? aDef?.swatchHex;
      if (swatch) cambio.swatchHex = swatch;
      cambios.push(cambio);
    }
  }
  return cambios;
}
```

- [ ] **Step 6: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (80 en total).

- [ ] **Step 7: Commit**

```bash
git add tests/diff-atributos.test.ts tests/comparar-variante.test.ts tests/properties-extraccion.test.ts src/plugin/comparacion/variantes.ts
git commit -m "feat: diffAtributos arrastra swatchHex de la opcion"
```

---

## Task 3: Pill en el generador de Properties

**Files:**
- Modify: `src/plugin/generadores/properties.ts`

- [ ] **Step 1: Actualizar imports de `properties.ts`**

Reemplazar:

```typescript
import type { PropiedadSpec, ElementoCambiado } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
```

por:

```typescript
import type { PropiedadSpec, ElementoCambiado, AtributoCambiado } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";
import { hexARgb } from "../utils/color.ts";
```

- [ ] **Step 2: Agregar `filaAtributoCambiado`**

Justo después de la función `lineaAtributo` (antes de `listaCambios`), agregar:

```typescript
// Dibuja un cambio de atributo: pill (swatch + texto) si es color; texto plano si no.
async function filaAtributoCambiado(c: AtributoCambiado): Promise<SceneNode> {
  if (!c.swatchHex) return await texto(lineaAtributo(c), 12);
  const fila = frameHorizontal("Atributo", 8);
  fila.counterAxisAlignItems = "CENTER";
  const swatch = figma.createRectangle();
  swatch.resize(12, 12);
  swatch.fills = [{ type: "SOLID", color: hexARgb(c.swatchHex) }];
  swatch.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  swatch.strokeWeight = 1;
  fila.appendChild(swatch);
  fila.appendChild(await texto(lineaAtributo(c), 12));
  return fila;
}
```

- [ ] **Step 3: Usar `filaAtributoCambiado` en `listaCambios`**

En la función `listaCambios`, reemplazar el bloque:

```typescript
    for (const attr of cambio.atributos) {
      fila.appendChild(await texto(lineaAtributo(attr), 12));
    }
```

por:

```typescript
    for (const attr of cambio.atributos) {
      fila.appendChild(await filaAtributoCambiado(attr));
    }
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 80`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/properties.ts
git commit -m "feat: pill con swatch en los cambios de Properties"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un Component Set con un cambio de color**

En Figma, un componente con variantes donde un rectángulo cambie de color entre variantes (idealmente con
el color vinculado a una **variable**, para ver el nombre + swatch).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Pills en Properties)**

Seleccionar el Component Set → botón **"Properties"**.
Expected: en los cambios de cada opción, los atributos de color aparecen con un **swatch** (12×12) del color
de la opción + el texto `clave: valorOpcion (default: valorDefault)`. Los cambios no-color (si los hay) van
sin swatch. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/2. properties/` y comparar. Anotar diferencias (dos swatches, highlight) como pulido — NO
arreglarlas ahora.

- [ ] **Step 5: Verificar que el resto sigue funcionando**

- Anatomy / Layout / Data / Styling / Modes desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Pills en Properties en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Modelo y diff | Task 1 (tipos), Task 2 (diffAtributos) |
| 2 — Render del pill | Task 3 (generador) |
| 3 — Errores y casos límite | Task 2 (no-color sin swatch), Task 3 (texto plano sin swatch) |
| 4 — Testing | Task 2 (unit + tests actualizados), Task 4 (manual) |
