# Line-height en Typography — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar line-height al atributo `typography` (extracción con unidad px/percent/auto + formato Plain/CSS).

**Architecture:** El adaptador normaliza el line-height de los nodos TEXT a un `AlturaLinea` en `NodoLike`. `formatearTipografia` (pura) lo incorpora al string según Plain/CSS. `leerAtributos` lo pasa al formatter. La UI y el resto ya existen de la Rebanada 23.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `AlturaLinea` + `NodoLike.lineHeight?`. |
| `src/plugin/utils/tipografia.ts` | **Modificar.** `formatearTipografia` incorpora line-height. |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** Lee el line-height de los nodos TEXT. |
| `src/plugin/utils/atributos.ts` | **Modificar.** `leerAtributos` pasa el line-height. |
| `tests/tipografia.test.ts` | **Modificar.** Tests de line-height. |

---

## Task 1: `AlturaLinea` + `formatearTipografia` con line-height

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Modify: `tests/tipografia.test.ts`
- Modify: `src/plugin/utils/tipografia.ts`

- [ ] **Step 1: `AlturaLinea` + `lineHeight?` en `NodoLike`**

En `src/plugin/modelo/tipos.ts`, antes de `export interface NodoLike {`, agregar:

```typescript
export interface AlturaLinea {
  unidad: "px" | "percent" | "auto";
  valor?: number;
}
```

Y dentro de `interface NodoLike`, después de la línea `fontSize?: number;`, agregar:

```typescript
  lineHeight?: AlturaLinea;
```

- [ ] **Step 2: Escribir el test que falla**

En `tests/tipografia.test.ts`, agregar un nuevo bloque de test (después del test `"formatearTipografia en Plain y CSS"`):

```typescript
test("formatearTipografia con line-height", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 } }, "Plain"), "Inter Regular 16 / 24");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 } }, "CSS"), "16px/24px Regular Inter");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "percent", valor: 150 } }, "Plain"), "Inter Regular 16 / 150%");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "auto" } }, "CSS"), "16px Regular Inter");
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — el line-height todavía no se incorpora (los `assert.equal` no coinciden).

- [ ] **Step 4: Reemplazar `formatearTipografia` en `src/plugin/utils/tipografia.ts`**

Reemplazar el import del tipo:

```typescript
import type { FormatoTipo } from "../modelo/tipos.ts";
```

por:

```typescript
import type { FormatoTipo, AlturaLinea } from "../modelo/tipos.ts";
```

Y reemplazar la función `formatearTipografia`:

```typescript
// Formatea la tipografía de un nodo según el formato elegido.
export function formatearTipografia(t: { family: string; style: string; size: number }, formato: FormatoTipo): string {
  if (formato === "CSS") return `${t.size}px ${t.style} ${t.family}`;
  return `${t.family} ${t.style} ${t.size}`;
}
```

por:

```typescript
// Formatea la tipografía de un nodo (incluido el line-height) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    return `${medida} ${t.style} ${t.family}`;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  return s;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: el test nuevo PASA y los existentes siguen verdes (108 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/tipografia.test.ts src/plugin/utils/tipografia.ts
git commit -m "feat: AlturaLinea + line-height en formatearTipografia"
```

---

## Task 2: Extracción del line-height en el adaptador

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Leer el line-height de los nodos TEXT**

En `src/plugin/extraccion/adaptador.ts`, dentro del bloque `if (nodo.type === "TEXT") { ... }`, reemplazar:

```typescript
  if (nodo.type === "TEXT") {
    const fn = nodo.fontName;
    if (fn !== figma.mixed) {
      base.fontFamily = fn.family;
      base.fontStyle = fn.style;
    }
    if (nodo.fontSize !== figma.mixed) base.fontSize = nodo.fontSize;
  }
```

por:

```typescript
  if (nodo.type === "TEXT") {
    const fn = nodo.fontName;
    if (fn !== figma.mixed) {
      base.fontFamily = fn.family;
      base.fontStyle = fn.style;
    }
    if (nodo.fontSize !== figma.mixed) base.fontSize = nodo.fontSize;
    const lh = nodo.lineHeight;
    if (lh !== figma.mixed) {
      if (lh.unit === "AUTO") base.lineHeight = { unidad: "auto" };
      else if (lh.unit === "PERCENT") base.lineHeight = { unidad: "percent", valor: lh.value };
      else base.lineHeight = { unidad: "px", valor: lh.value };
    }
  }
```

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 108`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador lee el line-height de los nodos TEXT"
```

---

## Task 3: `leerAtributos` pasa el line-height

**Files:**
- Modify: `tests/tipografia.test.ts`
- Modify: `src/plugin/utils/atributos.ts`

- [ ] **Step 1: Escribir el test que falla**

Al final de `tests/tipografia.test.ts`, agregar:

```typescript
test("leerAtributos incluye el line-height en typography", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, lineHeight: { unidad: "px", valor: 24 } };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16 / 24");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `typo.valor` es `"Inter Regular 16"` (todavía no se pasa el line-height).

- [ ] **Step 3: Pasar el line-height en `leerAtributos`**

En `src/plugin/utils/atributos.ts`, reemplazar:

```typescript
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize }, formatoTipoActual()),
```

por:

```typescript
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight }, formatoTipoActual()),
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: el test nuevo PASA (109 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add tests/tipografia.test.ts src/plugin/utils/atributos.ts
git commit -m "feat: leerAtributos incluye el line-height en typography"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 2: line-height en px**

Seleccionar un componente con **texto de line-height fijo (px)** → **Type: Plain** → "Anatomy".
Expected: `typography` muestra `… 16 / 24`. Type: CSS → `16px/24px Regular Inter`.

- [ ] **Step 3: line-height percent y auto**

- Texto con line-height en **%** → Plain `… / 150%`; CSS `16px/150% …`.
- Texto con line-height **auto** → Plain `… / auto`; CSS sin `/lh` (`16px Regular Inter`).

- [ ] **Step 4: Verificar que el resto sigue**

- Un texto **sin** line-height específico (o mixed) → `typography` sin la parte de line-height (como en la Rebanada 23).
- Un nodo no-texto → sin `typography`.

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de line-height en typography"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Extracción del line-height | Task 1 (AlturaLinea), Task 2 (adaptador) |
| 2 — Formato puro | Task 1 (formatearTipografia) |
| 3 — Atributo de tipografía | Task 3 |
| 4 — Errores y casos límite | Task 1 (auto/percent), Task 3 |
| 5 — Testing | Tasks 1 y 3 (unit), Task 4 (manual) |
