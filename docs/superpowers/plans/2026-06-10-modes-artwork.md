# Artwork por mode (Modes) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada mode en la sección Modes muestre el ítem clonado con ese mode aplicado (`setExplicitVariableMode`), además del texto de atributos.

**Architecture:** El dato lleva `coleccionId` (para resolver la collection real). `recolectarModes` lo setea, `agruparModes` lo arrastra. El generador clona el ítem por mode y le aplica el mode con `setExplicitVariableMode`. `main.ts` pasa el nodo real.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `EntradaModo` y `ColeccionModes` suman `coleccionId?`. |
| `src/plugin/variables/modes.ts` | **Modificar.** `agruparModes` arrastra `coleccionId`. |
| `src/plugin/variables/recolectar-modes.ts` | **Modificar.** Setea `coleccionId = collection.id`. |
| `src/plugin/generadores/modes.ts` | **Modificar.** Artwork por mode (clon + `setExplicitVariableMode`); `generarModes(seleccionado, colecciones)`. |
| `src/plugin/main.ts` | **Modificar.** `generarSeccionModes` pasa el nodo real. |
| `tests/agrupar-modes.test.ts` | **Modificar.** Helper con `coleccionId` + assert. |

---

## Task 1: Dato lleva `coleccionId` (tipos + agruparModes)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Modify: `tests/agrupar-modes.test.ts`
- Modify: `src/plugin/variables/modes.ts`

- [ ] **Step 1: Agregar `coleccionId?` a los tipos**

En `src/plugin/modelo/tipos.ts`, en `EntradaModo` agregar (después de `coleccionNombre: string;`):

```typescript
  coleccionId?: string;
```

Y en `ColeccionModes` agregar (después de `coleccionNombre: string;`):

```typescript
  coleccionId?: string;
```

- [ ] **Step 2: Actualizar `tests/agrupar-modes.test.ts`**

Reemplazar la función helper `entrada` por:

```typescript
function entrada(coleccion: string, appliedAs: string, variableNombre: string): EntradaModo {
  return {
    coleccionNombre: coleccion,
    coleccionId: `${coleccion}-id`,
    modos: MODOS,
    capa: "Alert",
    appliedAs,
    variableNombre,
    valores: [{ modeId: "L", valor: "#FFFFFF" }, { modeId: "D", valor: "#000000" }],
  };
}
```

Y en el test `"dos entradas de la misma collection → una ColeccionModes con dos atributos"`, después de
`assert.equal(cols[0].coleccionNombre, "Color");`, agregar:

```typescript
  assert.equal(cols[0].coleccionId, "Color-id");
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `agruparModes` todavía no arrastra `coleccionId` (queda `undefined`).

- [ ] **Step 4: Modificar `agruparModes` en `src/plugin/variables/modes.ts`**

Reemplazar la línea:

```typescript
      g = { coleccionNombre: e.coleccionNombre, modos: e.modos, atributos: [] };
```

por:

```typescript
      g = { coleccionNombre: e.coleccionNombre, coleccionId: e.coleccionId, modos: e.modos, atributos: [] };
```

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (80 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/agrupar-modes.test.ts src/plugin/variables/modes.ts
git commit -m "feat: coleccionId en el dato de Modes (tipos + agruparModes)"
```

---

## Task 2: `recolectarModes` setea `coleccionId`

**Files:**
- Modify: `src/plugin/variables/recolectar-modes.ts`

- [ ] **Step 1: Setear `coleccionId` en la entrada**

En `src/plugin/variables/recolectar-modes.ts`, en el `entradas.push({ ... })` de `visitar`, agregar
`coleccionId: collection.id,` (por ejemplo después de `coleccionNombre: collection.name,`):

```typescript
    entradas.push({
      coleccionNombre: collection.name,
      coleccionId: collection.id,
      modos,
      capa: nodo.name,
      appliedAs,
      variableNombre: variable.name,
      valores,
    });
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/variables/recolectar-modes.ts
git commit -m "feat: recolectarModes setea coleccionId"
```

