# Recorrer dentro de instancias (DesignDoc 2/3) — Plan (Rebanada B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toggle "Itemize instances" que hace que Anatomy y Layout entren recursivamente en las instancias y listen sus capas internas con prefijo `↳`+sangría, según `docs/superpowers/specs/2026-06-16-itemize-instancias-design.md`.

**Architecture:** Los dos recorridos (`recorrer`, `recorrerAutoLayout`) ganan `itemizar` y devuelven `{nodo, profundidad}[]` (la profundidad cuenta instancias atravesadas). El modelo lleva `profundidad?` (solo si >0). Un util puro `prefijoProfundidad` arma el `↳`+sangría que los generadores anteponen. Toggle nuevo cableado por `MensajeUI`.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: `recorrer` (Anatomy) con itemizar + profundidad — TDD

**Files:**
- Modify: `src/plugin/traversal/recorrer.ts`
- Test: `tests/recorrer.test.ts`

- [ ] **Step 1: Actualizar tests existentes + agregar casos** — en `tests/recorrer.test.ts`, los
asserts pasan de `.map((n) => n.id)` a `.map((r) => r.nodo.id)`. El caso "nodo sin hijos" pasa de
`assert.deepEqual(recorrer(raiz), [])` (sigue `[]`). Y agregar:

```typescript
test("con itemizar entra en la instancia y marca profundidad +1", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [
      nodo({ id: "boton", type: "INSTANCE", children: [nodo({ id: "label-interno", type: "TEXT" })] }),
    ],
  });
  const r = recorrer(raiz, true);
  assert.deepEqual(r.map((x) => [x.nodo.id, x.profundidad]), [["boton", 0], ["label-interno", 1]]);
});

test("frame normal mantiene la profundidad del contexto", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [nodo({ id: "grupo", type: "FRAME", children: [nodo({ id: "hijo", type: "TEXT" })] })],
  });
  assert.deepEqual(recorrer(raiz, true).map((x) => [x.nodo.id, x.profundidad]), [["grupo", 0], ["hijo", 0]]);
});

test("itemizar es recursivo (instancia dentro de instancia)", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [nodo({ id: "a", type: "INSTANCE", children: [
      nodo({ id: "b", type: "INSTANCE", children: [nodo({ id: "c", type: "TEXT" })] }),
    ] })],
  });
  assert.deepEqual(recorrer(raiz, true).map((x) => [x.nodo.id, x.profundidad]), [["a", 0], ["b", 1], ["c", 2]]);
});
```

(Los tests "frena en instancias" y "frames" siguen pero con `.map((r) => r.nodo.id)`; sin `itemizar`
la instancia no se itemiza.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/recorrer.test.ts`
Expected: FAIL (shape `{nodo,profundidad}` aún no existe).

- [ ] **Step 3: Implementar** — reemplazar `src/plugin/traversal/recorrer.ts` por:

```typescript
import type { NodoLike } from "../modelo/tipos.ts";

export interface Recorrido { nodo: NodoLike; profundidad: number; }

const TIPOS_INSTANCIA = "INSTANCE";
const TIPOS_CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

// Recorre los descendientes y devuelve la lista plana con su profundidad.
// La profundidad cuenta instancias atravesadas: frame normal mantiene la del
// contexto; al entrar en una instancia (solo con itemizar) sube +1.
export function recorrer(nodo: NodoLike, itemizar = false, prof = 0): Recorrido[] {
  const elementos: Recorrido[] = [];
  for (const hijo of nodo.children ?? []) {
    elementos.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === TIPOS_INSTANCIA) {
      if (itemizar) elementos.push(...recorrer(hijo, itemizar, prof + 1));
    } else if (TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo, itemizar, prof));
    }
  }
  return elementos;
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/recorrer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/traversal/recorrer.ts tests/recorrer.test.ts
git commit -m "feat: recorrer con itemizar y profundidad (DesignDoc B)"
```

---

### Task 2: `recorrerAutoLayout` (Layout) con itemizar + profundidad — TDD

**Files:**
- Modify: `src/plugin/traversal/recorrer-autolayout.ts`
- Test: `tests/recorrer-autolayout.test.ts`

- [ ] **Step 1: Actualizar tests + agregar caso** — en `tests/recorrer-autolayout.test.ts`, los
asserts pasan de `.map((n) => n.id)` a `.map((r) => r.nodo.id)`. Agregar:

```typescript
test("con itemizar entra en la instancia con Auto Layout (profundidad +1)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz, true).map((r) => [r.nodo.id, r.profundidad]), [["r", 0], ["i", 1], ["x", 1]]);
});
```

(El test "frena en instancias" sin `itemizar` sigue dando `["r"]`, con `.map((r) => r.nodo.id)`.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/recorrer-autolayout.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar** — reemplazar `src/plugin/traversal/recorrer-autolayout.ts` por:

```typescript
import type { NodoLike } from "../modelo/tipos.ts";
import type { Recorrido } from "./recorrer.ts";

const CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Nodos con Auto Layout y su profundidad (instancias atravesadas). Sin itemizar
// frena en instancias; con itemizar entra (prof +1). La raíz va con prof 0.
export function recorrerAutoLayout(nodo: NodoLike, itemizar = false, prof = 0): Recorrido[] {
  const resultado: Recorrido[] = [];
  if (tieneAutoLayout(nodo)) resultado.push({ nodo, profundidad: prof });
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "INSTANCE") {
      if (itemizar) resultado.push(...recorrerAutoLayout(hijo, itemizar, prof + 1));
    } else if (CONTENEDOR.includes(hijo.type)) {
      resultado.push(...recorrerAutoLayout(hijo, itemizar, prof));
    }
  }
  return resultado;
}
```

Nota: la raíz se agrega con `prof` (0 en la llamada inicial; en recursión sobre una instancia, la
instancia entra como raíz de su subllamada con `prof+1`, por eso `i` queda en 1).

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/recorrer-autolayout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/traversal/recorrer-autolayout.ts tests/recorrer-autolayout.test.ts
git commit -m "feat: recorrerAutoLayout con itemizar y profundidad (DesignDoc B)"
```

---

### Task 3: Modelo y extracción — TDD

**Files:**
- Modify: `src/plugin/modelo/tipos.ts` (`ElementoAnatomy`, `LayoutSpec`)
- Modify: `src/plugin/extraccion/anatomy.ts`, `src/plugin/extraccion/layout.ts`
- Test: `tests/anatomy-extraccion.test.ts`, `tests/layout-extraccion.test.ts`

- [ ] **Step 1: Tests que fallan**

En `tests/anatomy-extraccion.test.ts`, agregar:
```typescript
test("extraerAnatomy con itemizar incluye capas internas con profundidad", () => {
  const raiz: NodoLike = {
    id: "r", name: "card", type: "FRAME",
    children: [{ id: "t", name: "tag", type: "INSTANCE", children: [{ id: "l", name: "Label", type: "TEXT" }] }],
  };
  const els = extraerAnatomy(raiz, true);
  assert.deepEqual(els.map((e) => [e.nombre, e.profundidad ?? 0]), [["tag", 0], ["Label", 1]]);
});
```
(Verificar el import de `NodoLike` en ese test; si no está, agregarlo.)

