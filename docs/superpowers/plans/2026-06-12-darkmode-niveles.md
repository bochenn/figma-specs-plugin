# Dark mode de 3 niveles — Plan de Implementación (Rebanada 32)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dark mode por variables de Figma: colección local "Specs" (Light/Dark), fills generados atados a variables, toggle Dark = modo explícito del frame generado, según `docs/superpowers/specs/2026-06-12-darkmode-niveles-design.md`.

**Architecture:** `utils/variables-tema.ts` (impuro) asegura la colección y las tres variables de forma idempotente y las guarda en estado de módulo. `fillTematizado` (frames.ts) crea fills atados; lo usan `texto()`, los cinco puntos de artwork y `finalizar()`. El toggle deja de hornear: setea (o no) el modo explícito Dark. `tema.ts` y su test se eliminan (aprobado).

**Tech Stack:** TypeScript sin dependencias, API de variables de Figma (`figma.variables`), `node --test`, esbuild.

---

## Estructura de archivos

- **Crear** `src/plugin/utils/variables-tema.ts`.
- **Modificar** `src/plugin/generadores/frames.ts` (helper + `texto()`).
- **Modificar** `src/plugin/generadores/anatomy.ts:100`, `layout.ts:115`, `properties.ts:42,122`, `modes.ts:4,22` (fondos de artwork).
- **Modificar** `src/plugin/main.ts` (asegurar variables, `finalizar`, toggle).
- **Eliminar** `src/plugin/utils/tema.ts` y `tests/tema.test.ts`.

---

### Task 1: Colección y variables (`utils/variables-tema.ts`)

Módulo impuro (sin test unitario; verificación manual en Task 4).

**Files:**
- Create: `src/plugin/utils/variables-tema.ts`

- [ ] **Step 1: Crear el módulo**

```typescript
// Colección local "Specs" con modos Light/Dark y las variables de tema.
// Todo idempotente: regenerar no duplica colecciones, modos ni variables.

export interface VarsTema {
  coleccion: VariableCollection;
  modoLight: string;   // modeId
  modoDark: string;
  texto: Variable;
  fondoSpec: Variable;
  fondoArtwork: Variable;
}

const COLORES: Record<string, { light: RGB; dark: RGB }> = {
  "texto": { light: { r: 0, g: 0, b: 0 }, dark: { r: 0.95, g: 0.95, b: 0.95 } },
  "fondo-spec": { light: { r: 1, g: 1, b: 1 }, dark: { r: 0.12, g: 0.12, b: 0.14 } },
  "fondo-artwork": { light: { r: 0.96, g: 0.96, b: 0.96 }, dark: { r: 0.08, g: 0.09, b: 0.1 } },
};

let actual: VarsTema | null = null;

export async function asegurarVariablesTema(): Promise<VarsTema> {
  const colecciones = await figma.variables.getLocalVariableCollectionsAsync();
  const coleccion = colecciones.find((c) => c.name === "Specs")
    ?? figma.variables.createVariableCollection("Specs");

  let modoLight = coleccion.modes.find((m) => m.name === "Light")?.modeId;
  if (!modoLight) {
    modoLight = coleccion.modes[0].modeId;
    coleccion.renameMode(modoLight, "Light");
  }
  let modoDark = coleccion.modes.find((m) => m.name === "Dark")?.modeId;
  if (!modoDark) modoDark = coleccion.addMode("Dark");

  const locales = await figma.variables.getLocalVariablesAsync("COLOR");
  const variables: Record<string, Variable> = {};
  for (const nombre of Object.keys(COLORES)) {
    let v = locales.find((x) => x.variableCollectionId === coleccion.id && x.name === nombre);
    if (!v) v = figma.variables.createVariable(nombre, coleccion, "COLOR");
    v.setValueForMode(modoLight, COLORES[nombre].light);
    v.setValueForMode(modoDark, COLORES[nombre].dark);
    variables[nombre] = v;
  }

  actual = {
    coleccion,
    modoLight,
    modoDark,
    texto: variables["texto"],
    fondoSpec: variables["fondo-spec"],
    fondoArtwork: variables["fondo-artwork"],
  };
  return actual;
}

// Las últimas variables aseguradas (falla si nadie llamó a asegurarVariablesTema).
export function varsTema(): VarsTema {
  if (!actual) throw new Error("asegurarVariablesTema() no fue llamada antes de generar");
  return actual;
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/utils/variables-tema.ts
git commit -m "feat: colección Specs con modos Light/Dark y variables de tema"
```

---

### Task 2: Binding en generadores y main

