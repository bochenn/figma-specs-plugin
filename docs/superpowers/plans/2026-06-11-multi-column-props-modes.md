# Multi-column en Properties y Modes — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el selector "Columns" (1–4) a Properties y Modes, reusando `enColumnas`, con un helper `clampColumnas` compartido por las tres secciones.

**Architecture:** `clampColumnas` (pura) normaliza el valor del select. `main` lo aplica una vez y pasa `columnas` a Layout/Properties/Modes. Los generadores de Properties y Modes juntan sus ítems internos (opciones / modes) y, si columnas > 1, los pasan por `enColumnas`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/utils/columnas.ts` | **Modificar.** Agrega `clampColumnas`. |
| `src/plugin/main.ts` | **Modificar.** Clamp único; pasa `columnas` a las tres secciones. |
| `src/plugin/generadores/properties.ts` | **Modificar.** `generarProperties(..., columnas)`. |
| `src/plugin/generadores/modes.ts` | **Modificar.** `generarModes(..., columnas)`. |
| `tests/columnas.test.ts` | **Modificar.** Tests de `clampColumnas`. |

---

## Task 1: `clampColumnas` + main (clamp único, Layout lo usa)

**Files:**
- Modify: `tests/columnas.test.ts`
- Modify: `src/plugin/utils/columnas.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar los tests de `clampColumnas`**

Al final de `tests/columnas.test.ts`, agregar:

```typescript
import { clampColumnas } from "../src/plugin/utils/columnas.ts";

test("clampColumnas: undefined → 1, fuera de rango se recorta", () => {
  assert.equal(clampColumnas(undefined), 1);
  assert.equal(clampColumnas(0), 1);
  assert.equal(clampColumnas(5), 4);
});

test("clampColumnas: valor válido pasa igual", () => {
  assert.equal(clampColumnas(3), 3);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `clampColumnas` no exportado / no es función.

- [ ] **Step 3: Agregar `clampColumnas` a `src/plugin/utils/columnas.ts`**

Al final del archivo, agregar:

```typescript
// Normaliza el número de columnas del selector al rango 1–4 (1 si viene undefined).
export function clampColumnas(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 4);
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (99 en total).

- [ ] **Step 5: `main.ts` — clamp único y Layout lo usa**

Agregar el import de `clampColumnas`. Buscar la línea:

```typescript
import { anchoContenedor } from "./utils/columnas.ts";
```

Si no existe un import de `./utils/columnas.ts` en `main.ts`, agregar uno nuevo cerca de los otros imports:

```typescript
import { clampColumnas } from "./utils/columnas.ts";
```

(Si ya hay un import desde `./utils/columnas.ts`, sumarle `clampColumnas` a las llaves.)

Reemplazar la firma y el clamp inline de `generarSeccionLayout`:

```typescript
async function generarSeccionLayout(nodo: SceneNode, columnasRaw: number | undefined): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const columnas = Math.min(Math.max(columnasRaw ?? 1, 1), 4);
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo, specs, columnas);
  finalizar(frame, nodo);
}
```

por:

```typescript
async function generarSeccionLayout(nodo: SceneNode, columnas: number): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo, specs, columnas);
  finalizar(frame, nodo);
}
```

En el handler `figma.ui.onmessage`, después de la línea `aplicarTema(msg.dark ?? false);`, agregar:

```typescript
  const columnas = clampColumnas(msg.columnas);
```

Y en el dispatcher, reemplazar:

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, msg.columnas);
```

por:

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, columnas);
```

- [ ] **Step 6: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 99`, `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add tests/columnas.test.ts src/plugin/utils/columnas.ts src/plugin/main.ts
git commit -m "feat: clampColumnas y clamp unico en main"
```

---

## Task 2: Properties en columnas

**Files:**
- Modify: `src/plugin/generadores/properties.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Importar `enColumnas` en `properties.ts`**

Buscar el import desde `./frames.ts` (algo como `import { frameVertical, texto, ... } from "./frames.ts";`) y
sumarle `enColumnas`. Por ejemplo, si dice:

```typescript
import { frameVertical, texto } from "./frames.ts";
```

pasa a:

```typescript
import { frameVertical, texto, enColumnas } from "./frames.ts";
```

(Si el import ya trae otros nombres, conservalos y sumá `enColumnas`.)

- [ ] **Step 2: Cambiar `generarProperties` para usar columnas**

Reemplazar la firma:

```typescript
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
): Promise<FrameNode> {
```

por:

```typescript
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
```

Y reemplazar el loop de propiedades:

```typescript
  for (const prop of propiedades) {
    const subseccion = frameVertical(prop.nombre, 40);
    subseccion.appendChild(await texto(prop.nombre, 36));
    for (const opcion of prop.opciones) {
      const bloque = frameVertical(opcion.nombre, 16);
      bloque.appendChild(await texto(opcion.nombre, 24));
      const target = { ...defaultProps, [prop.nombre]: opcion.nombre };
      bloque.appendChild(await displayOpcion(componentSet, target, opcion.cambios));
      subseccion.appendChild(bloque);
    }
    seccion.appendChild(subseccion);
  }
```

por:

```typescript
  for (const prop of propiedades) {
    const subseccion = frameVertical(prop.nombre, 40);
    subseccion.appendChild(await texto(prop.nombre, 36));
    const bloques: FrameNode[] = [];
    for (const opcion of prop.opciones) {
      const bloque = frameVertical(opcion.nombre, 16);
      bloque.appendChild(await texto(opcion.nombre, 24));
      const target = { ...defaultProps, [prop.nombre]: opcion.nombre };
      bloque.appendChild(await displayOpcion(componentSet, target, opcion.cambios));
      bloques.push(bloque);
    }
    if (columnas > 1) {
      subseccion.appendChild(enColumnas(bloques, columnas));
    } else {
      for (const b of bloques) subseccion.appendChild(b);
    }
    seccion.appendChild(subseccion);
  }
```

