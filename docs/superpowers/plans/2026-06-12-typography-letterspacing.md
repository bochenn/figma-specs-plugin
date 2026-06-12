# Letter-spacing en Typography — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar letter-spacing al atributo `typography` (extracción con unidad px/percent solo si ≠ 0 + formato Plain/CSS).

**Architecture:** El adaptador normaliza el letter-spacing de los nodos TEXT a un `EspaciadoLetra` en `NodoLike` (solo si ≠ 0). `formatearTipografia` (pura) lo agrega al string. `leerAtributos` lo pasa al formatter. La UI y `main` no cambian.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `EspaciadoLetra` + `NodoLike.letterSpacing?`. |
| `src/plugin/utils/tipografia.ts` | **Modificar.** `formatearTipografia` incorpora letter-spacing. |
| `src/plugin/extraccion/adaptador.ts` | **Modificar.** Lee el letter-spacing de los nodos TEXT. |
| `src/plugin/utils/atributos.ts` | **Modificar.** `leerAtributos` pasa el letter-spacing. |
| `tests/tipografia.test.ts` | **Modificar.** Tests de letter-spacing. |

---

## Task 1: `EspaciadoLetra` + `formatearTipografia` con letter-spacing

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Modify: `tests/tipografia.test.ts`
- Modify: `src/plugin/utils/tipografia.ts`

- [ ] **Step 1: `EspaciadoLetra` + `letterSpacing?` en `NodoLike`**

En `src/plugin/modelo/tipos.ts`, después de la interfaz `AlturaLinea`, agregar:

```typescript
export interface EspaciadoLetra {
  unidad: "px" | "percent";
  valor: number;
}
```

Y dentro de `interface NodoLike`, después de la línea `lineHeight?: AlturaLinea;`, agregar:

```typescript
  letterSpacing?: EspaciadoLetra;
```

- [ ] **Step 2: Escribir el test que falla**

En `tests/tipografia.test.ts`, agregar un nuevo bloque de test (después del test `"formatearTipografia con line-height"`):

```typescript
test("formatearTipografia con letter-spacing", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "px", valor: 0.5 } }, "Plain"), "Inter Regular 16 · LS 0.5");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "px", valor: 0.5 } }, "CSS"), "16px Regular Inter · LS 0.5px");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "percent", valor: 5 } }, "Plain"), "Inter Regular 16 · LS 5%");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 0.5 } }, "Plain"), "Inter Regular 16 / 24 · LS 0.5");
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — el letter-spacing todavía no se incorpora (los `assert.equal` no coinciden).

- [ ] **Step 4: Reemplazar `formatearTipografia` en `src/plugin/utils/tipografia.ts`**

Reemplazar el import del tipo:

```typescript
import type { FormatoTipo, AlturaLinea } from "../modelo/tipos.ts";
```

por:

```typescript
import type { FormatoTipo, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";
```

Y reemplazar la función `formatearTipografia`:

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

por:

```typescript
// Formatea la tipografía de un nodo (line-height y letter-spacing incluidos) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea; letterSpacing?: EspaciadoLetra },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    let s = `${medida} ${t.style} ${t.family}`;
    if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}px`}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}`}`;
  return s;
}
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: el test nuevo PASA y los existentes siguen verdes (110 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/tipografia.test.ts src/plugin/utils/tipografia.ts
git commit -m "feat: EspaciadoLetra + letter-spacing en formatearTipografia"
```

---

## Task 2: Extracción del letter-spacing en el adaptador

**Files:**
- Modify: `src/plugin/extraccion/adaptador.ts`

- [ ] **Step 1: Leer el letter-spacing de los nodos TEXT**

En `src/plugin/extraccion/adaptador.ts`, reemplazar el cierre del bloque del line-height:

```typescript
      else base.lineHeight = { unidad: "px", valor: lh.value };
    }
  }
```

por (agregando el letter-spacing antes de cerrar el `if (nodo.type === "TEXT")`):

```typescript
      else base.lineHeight = { unidad: "px", valor: lh.value };
    }
    const ls = nodo.letterSpacing;
    if (ls !== figma.mixed && ls.value !== 0) {
      base.letterSpacing = { unidad: ls.unit === "PERCENT" ? "percent" : "px", valor: ls.value };
    }
  }
```

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 110`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/extraccion/adaptador.ts
git commit -m "feat: adaptador lee el letter-spacing de los nodos TEXT"
```

---

## Task 3: `leerAtributos` pasa el letter-spacing

**Files:**
- Modify: `tests/tipografia.test.ts`
- Modify: `src/plugin/utils/atributos.ts`

- [ ] **Step 1: Escribir el test que falla**

Al final de `tests/tipografia.test.ts`, agregar:

```typescript
test("leerAtributos incluye el letter-spacing en typography", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, letterSpacing: { unidad: "px", valor: 0.5 } };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16 · LS 0.5");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `typo.valor` es `"Inter Regular 16"` (todavía no se pasa el letter-spacing).

- [ ] **Step 3: Pasar el letter-spacing en `leerAtributos`**

En `src/plugin/utils/atributos.ts`, reemplazar:

```typescript
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight }, formatoTipoActual()),
```

por:

```typescript
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight, letterSpacing: nodo.letterSpacing }, formatoTipoActual()),
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: el test nuevo PASA (111 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add tests/tipografia.test.ts src/plugin/utils/atributos.ts
git commit -m "feat: leerAtributos incluye el letter-spacing en typography"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 2: letter-spacing en px**

Seleccionar un componente con **texto de letter-spacing fijo (px, ≠ 0)** → **Type: Plain** → "Anatomy".
Expected: `typography` muestra `… 16 · LS 0.5`. Type: CSS → `16px Regular Inter · LS 0.5px`.

- [ ] **Step 3: percent y combinado**

- Texto con letter-spacing en **%** → `… · LS 5%`.
- Texto con line-height **y** letter-spacing → `… 16 / 24 · LS 0.5`.

- [ ] **Step 4: Verificar que el resto sigue**

- Un texto con letter-spacing **0** (o mixed) → `typography` sin `· LS` (como en la Rebanada 24).
- Un nodo no-texto → sin `typography`.

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de letter-spacing en typography"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Extracción del letter-spacing | Task 1 (EspaciadoLetra), Task 2 (adaptador) |
| 2 — Formato puro | Task 1 (formatearTipografia) |
| 3 — Atributo de tipografía | Task 3 |
| 4 — Errores y casos límite | Task 2 (≠ 0), Task 3 |
| 5 — Testing | Tasks 1 y 3 (unit), Task 4 (manual) |