En `tests/layout-extraccion.test.ts`, agregar:
```typescript
test("extraerLayout con itemizar marca profundidad de la instancia interna", () => {
  const raiz: NodoLike = {
    id: "r", name: "card", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "t", name: "tag", type: "INSTANCE", layoutMode: "HORIZONTAL", children: [] }],
  };
  const specs = extraerLayout(raiz, true);
  assert.deepEqual(specs.map((s) => [s.elementoNombre, s.profundidad ?? 0]), [["card", 0], ["tag", 1]]);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/anatomy-extraccion.test.ts tests/layout-extraccion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Modelo** — en `src/plugin/modelo/tipos.ts`:
  - `ElementoAnatomy` += `profundidad?: number;` (instancias atravesadas; ausente = 0).
  - `LayoutSpec` += `profundidad?: number;`.

- [ ] **Step 4: Extracción Anatomy** — en `src/plugin/extraccion/anatomy.ts`:

```typescript
export function extraerAnatomy(nodoRaiz: NodoLike, itemizar = false): ElementoAnatomy[] {
  return recorrer(nodoRaiz, itemizar).map(({ nodo, profundidad }) => {
    const esInstancia = nodo.type === "INSTANCE";
    const elemento: ElementoAnatomy = {
      id: nodo.id,
      nombre: nodo.name,
      tipo: nodo.type,
      esInstancia,
      atributos: leerAtributos(nodo),
    };
    if (esInstancia && nodo.mainComponentName) elemento.dependeDe = nodo.mainComponentName;
    if (profundidad > 0) elemento.profundidad = profundidad;
    return elemento;
  });
}
```

- [ ] **Step 5: Extracción Layout** — en `src/plugin/extraccion/layout.ts`:
  - `layoutSpecDe(nodo: NodoLike, profundidad = 0)`: antes del `return spec;`, agregar
    `if (profundidad > 0) spec.profundidad = profundidad;`.
  - `extraerLayout(raiz: NodoLike, itemizar = false)`:
    `return recorrerAutoLayout(raiz, itemizar).map((r) => layoutSpecDe(r.nodo, r.profundidad));`

- [ ] **Step 6: Correr la suite y verificar que pasa**

Run: `node --test`
Expected: PASS (los `deepEqual` de profundidad 0 no cambian porque el campo se omite cuando es 0).

- [ ] **Step 7: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/extraccion/anatomy.ts src/plugin/extraccion/layout.ts tests/anatomy-extraccion.test.ts tests/layout-extraccion.test.ts
git commit -m "feat: extracción propaga profundidad de instancias (DesignDoc B)"
```

---

### Task 4: `prefijoProfundidad` (util puro) — TDD

**Files:**
- Create: `src/plugin/utils/jerarquia.ts`
- Test: `tests/jerarquia.test.ts`

- [ ] **Step 1: Test que falla** — crear `tests/jerarquia.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { prefijoProfundidad } from "../src/plugin/utils/jerarquia.ts";

test("profundidad 0 → sin prefijo", () => {
  assert.equal(prefijoProfundidad(0), "");
});

test("profundidad >0 → sangría + flecha por nivel", () => {
  assert.equal(prefijoProfundidad(1), "  ↳ ");
  assert.equal(prefijoProfundidad(2), "    ↳ ");
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/jerarquia.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar** — crear `src/plugin/utils/jerarquia.ts`:

```typescript
// Prefijo para una capa que vino de adentro de N instancias: sangría + "↳".
// profundidad 0 → "" (capa propia del componente).
export function prefijoProfundidad(profundidad: number): string {
  return profundidad > 0 ? "  ".repeat(profundidad) + "↳ " : "";
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/jerarquia.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/jerarquia.ts tests/jerarquia.test.ts
git commit -m "feat: prefijoProfundidad para marcar capas internas de instancias (DesignDoc B)"
```

---

### Task 5: Generadores — aplicar el prefijo

**Files:**
- Modify: `src/plugin/utils/tabla-anatomy.ts` (tabla)
- Modify: `src/plugin/generadores/anatomy.ts` (lista)
- Modify: `src/plugin/generadores/layout.ts` (título de fila)

- [ ] **Step 1: Tabla de Anatomy** — en `src/plugin/utils/tabla-anatomy.ts`, importar y usar el
prefijo en la celda Name:

```typescript
import { prefijoProfundidad } from "./jerarquia.ts";
```
```typescript
export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  const attrs = elemento.atributos
    .map((a) => (a.rawValue ? `${a.clave}: ${a.valor} (${a.rawValue})` : `${a.clave}: ${a.valor}`))
    .join(", ");
  const nombre = prefijoProfundidad(elemento.profundidad ?? 0) + elemento.nombre;
  return [String(numero), nombre, elemento.tipo, attrs];
}
```

- [ ] **Step 2: Lista de Anatomy** — en `src/plugin/generadores/anatomy.ts`, importar
`prefijoProfundidad` (de `../utils/jerarquia.ts`) y anteponerlo en `entradaLista`:

```typescript
async function entradaLista(indice: number, el: ElementoAnatomy): Promise<FrameNode> {
  const pref = prefijoProfundidad(el.profundidad ?? 0);
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  fila.appendChild(await texto(`${indice}. ${pref}${el.nombre} · ${el.tipo}`, 16));
  if (el.dependeDe) {
    fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  }
  for (const attr of el.atributos) {
    fila.appendChild(await filaAtributo(attr));
  }
  return fila;
}
```

- [ ] **Step 3: Layout** — en `src/plugin/generadores/layout.ts`, importar `prefijoProfundidad` y
anteponerlo en la primera línea de `exhibit`:

```typescript
  fila.appendChild(await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16));
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/tabla-anatomy.ts src/plugin/generadores/anatomy.ts src/plugin/generadores/layout.ts
git commit -m "feat: generadores anteponen ↳ a las capas internas de instancias (DesignDoc B)"
```

---

### Task 6: Plumbing — toggle, mensaje y main

**Files:**
- Modify: `src/ui/index.html`, `src/ui/ui.ts`, `src/plugin/modelo/tipos.ts` (`MensajeUI`)
- Modify: `src/plugin/main.ts`, `src/plugin/generadores/layout.ts` (firma `generarLayout`)

- [ ] **Step 1: UI** — en `src/ui/index.html`, en la sección Opciones (junto a los otros toggles),
agregar:
```html
        <label class="toggle"><input type="checkbox" id="itemizar" /> Itemize instances</label>
