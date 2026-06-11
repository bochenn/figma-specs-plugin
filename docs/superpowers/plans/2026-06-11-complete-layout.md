# Complete Layout — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el botón Complete (renombrado "Complete A/L") liste también las variantes cuyo Auto Layout de la raíz difiere del default.

**Architecture:** Se extrae `layoutSpecDe` de `extraerLayout` y se agrega `claveLayout` (serializa la config). `extraerCompleteLayout` (pura) compara la clave de cada variante contra la del default. El generador Complete se extiende para dibujar la sección Complete Layout además de Complete Anatomy.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `VarianteLayout`. |
| `src/plugin/extraccion/layout.ts` | **Modificar.** Extrae `layoutSpecDe`; agrega `claveLayout`. |
| `src/plugin/extraccion/properties.ts` | **Modificar.** `extraerCompleteLayout(set) → VarianteLayout[]`. |
| `src/plugin/generadores/complete.ts` | **Modificar.** `generarCompleteAnatomy` → `generarComplete(nombre, anatomy, layout)`. |
| `src/plugin/main.ts` | **Modificar.** Rama `complete` usa ambas extracciones + `generarComplete`. |
| `src/ui/index.html` | **Modificar.** Renombrar el botón a "Complete A/L". |
| `tests/clave-layout.test.ts` | **Nuevo.** Tests de `claveLayout`. |
| `tests/complete-layout-extraccion.test.ts` | **Nuevo.** Tests de `extraerCompleteLayout`. |

---

## Task 1: `layoutSpecDe` + `claveLayout` (refactor + tipo)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Create: `tests/clave-layout.test.ts`
- Modify: `src/plugin/extraccion/layout.ts`

- [ ] **Step 1: Agregar `VarianteLayout` a `tipos.ts`**

Después de la interfaz `LayoutSpec`, agregar:

```typescript
export interface VarianteLayout {
  variante: string;
  spec: LayoutSpec;
}
```

- [ ] **Step 2: Escribir el test de `claveLayout`**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { claveLayout } from "../src/plugin/extraccion/layout.ts";
import type { LayoutSpec } from "../src/plugin/modelo/tipos.ts";

function spec(padding: number): LayoutSpec {
  return {
    elementoNombre: "Root", tipo: "FRAME", direccion: "VERTICAL",
    alineacionPrimaria: "Start", alineacionContraria: "Start",
    resizingHorizontal: "Fixed", resizingVertical: "Hug",
    padding: { left: padding, top: padding, right: padding, bottom: padding },
    itemSpacing: 8,
  };
}

test("misma config → misma clave", () => {
  assert.equal(claveLayout(spec(8)), claveLayout(spec(8)));
});

test("padding distinto → claves distintas", () => {
  assert.notEqual(claveLayout(spec(8)), claveLayout(spec(16)));
});
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `claveLayout is not a function` / export no encontrado.

- [ ] **Step 4: Refactorizar `src/plugin/extraccion/layout.ts` (extraer `layoutSpecDe`, agregar `claveLayout`)**

Reemplazar la función `extraerLayout` por:

```typescript
// Construye el LayoutSpec de un solo nodo con Auto Layout.
export function layoutSpecDe(nodo: NodoLike): LayoutSpec {
  return {
    elementoNombre: nodo.name,
    tipo: nodo.type,
    direccion: nodo.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL",
    alineacionPrimaria: alineacion(nodo.primaryAxisAlignItems),
    alineacionContraria: alineacion(nodo.counterAxisAlignItems),
    resizingHorizontal: resizing(nodo.layoutSizingHorizontal),
    resizingVertical: resizing(nodo.layoutSizingVertical),
    padding: {
      left: nodo.paddingLeft ?? 0,
      top: nodo.paddingTop ?? 0,
      right: nodo.paddingRight ?? 0,
      bottom: nodo.paddingBottom ?? 0,
    },
    itemSpacing: nodo.itemSpacing ?? 0,
  };
}

// Serializa la config de layout (para comparar entre variantes).
export function claveLayout(spec: LayoutSpec): string {
  const p = spec.padding;
  return `${spec.direccion}|${spec.alineacionPrimaria}|${spec.alineacionContraria}|${spec.resizingHorizontal}|${spec.resizingVertical}|L${p.left}T${p.top}R${p.right}B${p.bottom}|gap${spec.itemSpacing}`;
}

// Produce un LayoutSpec por cada capa con Auto Layout de la selección.
export function extraerLayout(raiz: NodoLike): LayoutSpec[] {
  return recorrerAutoLayout(raiz).map(layoutSpecDe);
}
```