**Files:**
- Modify: `src/plugin/generadores/frames.ts:1-40`
- Modify: `src/plugin/generadores/anatomy.ts:100`
- Modify: `src/plugin/generadores/layout.ts:115`
- Modify: `src/plugin/generadores/properties.ts:42,122`
- Modify: `src/plugin/generadores/modes.ts:4,22`
- Modify: `src/plugin/main.ts:3,39-49,211`

- [ ] **Step 1: Helper y `texto()` en `frames.ts`**

Reemplazar el import de tema (línea 3):

```typescript
import { varsTema } from "../utils/variables-tema.ts";
```

Agregar el helper después de los imports:

```typescript
// Fill SOLID atado a una variable de tema (se re-tematiza al cambiar el modo en Figma).
export function fillTematizado(variable: Variable): Paint[] {
  const base: SolidPaint = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  return [figma.variables.setBoundVariableForPaint(base, "color", variable)];
}
```

En `texto()`, reemplazar:

```typescript
  t.fills = [{ type: "SOLID", color: temaActual().texto }];
```

por:

```typescript
  t.fills = fillTematizado(varsTema().texto);
```

- [ ] **Step 2: Fondos de artwork en los cuatro generadores**

En cada archivo, sumar a los imports de `./frames.ts` el helper `fillTematizado`, e importar
`varsTema` de `../utils/variables-tema.ts`. Reemplazos:

`src/plugin/generadores/anatomy.ts:100`:

```typescript
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
```

`src/plugin/generadores/layout.ts:115` (en `artworkDe`): mismo reemplazo de la línea
`artwork.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];`.

`src/plugin/generadores/properties.ts:42` y `:122`: mismo reemplazo de las dos líneas
`artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];`.

`src/plugin/generadores/modes.ts`: borrar la constante `GRIS_CLARO` (línea 4) y reemplazar la
línea 22 `artwork.fills = [{ type: "SOLID", color: GRIS_CLARO }];` por el mismo reemplazo.

(Si `GRIS(0.96)` queda sin otros usos en `properties.ts`, conservar `GRIS` solo si lo usan otros
puntos del archivo; en `anatomy.ts` `GRIS` sigue usándose para el borde de swatches.)

- [ ] **Step 3: `main.ts` — asegurar variables, toggle y `finalizar`**

Reemplazar el import (línea 3):

```typescript
import { asegurarVariablesTema, varsTema } from "./utils/variables-tema.ts";
import { fillTematizado } from "./generadores/frames.ts";
```

Agregar el estado del toggle junto a las demás declaraciones del módulo (antes de `finalizar`):

```typescript
let modoOscuro = false;
```

En `finalizar`, reemplazar:

```typescript
  const fondo = temaActual().fondo;
  frame.fills = fondo ? [{ type: "SOLID", color: fondo }] : [];
```

por:

```typescript
  frame.fills = fillTematizado(varsTema().fondoSpec);
  if (modoOscuro) {
    frame.setExplicitVariableModeForCollection(varsTema().coleccion, varsTema().modoDark);
  }
```

En el `onmessage`, reemplazar:

```typescript
  aplicarTema(msg.dark ?? false);
```

por:

```typescript
  modoOscuro = msg.dark ?? false;
  await asegurarVariablesTema();
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; PASS (tema.test.ts todavía existe y pasa: tema.ts aún no se borró).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/frames.ts src/plugin/generadores/anatomy.ts src/plugin/generadores/layout.ts src/plugin/generadores/properties.ts src/plugin/generadores/modes.ts src/plugin/main.ts
git commit -m "feat: fills atados a variables de tema y toggle Dark por modo explícito"
```

---

### Task 3: Eliminar `tema.ts`

**Files:**
- Delete: `src/plugin/utils/tema.ts`
- Delete: `tests/tema.test.ts`

- [ ] **Step 1: Borrar (aprobado en el brainstorming)**

```bash
git rm src/plugin/utils/tema.ts tests/tema.test.ts
```

- [ ] **Step 2: Build y suite**

Run: `npm run build && node --test`
Expected: build OK (no quedan imports de tema.ts); la suite pierde solo los tests de tema.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: eliminar tema.ts horneado (reemplazado por variables de tema)"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

1. Generar Anatomy → Appearance → Local variables → **Specs** → modo **Dark** en la página →
   todo el output se oscurece en vivo (nivel página).
2. Toggle Dark del plugin ON → el Specifications sale Dark aunque la página esté Light (nivel
   spec); OFF → hereda la página.
3. Modo Dark solo en un artwork → solo ese fondo se oscurece (nivel artwork).
4. Regenerar varias veces → una sola colección "Specs", 3 variables, sin duplicados.
5. Marcadores de Layout y overlays legibles en ambos modos.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A
git commit -m "fix: ajustes de dark mode por variables"
```
