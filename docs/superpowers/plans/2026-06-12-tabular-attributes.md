# Columna de atributos en Tabular Anatomy — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar una columna "Attributes" a la tabla de Tabular Anatomy, con los atributos de cada elemento aplanados como `clave: valor`.

**Architecture:** Solo cambian `HEADERS_ANATOMY` y `filaAnatomy` en `utils/tabla-anatomy.ts`. `tablaDe` ya es genérica (N columnas) y `specDeAnatomy` ya pasa headers + filas, así que el generador no cambia.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/utils/tabla-anatomy.ts` | **Modificar.** `HEADERS_ANATOMY` + `filaAnatomy` con la columna de atributos. |
| `tests/tabla-anatomy.test.ts` | **Modificar.** Tests del nuevo formato. |

---

## Task 1: Columna "Attributes"

**Files:**
- Modify: `tests/tabla-anatomy.test.ts`
- Modify: `src/plugin/utils/tabla-anatomy.ts`

- [ ] **Step 1: Actualizar/escribir los tests**

Reemplazar el contenido de los dos `test(...)` existentes en `tests/tabla-anatomy.test.ts`:

```typescript
test("filaAnatomy → [#, nombre, tipo]", () => {
  const el: ElementoAnatomy = { id: "1", nombre: "Label", tipo: "TEXT", esInstancia: false, atributos: [] };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Label", "TEXT"]);
});

test("HEADERS_ANATOMY son # / Name / Type", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type"]);
});
```

por:

```typescript
test("HEADERS_ANATOMY incluye la columna Attributes", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type", "Attributes"]);
});

test("filaAnatomy sin atributos → celda de atributos vacía", () => {
  const el: ElementoAnatomy = { id: "1", nombre: "Label", tipo: "TEXT", esInstancia: false, atributos: [] };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Label", "TEXT", ""]);
});

test("filaAnatomy aplana los atributos como clave: valor", () => {
  const el: ElementoAnatomy = {
    id: "2",
    nombre: "Box",
    tipo: "FRAME",
    esInstancia: false,
    atributos: [
      { clave: "width", valor: "120", formato: "HARDCODED" },
      { clave: "opacity", valor: "50%", formato: "HARDCODED" },
    ],
  };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Box", "FRAME", "width: 120, opacity: 50%"]);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `HEADERS_ANATOMY` y `filaAnatomy` todavía tienen 3 columnas.

- [ ] **Step 3: Agregar la columna en `src/plugin/utils/tabla-anatomy.ts`**

Reemplazar:

```typescript
export const HEADERS_ANATOMY = ["#", "Name", "Type"];

// Mapea un elemento a una fila de la tabla de Anatomy.
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  return [String(numero), elemento.nombre, elemento.tipo];
}
```

por:

```typescript
export const HEADERS_ANATOMY = ["#", "Name", "Type", "Attributes"];

// Mapea un elemento a una fila de la tabla de Anatomy (con sus atributos aplanados).
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  const attrs = elemento.atributos.map((a) => `${a.clave}: ${a.valor}`).join(", ");
  return [String(numero), elemento.nombre, elemento.tipo, attrs];
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: los 3 tests nuevos PASAN (112 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add tests/tabla-anatomy.test.ts src/plugin/utils/tabla-anatomy.ts
git commit -m "feat: columna Attributes en Tabular Anatomy"
```

---

## Task 2: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 2: Caso feliz**

Seleccionar un componente con elementos que tengan atributos (colores, width, typography…) → **Tabular anatomy ON** → "Anatomy".
Expected: la tabla muestra una columna **Attributes** con `clave: valor, …` por fila, alineada con el resto.
Panel: "✓ Generado".

- [ ] **Step 3: Casos límite**

- Un elemento **sin atributos** → su celda Attributes queda vacía.
- **Tabular anatomy OFF** → la lista de siempre (sin tabla), igual que antes.

- [ ] **Step 4: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de la columna Attributes en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Columna "Attributes" | Task 1 |
| 2 — Errores y casos límite | Task 1 (sin atributos), Task 2 |
| 3 — Testing | Task 1 (unit), Task 2 (manual) |
