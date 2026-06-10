# Properties Boolean + highlight — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a Properties una subsección por cada propiedad booleana, con resaltado azul de las capas que cada booleana controla sobre un clon del variante default.

**Architecture:** Un helper pure `nombrePropiedad` limpia el nombre. El render se hace dentro de `generarProperties` (que ya tiene el `componentSet`): detecta las booleanas en `componentPropertyDefinitions`, recorre el variante default acumulando `x`/`y` para encontrar las capas cuya `componentPropertyReferences.visible` coincide, y dibuja rects azules sobre un clon.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/utils/propiedades.ts` | **Nuevo.** `nombrePropiedad(clave) → string`. Pura. |
| `src/plugin/generadores/properties.ts` | **Modificar.** Subsección por booleana + highlight, dentro de `generarProperties`. |
| `tests/nombre-propiedad.test.ts` | **Nuevo.** Tests de `nombrePropiedad`. |

`main.ts` no cambia (la booleana se renderiza dentro de `generarProperties`).

---

## Task 1: `nombrePropiedad`

**Files:**
- Create: `tests/nombre-propiedad.test.ts`
- Create: `src/plugin/utils/propiedades.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { nombrePropiedad } from "../src/plugin/utils/propiedades.ts";

test("saca el sufijo #id", () => {
  assert.equal(nombrePropiedad("Show icon#8:0"), "Show icon");
});

test("sin # devuelve igual", () => {
  assert.equal(nombrePropiedad("Variant"), "Variant");
});

test("string vacío → vacío", () => {
  assert.equal(nombrePropiedad(""), "");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/utils/propiedades.ts"`.

- [ ] **Step 3: Crear `src/plugin/utils/propiedades.ts`**

```typescript
// Saca el sufijo "#id" de la clave de una propiedad de componente.
export function nombrePropiedad(clave: string): string {
  const i = clave.indexOf("#");
  return i >= 0 ? clave.slice(0, i) : clave;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (83 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/nombre-propiedad.test.ts src/plugin/utils/propiedades.ts
git commit -m "feat: nombrePropiedad (saca el sufijo #id)"
```

---

## Task 2: Subsección por booleana + highlight en el generador

**Files:**
- Modify: `src/plugin/generadores/properties.ts`

- [ ] **Step 1: Agregar los imports en `properties.ts`**

Después de la línea `import { hexARgb } from "../utils/color.ts";`, agregar:

```typescript
import { nombrePropiedad } from "../utils/propiedades.ts";
```

- [ ] **Step 2: Agregar el color de highlight y los helpers de booleana**

Justo después de la línea `const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });`, agregar:

```typescript
const AZUL_HL: RGB = { r: 0.05, g: 0.4, b: 0.85 };

// Recorre el variante default (offset acumulado) y, por cada nodo cuya
// visibilidad referencia la booleana, dibuja un rect azul en el artwork y junta
// su nombre. Frena en instancias.
function resaltarBoolean(node: SceneNode, offX: number, offY: number, propKey: string, artwork: FrameNode, nombres: string[]): void {
  const refs = (node as { componentPropertyReferences?: { visible?: string } | null }).componentPropertyReferences;
  if (refs && refs.visible === propKey) {
    const rect = figma.createRectangle();
    rect.x = offX;
    rect.y = offY;
    rect.resize(Math.max(node.width, 0.01), Math.max(node.height, 0.01));
    rect.fills = [{ type: "SOLID", color: AZUL_HL, opacity: 0.3 }];
    artwork.appendChild(rect);
    nombres.push(node.name);
  }
  if (node.type === "INSTANCE") return;
  if ("children" in node) {
    for (const c of node.children) resaltarBoolean(c, offX + c.x, offY + c.y, propKey, artwork, nombres);
  }
}

// Subsección de una propiedad booleana: heading + artwork (clon con highlights) + capas afectadas.
async function subseccionBoolean(componentSet: ComponentSetNode, nombre: string, propKey: string): Promise<FrameNode> {
  const sub = frameVertical(nombre, 40);
  sub.appendChild(await texto(nombre, 36));

  const nombres: string[] = [];
  const defaultVariant = componentSet.defaultVariant;
  if (defaultVariant) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.clipsContent = false;
    artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
    const clon = defaultVariant.clone();
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    artwork.resize(clon.width, clon.height);
    // Detecta sobre el variante original (geometría idéntica al clon) y dibuja en el artwork.
    resaltarBoolean(defaultVariant, 0, 0, propKey, artwork, nombres);
    sub.appendChild(artwork);
  }

  sub.appendChild(await texto(`Affected layers: ${nombres.length ? nombres.join(", ") : "—"}`, 12));
  return sub;
}
```

- [ ] **Step 3: Renderizar las booleanas en `generarProperties`**

En `generarProperties`, justo antes de la línea `figma.currentPage.appendChild(specifications);`, agregar:

```typescript
  const defs = componentSet.componentPropertyDefinitions;
  for (const clave of Object.keys(defs)) {
    if (defs[clave].type === "BOOLEAN") {
      seccion.appendChild(await subseccionBoolean(componentSet, nombrePropiedad(clave), clave));
    }
  }
```

(`seccion` es el frame `Properties` que ya existe en `generarProperties`; las booleanas se agregan después de las subsecciones de Variant.)

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

> Nota: si tsc se queja del acceso a `componentPropertyReferences`, el cast inline del helper ya lo cubre;
> si se queja de `componentPropertyDefinitions[clave].type`, comparar contra `"BOOLEAN"` como string es válido.

- [ ] **Step 5: Build y tests**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 83`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/properties.ts
git commit -m "feat: subseccion Boolean con highlight azul en Properties"
```

---

## Task 3: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un Component Set con una propiedad booleana**

En Figma: un componente con variantes y además una **propiedad booleana** (Component property → Boolean)
que controle la **visibilidad** de una o dos capas (en el panel, "Apply boolean property" sobre el toggle
de visibilidad de esas capas).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin.

- [ ] **Step 3: Caso feliz (Boolean + highlight)**

Seleccionar el Component Set → botón **"Properties"**.
Expected: después de las subsecciones de Variant, aparece una subsección por cada **booleana** con: el
nombre limpio (sin `#id`), un **artwork** = clon del variante default con **rects azules** semitransparentes
sobre las capas que la booleana controla, y `Affected layers: ...` con sus nombres. El output a la derecha.
Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/2. properties/` y comparar el highlight de booleanas. Anotar diferencias (ON/OFF) como
pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Component Set **sin** booleanas → solo subsecciones Variant (como antes).
- Booleana que no controla capas visibles → "Affected layers: —".
- Anatomy / Layout / Data / Styling / Modes desde sus botones.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Properties Boolean en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Detección y helper pure | Task 1 (nombrePropiedad), Task 2 (detección en el generador) |
| 2 — Subsección por booleana + highlight | Task 2 |
| 3 — Errores y casos límite | Task 2 (sin defaultVariant / sin capas) |
| 4 — Testing | Task 1 (unit), Task 3 (manual) |