(El bloque `import` y las funciones `alineacion`/`resizing` no cambian.)

- [ ] **Step 5: Correr para verificar que pasa**

Run: `npm test`
Expected: PASA todo (90 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts tests/clave-layout.test.ts src/plugin/extraccion/layout.ts
git commit -m "refactor: layoutSpecDe + claveLayout; tipo VarianteLayout"
```

---

## Task 2: `extraerCompleteLayout`

**Files:**
- Create: `tests/complete-layout-extraccion.test.ts`
- Modify: `src/plugin/extraccion/properties.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerCompleteLayout } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

function varLayout(props: Record<string, string>, layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL", padding: number): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: {
      id: "r", name: "Root", type: "COMPONENT", layoutMode,
      paddingLeft: padding, paddingTop: padding, paddingRight: padding, paddingBottom: padding,
      children: [],
    },
  };
}

test("variante con padding distinto en la raíz → adicional; misma config / sin auto layout → no", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B", "C", "D"] },
    defaultProps: { Tone: "A" },
    variantes: [
      varLayout({ Tone: "A" }, "VERTICAL", 8),
      varLayout({ Tone: "B" }, "VERTICAL", 16),  // padding distinto → adicional
      varLayout({ Tone: "C" }, "VERTICAL", 8),   // igual → no
      varLayout({ Tone: "D" }, "NONE", 8),       // sin auto layout → no
    ],
  };
  const adicionales = extraerCompleteLayout(set);
  assert.equal(adicionales.length, 1);
  assert.equal(adicionales[0].variante, "Tone=B");
  assert.equal(adicionales[0].spec.padding.left, 16);
});

test("todas las variantes con la misma config que el default → []", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [varLayout({ Tone: "A" }, "VERTICAL", 8), varLayout({ Tone: "B" }, "VERTICAL", 8)],
  };
  assert.deepEqual(extraerCompleteLayout(set), []);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `extraerCompleteLayout is not a function` / export no encontrado.

- [ ] **Step 3: Agregar imports y `extraerCompleteLayout` a `src/plugin/extraccion/properties.ts`**

Agregar `VarianteLayout` al import de tipos y el import de los helpers de layout:

```typescript
import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm, DosWaySpec, CombinacionSpec, ElementoAdicional, VarianteLayout, NodoLike } from "../modelo/tipos.ts";
```

```typescript
import { layoutSpecDe, claveLayout } from "./layout.ts";
```

Y al final del archivo agregar:

```typescript
// True si el nodo tiene Auto Layout (horizontal o vertical).
function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Variantes cuyo Auto Layout de la raíz difiere del default.
export function extraerCompleteLayout(set: SetNorm): VarianteLayout[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const claveDefault = tieneAutoLayout(varianteDefault.raiz)
    ? claveLayout(layoutSpecDe(varianteDefault.raiz))
    : null;

  const adicionales: VarianteLayout[] = [];
  for (const variante of set.variantes) {
    if (mismasProps(variante.variantProperties, set.defaultProps)) continue;
    if (!tieneAutoLayout(variante.raiz)) continue;
    const spec = layoutSpecDe(variante.raiz);
    if (claveDefault === null || claveLayout(spec) !== claveDefault) {
      adicionales.push({ variante: etiquetaVariante(variante.variantProperties), spec });
    }
  }
  return adicionales;
}
```

(`buscarVariante`, `mismasProps` y `etiquetaVariante` ya están disponibles en este archivo; `NodoLike` se
agregó al import de tipos en el Step.)

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (92 en total).

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 5: Commit**

```bash
git add tests/complete-layout-extraccion.test.ts src/plugin/extraccion/properties.ts
git commit -m "feat: extraerCompleteLayout (variantes con Auto Layout de raiz distinto)"
```

---

## Task 3: Generador `generarComplete` + main + UI

**Files:**
- Modify: `src/plugin/generadores/complete.ts`
- Modify: `src/plugin/main.ts`
- Modify: `src/ui/index.html`

- [ ] **Step 1: Reemplazar `src/plugin/generadores/complete.ts`**