```
En `src/ui/ui.ts`, junto a las otras refs: `const itemizarCheck = document.getElementById("itemizar") as HTMLInputElement;`
y agregar al `pluginMessage`: `itemizar: itemizarCheck.checked,`.

- [ ] **Step 2: `MensajeUI`** — en `src/plugin/modelo/tipos.ts`, agregar `itemizar?: boolean;` al
type `MensajeUI` (junto a `hideOuter?`).

- [ ] **Step 3: main — Anatomy** — `generarSeccionAnatomy(nodo, nested, tabla, itemizar)`:
reemplazar `extraerAnatomy(aNodoLike(nodo))` por `extraerAnatomy(aNodoLike(nodo), itemizar)` (las
dos ocurrencias: la principal y la del `.map` de `nestedSpecs`). En el dispatch:
`await generarSeccionAnatomy(nodo, msg.nested ?? false, msg.tabla ?? false, msg.itemizar ?? false);`

- [ ] **Step 4: main — Layout** — `generarSeccionLayout(nodo, columnas, hideOuter, itemizar)`:
`extraerLayout(aNodoLike(nodo), itemizar)` y `generarLayout(nodo, specs, columnas, hideOuter, itemizar)`.
Dispatch: `await generarSeccionLayout(nodo, columnas, msg.hideOuter ?? false, msg.itemizar ?? false);`

- [ ] **Step 5: `generarLayout`** — en `src/plugin/generadores/layout.ts`, sumar `itemizar: boolean`
a la firma y pasarlo al recorrido:
```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean): Promise<FrameNode> {
```
y cambiar `recorrerAutoLayout(seleccionado as unknown as NodoLike)` por
`recorrerAutoLayout(seleccionado as unknown as NodoLike, itemizar).map((r) => r.nodo) as unknown as FrameNode[]`.
(El apareo `contenedores[i]` ↔ `specs[i]` sigue válido: ambos vienen del mismo recorrido con el mismo
`itemizar`, mismo orden y longitud.)

- [ ] **Step 6: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/modelo/tipos.ts src/plugin/main.ts src/plugin/generadores/layout.ts
git commit -m "feat: toggle Itemize instances cableado a Anatomy y Layout (DesignDoc B)"
```

---

### Task 7: Verificación final

- [ ] **Step 1: Build + suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS (~+9 tests nuevos).

- [ ] **Step 2: Verificación manual (usuario)**

Componente `card` con una instancia `tag` adentro → Anatomy y Layout:
- `Itemize instances` OFF → como hoy (la instancia es un elemento, sin itemizar).
- `Itemize instances` ON → aparecen las capas internas del `tag` con `↳` (Anatomy lista y tabla,
  y filas de Layout). Instancia dentro de instancia → doble sangría. Comparar contra `designdoc.pdf`.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A && git commit -m "fix: ajustes de itemize instances"
```