---

## Task 3: Artwork por mode en el generador

**Files:**
- Modify: `src/plugin/generadores/modes.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Reemplazar `src/plugin/generadores/modes.ts`**

```typescript
import type { ColeccionModes } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

const GRIS_CLARO: RGB = { r: 0.96, g: 0.96, b: 0.96 };

// Bloque de un mode: nombre + artwork (clon con el mode aplicado) + atributos.
async function bloqueMode(
  seleccionado: SceneNode,
  collection: VariableCollection | null,
  modeId: string,
  nombre: string,
  coleccion: ColeccionModes,
): Promise<FrameNode> {
  const bloque = frameVertical(nombre, 8);
  bloque.appendChild(await texto(nombre, 24));

  if (collection) {
    const clon = seleccionado.clone();
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = [{ type: "SOLID", color: GRIS_CLARO }];
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    clon.setExplicitVariableMode(collection, modeId);
    artwork.resize(clon.width, clon.height);
    bloque.appendChild(artwork);
  }

  for (const attr of coleccion.atributos) {
    const v = attr.valores.find((x) => x.modeId === modeId);
    const valor = v ? v.valor : "—";
    bloque.appendChild(await texto(`${attr.appliedAs}: ${attr.variableNombre} (${valor})`, 12));
  }
  return bloque;
}

// Subsección de una collection: heading + un bloque por mode.
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

// Genera el output de Modes. Devuelve el frame Specifications.
export async function generarModes(seleccionado: SceneNode, colecciones: ColeccionModes[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  const seccion = frameVertical("Modes", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Modes", 48));

  if (colecciones.length === 0) {
    seccion.appendChild(await texto("No se detectaron variables con múltiples modes.", 16));
  }
  for (const c of colecciones) {
    seccion.appendChild(await subseccionColeccion(seleccionado, c));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Actualizar `generarSeccionModes` en `src/plugin/main.ts`**

Reemplazar la línea:

```typescript
  const frame = await generarModes(nodo.name, colecciones);
```

por:

```typescript
  const frame = await generarModes(nodo, colecciones);
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

> Nota: si tsc reporta que `setExplicitVariableMode` espera un id en vez del objeto `VariableCollection`,
> usar `clon.setExplicitVariableMode(collection.id, modeId)` (forma antigua de la API).

- [ ] **Step 4: Build y tests**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 80`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/modes.ts src/plugin/main.ts
git commit -m "feat: artwork por mode (clon + setExplicitVariableMode) en Modes"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar una collection de color con 2 modes y variables aplicadas**

En Figma: una variable collection de color con **2 modes** (Light/Dark) con valores distintos, variables
aplicadas al fill/stroke de capas dentro de un frame contenedor (mismo setup que la rebanada de Modes).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Artwork por mode)**

Seleccionar el frame contenedor → botón **"Modes"**.
Expected: por cada collection, cada bloque de mode muestra **el artwork del ítem clonado con ese mode
aplicado** (el Light se ve con los colores Light, el Dark con los Dark) además del texto de atributos. El
output se ubica a la derecha. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/7. Modes/` y comparar. Anotar diferencias (anotaciones sobre el artwork) como pulido — NO
arreglarlas ahora.

- [ ] **Step 5: Verificar que el resto sigue funcionando**

- Frame sin variables con múltiples modes → "Modes" → "No se detectaron variables con múltiples modes."
- Anatomy / Properties / Layout / Data / Styling desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Artwork por mode en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — El dato lleva coleccionId | Task 1 (tipos + agruparModes), Task 2 (recolectar) |
| 2 — Generador con artwork por mode | Task 3 (generador + main) |
| 3 — Errores y casos límite | Task 3 (collection null → sin artwork), main (try/catch) |
| 4 — Testing | Task 1 (agruparModes), Task 4 (manual) |