```typescript
import type { ElementoAdicional, VarianteLayout } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Genera el output de Complete (Anatomy + Layout): elementos adicionales por
// variante y variantes con Auto Layout de la raíz distinto al default.
export async function generarComplete(
  nombre: string,
  anatomy: ElementoAdicional[],
  layout: VarianteLayout[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));

  // Complete Anatomy
  const secA = frameVertical("Complete Anatomy", 64);
  spec.appendChild(secA);
  secA.appendChild(await texto("Complete Anatomy", 48));
  if (anatomy.length === 0) {
    secA.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  for (const a of anatomy) {
    secA.appendChild(await texto(`${a.variante}: ${a.nombre} · ${a.tipo}`, 12));
  }

  // Complete Layout
  const secL = frameVertical("Complete Layout", 64);
  spec.appendChild(secL);
  secL.appendChild(await texto("Complete Layout", 48));
  if (layout.length === 0) {
    secL.appendChild(await texto("No se detectaron layouts adicionales en otras variantes.", 16));
  }
  for (const v of layout) {
    const s = v.spec;
    const dir = s.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
    const bloque = frameVertical(v.variante, 4);
    bloque.appendChild(await texto(v.variante, 16));
    bloque.appendChild(await texto(
      `Direction: ${dir} · Align: ${s.alineacionPrimaria}/${s.alineacionContraria} · Resize: ${s.resizingHorizontal}×${s.resizingVertical} · Padding: L${s.padding.left} T${s.padding.top} R${s.padding.right} B${s.padding.bottom} · Item spacing: ${s.itemSpacing}`,
      12,
    ));
    secL.appendChild(bloque);
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Actualizar `src/plugin/main.ts`**

Reemplazar la línea:

```typescript
import { generarCompleteAnatomy } from "./generadores/complete.ts";
```

por:

```typescript
import { generarComplete } from "./generadores/complete.ts";
```

Reemplazar la línea:

```typescript
import { extraerCompleteAnatomy } from "./extraccion/properties.ts";
```

por:

```typescript
import { extraerCompleteAnatomy, extraerCompleteLayout } from "./extraccion/properties.ts";
```

Y reemplazar la función `generarSeccionComplete` por:

```typescript
async function generarSeccionComplete(nodo: SceneNode): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Complete necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const anatomy = extraerCompleteAnatomy(setNorm);
  const layout = extraerCompleteLayout(setNorm);
  const frame = await generarComplete(componentSet.name, anatomy, layout);
  finalizar(frame, nodo);
}
```

- [ ] **Step 3: Renombrar el botón en `src/ui/index.html`**

Reemplazar:

```html
    <button id="complete">Complete Anatomy</button>
```

por:

```html
    <button id="complete">Complete A/L</button>
```

- [ ] **Step 4: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 92`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/complete.ts src/plugin/main.ts src/ui/index.html
git commit -m "feat: generarComplete (Anatomy + Layout) y boton Complete A/L"
```

---

## Task 4: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un Component Set con una variante de layout distinto**

En Figma: un componente con variantes donde **una variante cambie el Auto Layout de la raíz** (ej. padding
o dirección distinta a las otras).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que el octavo botón ahora dice **"Complete A/L"**.

- [ ] **Step 3: Caso feliz (Complete A/L)**

Seleccionar el Component Set → botón **"Complete A/L"**.
Expected: aparecen **dos secciones**: `Complete Anatomy` (elementos adicionales por variante, como antes) y
`Complete Layout` (las variantes cuyo Auto Layout de la raíz difiere del default, con su config). Output a
la derecha. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/6. Complete Anatomy and Layout/` y comparar. Anotar diferencias (layout de capas internas,
artwork) como pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Component Set sin variantes de layout distinto → "No se detectaron layouts adicionales en otras variantes."
- Frame sin variantes → "Complete necesita un componente con variantes."
- Los otros siete botones siguen andando.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Complete Layout en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Modelo y extracción | Task 1 (layoutSpecDe/claveLayout/tipo), Task 2 (extraerCompleteLayout) |
| 2 — Generador e integración | Task 3 (generarComplete + main + UI) |
| 3 — Errores y casos límite | Task 2 (sin auto layout / default null), Task 3 (validación) |
| 4 — Testing | Tasks 1–2 (unit), Task 4 (manual) |
