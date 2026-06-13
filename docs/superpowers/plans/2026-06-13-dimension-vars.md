# Variables de width/height resueltas — Plan de Implementación (Rebanada 36)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El atributo `width` de Anatomy muestra la variable atada (nombre + valor) y se agrega `height` cuando está atado a una variable, según `docs/superpowers/specs/2026-06-13-dimension-vars-design.md`.

**Architecture:** Helper `dimensionAtributo` en `atributos.ts` arma el `Atributo` (VARIABLE+rawValue o HARDCODED). `widthVariableName`/`heightVariableName` viajan por `NodoLike`; el adaptador los resuelve desde `boundVariables`. Sin cambios de UI ni de los renderizadores (ya muestran `clave: valor (raw)`).

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: Modelo + lógica + tests — TDD

**Files:** Modify `modelo/tipos.ts` (`NodoLike`), `utils/atributos.ts`; Test `tests/atributos.test.ts`.

- [ ] Tests que fallan (agregar a `tests/atributos.test.ts`):

```typescript
test("width con variable atada → VARIABLE + rawValue", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 343, widthVariableName: "DS Sizing/iOS width" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "DS Sizing/iOS width", formato: "VARIABLE", rawValue: "343" },
  );
});

test("height sin variable → no aparece", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 200 };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "height"), undefined);
});

test("height con variable atada → aparece como VARIABLE", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 48, heightVariableName: "DS Sizing/button" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "height"),
    { clave: "height", valor: "DS Sizing/button", formato: "VARIABLE", rawValue: "48" },
  );
});
```

(El test existente "incluye width cuando está presente (sin swatch)" no cambia: width sin variable
sigue HARDCODED `"240"`.)

- [ ] `NodoLike` (en `modelo/tipos.ts`, junto a `fillVariableName`/`strokeVariableName`):

```typescript
  widthVariableName?: string;
  heightVariableName?: string;
```

- [ ] En `utils/atributos.ts`, agregar el helper antes de `leerAtributos`:

```typescript
// Atributo de dimensión: VARIABLE (nombre + rawValue) si hay variable atada;
// HARDCODED (valor pelado) si no.
function dimensionAtributo(clave: string, px: number, nombreVar?: string): Atributo {
  const valorFmt = formatearEspaciado(px, unidadActual());
  if (nombreVar) return { clave, valor: nombreVar, formato: "VARIABLE", rawValue: valorFmt };
  return { clave, valor: valorFmt, formato: "HARDCODED" };
}
```

y reemplazar el bloque de width por:

```typescript
  if (typeof nodo.width === "number") {
    atributos.push(dimensionAtributo("width", nodo.width, nodo.widthVariableName));
  }
  if (typeof nodo.height === "number" && nodo.heightVariableName) {
    atributos.push(dimensionAtributo("height", nodo.height, nodo.heightVariableName));
  }
```

- [ ] Suite verde → commit `feat: width/height muestran la variable atada (dimensionAtributo)`.

### Task 2: Extracción (`adaptador.ts`)

**Files:** Modify `src/plugin/extraccion/adaptador.ts`.

- [ ] En el bloque `boundVariables`, ampliar el tipo y resolver width/height:

```typescript
    const bv = nodo.boundVariables as {
      fills?: readonly VariableAlias[];
      strokes?: readonly VariableAlias[];
      width?: VariableAlias;
      height?: VariableAlias;
    };
```

y antes de cerrar el bloque (tras strokes):

```typescript
    if (bv.width) { const n = nombreVariable(bv.width.id); if (n) base.widthVariableName = n; }
    if (bv.height) { const n = nombreVariable(bv.height.id); if (n) base.heightVariableName = n; }
```

- [ ] Build + suite → commit `feat: extraer variables de width/height del nodo`.

### Task 3: Verificación

`npm run build && node --test` verdes. Manual: frame con width atado a variable → `width: <nombre>
(343)`; height atado → aparece; sin variables → solo width numérico; Units = rem → rawValue en rem.