- [ ] **Step 3: `main.ts` — pasar columnas a Properties**

Reemplazar la firma de `generarSeccionProperties`:

```typescript
async function generarSeccionProperties(nodo: SceneNode): Promise<void> {
```

por:

```typescript
async function generarSeccionProperties(nodo: SceneNode, columnas: number): Promise<void> {
```

Y dentro, la llamada a `generarProperties(componentSet, propiedades, setNorm.defaultProps)` pasa a
`generarProperties(componentSet, propiedades, setNorm.defaultProps, columnas)` (conservar el nombre de la
variable del set tal cual está en el código).

En el dispatcher, reemplazar:

```typescript
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo);
```

por:

```typescript
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo, columnas);
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 99`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/properties.ts src/plugin/main.ts
git commit -m "feat: Properties en N columnas (opciones)"
```

---

## Task 3: Modes en columnas

**Files:**
- Modify: `src/plugin/generadores/modes.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Importar `enColumnas` en `modes.ts`**

Buscar el import desde `./frames.ts` y sumarle `enColumnas` (igual que en Properties).

- [ ] **Step 2: Cambiar `subseccionColeccion` y `generarModes` para usar columnas**

Reemplazar `subseccionColeccion`:

```typescript
async function subseccionColeccion(seleccionado: SceneNode, coleccion: ColeccionModes): Promise<FrameNode> {
  const sub = frameVertical(coleccion.coleccionNombre, 40);
  sub.appendChild(await texto(coleccion.coleccionNombre, 36));
  const collection = coleccion.coleccionId
    ? figma.variables.getVariableCollectionById(coleccion.coleccionId)
    : null;
  for (const modo of coleccion.modos) {
    sub.appendChild(await bloqueMode(seleccionado, collection, modo.modeId, modo.nombre, coleccion));
  }
  return sub;
}
```

por:

```typescript
async function subseccionColeccion(seleccionado: SceneNode, coleccion: ColeccionModes, columnas: number): Promise<FrameNode> {
  const sub = frameVertical(coleccion.coleccionNombre, 40);
  sub.appendChild(await texto(coleccion.coleccionNombre, 36));
  const collection = coleccion.coleccionId
    ? figma.variables.getVariableCollectionById(coleccion.coleccionId)
    : null;
  const bloques: FrameNode[] = [];
  for (const modo of coleccion.modos) {
    bloques.push(await bloqueMode(seleccionado, collection, modo.modeId, modo.nombre, coleccion));
  }
  if (columnas > 1) {
    sub.appendChild(enColumnas(bloques, columnas));
  } else {
    for (const b of bloques) sub.appendChild(b);
  }
  return sub;
}
```

Reemplazar la firma de `generarModes`:

```typescript
export async function generarModes(seleccionado: SceneNode, colecciones: ColeccionModes[]): Promise<FrameNode> {
```

por:

```typescript
export async function generarModes(seleccionado: SceneNode, colecciones: ColeccionModes[], columnas: number): Promise<FrameNode> {
```

Y en su loop, reemplazar:

```typescript
  for (const c of colecciones) {
    seccion.appendChild(await subseccionColeccion(seleccionado, c));
  }
```

por:

```typescript
  for (const c of colecciones) {
    seccion.appendChild(await subseccionColeccion(seleccionado, c, columnas));
  }
```

- [ ] **Step 3: `main.ts` — pasar columnas a Modes**

Reemplazar la firma de `generarSeccionModes`:

```typescript
async function generarSeccionModes(nodo: SceneNode): Promise<void> {
```

por:

```typescript
async function generarSeccionModes(nodo: SceneNode, columnas: number): Promise<void> {
```

Y dentro, la llamada a `generarModes(...)` pasa a incluir `columnas` como último argumento (conservar los
argumentos previos tal cual están).

En el dispatcher, reemplazar:

```typescript
    else if (msg.seccion === "modes") await generarSeccionModes(nodo);
```

por:

```typescript
    else if (msg.seccion === "modes") await generarSeccionModes(nodo, columnas);
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 99`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/modes.ts src/plugin/main.ts
git commit -m "feat: Modes en N columnas"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 2: Properties en columnas**

Seleccionar un Component Set con una propiedad de **varias opciones** (4+) → **Columns: 3** → "Properties".
Expected: dentro de esa propiedad, las opciones se acomodan en **3 columnas parejas**. Panel: "✓ Generado".

- [ ] **Step 3: Modes en columnas**

Seleccionar un ítem con una variable de **≥2 modes** → **Columns: 2** → "Modes".
Expected: los modes de cada collection se acomodan en **2 columnas**.

- [ ] **Step 4: Verificar 1 columna y que el resto siga**

- Columns: 1 → Properties y Modes apilados verticalmente (como antes).
- Layout sigue respondiendo al selector (Rebanada 18).

- [ ] **Step 5: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de multi-column en Properties y Modes"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — clampColumnas y orquestación | Task 1 |
| 2 — Properties y Modes usan enColumnas | Task 2 (Properties), Task 3 (Modes) |
| 3 — Errores y casos límite | Task 1 (clamp), Task 2/3 (columnas=1) |
| 4 — Testing | Task 1 (unit), Task 4 (manual) |
