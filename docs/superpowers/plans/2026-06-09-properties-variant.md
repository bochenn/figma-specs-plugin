# Properties (Variant) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la feature Properties (solo propiedades Variant): comparar el componente default contra cada opción de cada propiedad de variante y generar en el canvas la sección `Properties` con los atributos que cambian.

**Architecture:** Reutiliza la infra de Anatomy (Rebanada 1). El "cerebro" es lógica pura sobre `NodoLike` en `comparacion/variantes.ts` (emparejar elementos, diffear atributos) y `extraccion/properties.ts` (armar `PropiedadSpec[]`). El generador `generadores/properties.ts` traduce datos a frames con Auto Layout (helpers compartidos en `generadores/frames.ts`). `main.ts` resuelve la selección a un Component Set y orquesta; si no hay variantes, cae al flujo de Anatomy existente.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/generadores/frames.ts` | **Nuevo.** Helpers compartidos de frames con Auto Layout (`frameVertical`, `frameHorizontal`, `texto`), extraídos de `anatomy.ts`. Toca `figma.*`. |
| `src/plugin/generadores/anatomy.ts` | **Modificar.** Importa `frameVertical`/`texto` desde `frames.ts` en vez de definirlos. |
| `src/plugin/modelo/tipos.ts` | **Modificar.** Agrega `PropiedadSpec`, `OpcionSpec`, `ElementoCambiado`, `AtributoCambiado`, `ParElementos`, `VarianteNorm`, `SetNorm`. |
| `src/plugin/comparacion/variantes.ts` | **Nuevo.** Lógica pura: `mismasProps`, `emparejar`, `diffAtributos`, `compararVariante`. |
| `src/plugin/extraccion/properties.ts` | **Nuevo.** Lógica pura: `extraerProperties(set: SetNorm) → PropiedadSpec[]`. |
| `src/plugin/extraccion/resolver.ts` | **Nuevo.** `resolverComponentSet(nodo) → ComponentSetNode | null`. Lee tipos/relaciones de Figma. |
| `src/plugin/generadores/properties.ts` | **Nuevo.** `generarProperties(...)` construye la sección Properties. Toca `figma.*`. |
| `src/plugin/main.ts` | **Modificar.** Resuelve a Component Set y ramifica Properties vs Anatomy. |
| `tests/emparejar.test.ts` | **Nuevo.** Tests de `emparejar`. |
| `tests/diff-atributos.test.ts` | **Nuevo.** Tests de `diffAtributos`. |
| `tests/mismas-props.test.ts` | **Nuevo.** Tests de `mismasProps`. |
| `tests/comparar-variante.test.ts` | **Nuevo.** Tests de `compararVariante`. |
| `tests/properties-extraccion.test.ts` | **Nuevo.** Tests de `extraerProperties`. |

**Nota:** los módulos puros (`comparacion/variantes.ts`, `extraccion/properties.ts`) trabajan sobre `NodoLike` y los tipos normalizados (`SetNorm`/`VarianteNorm`), nunca contra `figma.*`. La normalización (de nodos reales a `SetNorm`) la hace `main.ts` con el `aNodoLike` ya existente.

---

## Task 1: Extraer helpers de frames a un módulo compartido (refactor)

Mover `frameVertical` y `texto` de `anatomy.ts` a un nuevo `frames.ts`, y agregar `frameHorizontal`. Es refactor: no cambia comportamiento, los 13 tests deben seguir verdes.

**Files:**
- Create: `src/plugin/generadores/frames.ts`
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Crear `src/plugin/generadores/frames.ts`**

```typescript
// Helpers compartidos para construir frames con Auto Layout. Tocan figma.*.

// Crea un frame con Auto Layout vertical configurado.
export function frameVertical(nombre: string, gap: number, padding = 0): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = padding;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un frame con Auto Layout horizontal configurado.
export function frameHorizontal(nombre: string, gap: number): FrameNode {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "HORIZONTAL";
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Crea un texto. fontSize en px; carga la fuente antes de escribir.
export async function texto(contenido: string, fontSize: number): Promise<TextNode> {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.fontName = { family: "Inter", style: "Regular" };
  t.characters = contenido;
  t.fontSize = fontSize;
  return t;
}
```

- [ ] **Step 2: Modificar `src/plugin/generadores/anatomy.ts` — importar los helpers**

Reemplazar la línea de import inicial y borrar las definiciones locales de `frameVertical` y `texto`.

El bloque de imports al inicio del archivo queda así:

```typescript
import type { ElementoAnatomy } from "../modelo/tipos.ts";
import { posicionMarcador, TAM_MARCADOR } from "../utils/marcadores.ts";
import { frameVertical, texto } from "./frames.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });
```

Y se eliminan del archivo las dos funciones locales que ahora viven en `frames.ts`:
- `function frameVertical(...) { ... }`
- `async function texto(...) { ... }`

(El resto de `anatomy.ts` —`entradaLista`, `marcador`, `generarAnatomy`— no cambia.)

- [ ] **Step 3: Verificar que compila y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`, sin errores.

Run: `npm test`
Expected: `pass 13`, `fail 0`.

- [ ] **Step 4: Verificar el build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/frames.ts src/plugin/generadores/anatomy.ts
git commit -m "refactor: extraer helpers de frames (frameVertical, texto, frameHorizontal)"
```

---

## Task 2: Tipos del dominio de Properties

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Agregar los tipos al final de `src/plugin/modelo/tipos.ts`**

```typescript
// --- Properties (Variant) ---

// Un atributo que cambia entre el default y una opción. Lleva ambos valores
// para poder mostrar "valorOpcion (default: valorDefault)".
export interface AtributoCambiado {
  clave: string;          // "background-color", "width", "opacity"
  valorDefault?: string;  // ausente si el atributo no existía en el default
  valorOpcion?: string;   // ausente si el atributo desaparece en la opción
}

export interface ElementoCambiado {
  elementoNombre: string;
  estado: "modificado" | "agregado" | "removido";
  atributos: AtributoCambiado[]; // vacío si estado es "agregado"/"removido"
}

export interface OpcionSpec {
  nombre: string;                // "Small"
  cambios: ElementoCambiado[];
}

export interface PropiedadSpec {
  nombre: string;                // "Size"
  tipo: "VARIANT";
  default: string;               // valor de esta prop en el default, ej "Medium"
  opciones: OpcionSpec[];
}

// Par de elementos emparejados entre default y opción.
export interface ParElementos {
  default?: NodoLike;
  opcion?: NodoLike;
}

// Una variante normalizada: su mapa de props + su árbol como NodoLike.
export interface VarianteNorm {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
}

// El Component Set normalizado para la extracción pura.
export interface SetNorm {
  propiedades: Record<string, string[]>;  // de variantGroupProperties: prop → opciones
  variantes: VarianteNorm[];
  defaultProps: Record<string, string>;   // variantProperties del default
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: tipos del dominio de Properties (PropiedadSpec, SetNorm, etc.)"
```

---

## Task 3: `mismasProps` (igualdad de mapas de variantes)

`mismasProps(a, b)` indica si dos mapas prop→valor son iguales (mismas claves y mismos valores). Sirve para encontrar el componente-variante de una combinación.

**Files:**
- Create: `tests/mismas-props.test.ts`
- Create: `src/plugin/comparacion/variantes.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { mismasProps } from "../src/plugin/comparacion/variantes.ts";

test("mapas iguales → true", () => {
  assert.equal(mismasProps({ Size: "Small", Type: "Primary" }, { Size: "Small", Type: "Primary" }), true);
});

test("un valor distinto → false", () => {
  assert.equal(mismasProps({ Size: "Small" }, { Size: "Large" }), false);
});

test("distinta cantidad de claves → false", () => {
  assert.equal(mismasProps({ Size: "Small" }, { Size: "Small", Type: "Primary" }), false);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/comparacion/variantes.ts"`.

- [ ] **Step 3: Crear `src/plugin/comparacion/variantes.ts` con `mismasProps`**

```typescript
import type { NodoLike, Atributo, AtributoCambiado, ParElementos, ElementoCambiado } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

// Indica si dos mapas prop→valor son exactamente iguales.
export function mismasProps(a: Record<string, string>, b: Record<string, string>): boolean {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((k) => a[k] === b[k]);
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (16 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/mismas-props.test.ts src/plugin/comparacion/variantes.ts
git commit -m "feat: mismasProps (igualdad de mapas de variantes)"
```

---

## Task 4: `emparejar` (parear elementos default ↔ opción)

`emparejar(a, b)` empareja por nombre; con nombres duplicados, por orden de aparición. Elementos sin contraparte quedan con un solo lado.

**Files:**
- Create: `tests/emparejar.test.ts`
- Modify: `src/plugin/comparacion/variantes.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { emparejar } from "../src/plugin/comparacion/variantes.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

function n(id: string, name: string): NodoLike {
  return { id, name, type: "TEXT" };
}

test("empareja por nombre", () => {
  const pares = emparejar([n("a", "Label")], [n("b", "Label")]);
  assert.equal(pares.length, 1);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].opcion?.id, "b");
});

test("nombres duplicados se emparejan por orden", () => {
  const pares = emparejar(
    [n("a1", "Icon"), n("a2", "Icon")],
    [n("b1", "Icon"), n("b2", "Icon")],
  );
  assert.equal(pares[0].default?.id, "a1");
  assert.equal(pares[0].opcion?.id, "b1");
  assert.equal(pares[1].default?.id, "a2");
  assert.equal(pares[1].opcion?.id, "b2");
});

test("elemento solo en el default → par sin opcion", () => {
  const pares = emparejar([n("a", "Solo")], []);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].opcion, undefined);
});

test("elemento solo en la opcion → par sin default", () => {
  const pares = emparejar([], [n("b", "Nuevo")]);
  assert.equal(pares[0].default, undefined);
  assert.equal(pares[0].opcion?.id, "b");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `emparejar is not a function` / export no encontrado.

- [ ] **Step 3: Agregar `emparejar` a `src/plugin/comparacion/variantes.ts`**

```typescript
// Empareja elementos del default con los de la opción por nombre; los nombres
// repetidos se emparejan por orden de aparición. Los que no tienen contraparte
// quedan con un solo lado.
export function emparejar(a: NodoLike[], b: NodoLike[]): ParElementos[] {
  const pares: ParElementos[] = [];
  const usados = new Set<number>();

  for (const elemA of a) {
    let encontrado = -1;
    for (let i = 0; i < b.length; i++) {
      if (!usados.has(i) && b[i].name === elemA.name) {
        encontrado = i;
        break;
      }
    }
    if (encontrado >= 0) {
      usados.add(encontrado);
      pares.push({ default: elemA, opcion: b[encontrado] });
    } else {
      pares.push({ default: elemA });
    }
  }

  for (let i = 0; i < b.length; i++) {
    if (!usados.has(i)) pares.push({ opcion: b[i] });
  }

  return pares;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 4 tests nuevos PASAN (20 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/emparejar.test.ts src/plugin/comparacion/variantes.ts
git commit -m "feat: emparejar elementos default vs opcion (por nombre y orden)"
```

---

## Task 5: `diffAtributos` (atributos que cambian)

`diffAtributos(attrsDefault, attrsOpcion)` devuelve solo los atributos cuyo valor difiere, con ambos valores.

**Files:**
- Create: `tests/diff-atributos.test.ts`
- Modify: `src/plugin/comparacion/variantes.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { diffAtributos } from "../src/plugin/comparacion/variantes.ts";
import type { Atributo } from "../src/plugin/modelo/tipos.ts";

function attr(clave: string, valor: string): Atributo {
  return { clave, valor, formato: "HARDCODED" };
}

test("atributo que cambia → incluido con ambos valores", () => {
  const cambios = diffAtributos([attr("background-color", "#888888")], [attr("background-color", "#0E68D4")]);
  assert.deepEqual(cambios, [
    { clave: "background-color", valorDefault: "#888888", valorOpcion: "#0E68D4" },
  ]);
});

test("atributo igual → omitido", () => {
  const cambios = diffAtributos([attr("width", "100")], [attr("width", "100")]);
  assert.deepEqual(cambios, []);
});

test("atributo presente solo en el default → incluido sin valorOpcion", () => {
  const cambios = diffAtributos([attr("opacity", "50%")], []);
  assert.deepEqual(cambios, [{ clave: "opacity", valorDefault: "50%", valorOpcion: undefined }]);
});

test("atributo presente solo en la opcion → incluido sin valorDefault", () => {
  const cambios = diffAtributos([], [attr("opacity", "50%")]);
  assert.deepEqual(cambios, [{ clave: "opacity", valorDefault: undefined, valorOpcion: "50%" }]);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `diffAtributos is not a function`.

- [ ] **Step 3: Agregar `diffAtributos` a `src/plugin/comparacion/variantes.ts`**

```typescript
// Devuelve solo los atributos cuyo valor difiere entre default y opción,
// con ambos valores para poder mostrar el antes/después.
export function diffAtributos(attrsDefault: Atributo[], attrsOpcion: Atributo[]): AtributoCambiado[] {
  const claves = new Set<string>();
  for (const a of attrsDefault) claves.add(a.clave);
  for (const a of attrsOpcion) claves.add(a.clave);

  const cambios: AtributoCambiado[] = [];
  for (const clave of claves) {
    const valorDefault = attrsDefault.find((a) => a.clave === clave)?.valor;
    const valorOpcion = attrsOpcion.find((a) => a.clave === clave)?.valor;
    if (valorDefault !== valorOpcion) {
      cambios.push({ clave, valorDefault, valorOpcion });
    }
  }
  return cambios;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 4 tests nuevos PASAN (24 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/diff-atributos.test.ts src/plugin/comparacion/variantes.ts
git commit -m "feat: diffAtributos (atributos que cambian con ambos valores)"
```

---

## Task 6: `compararVariante` (orquesta el diff de dos variantes)

`compararVariante(defaultRaiz, opcionRaiz)` recorre ambas variantes, empareja, diffea y devuelve los elementos con cambios.

**Files:**
- Create: `tests/comparar-variante.test.ts`
- Modify: `src/plugin/comparacion/variantes.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { compararVariante } from "../src/plugin/comparacion/variantes.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("un atributo distinto produce un elemento modificado", () => {
  const def: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }] }],
  };
  const opc: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }] }],
  };
  const cambios = compararVariante(def, opc);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].elementoNombre, "Label");
  assert.equal(cambios[0].estado, "modificado");
  assert.deepEqual(cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000" },
  ]);
});

test("variantes idénticas → sin cambios", () => {
  const arbol: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "l", name: "Label", type: "TEXT" }] };
  assert.deepEqual(compararVariante(arbol, arbol), []);
});

test("elemento solo en la opcion → agregado", () => {
  const def: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [] };
  const opc: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "n", name: "Badge", type: "TEXT" }] };
  const cambios = compararVariante(def, opc);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].estado, "agregado");
  assert.equal(cambios[0].elementoNombre, "Badge");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `compararVariante is not a function`.

- [ ] **Step 3: Agregar `compararVariante` a `src/plugin/comparacion/variantes.ts`**

```typescript
// Compara dos variantes (default vs opción) y devuelve los elementos que cambian.
export function compararVariante(defaultRaiz: NodoLike, opcionRaiz: NodoLike): ElementoCambiado[] {
  const pares = emparejar(recorrer(defaultRaiz), recorrer(opcionRaiz));
  const cambios: ElementoCambiado[] = [];

  for (const par of pares) {
    if (par.default && par.opcion) {
      const diff = diffAtributos(leerAtributos(par.default), leerAtributos(par.opcion));
      if (diff.length > 0) {
        cambios.push({ elementoNombre: par.default.name, estado: "modificado", atributos: diff });
      }
    } else if (par.default) {
      cambios.push({ elementoNombre: par.default.name, estado: "removido", atributos: [] });
    } else if (par.opcion) {
      cambios.push({ elementoNombre: par.opcion.name, estado: "agregado", atributos: [] });
    }
  }

  return cambios;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 3 tests nuevos PASAN (27 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/comparar-variante.test.ts src/plugin/comparacion/variantes.ts
git commit -m "feat: compararVariante (recorre, empareja y diffea dos variantes)"
```

---

## Task 7: `extraerProperties` (armar PropiedadSpec[] desde el set normalizado)

`extraerProperties(set: SetNorm)` produce, por cada propiedad de variante, sus opciones (salteando el valor default) con los cambios de cada una contra el default.

**Files:**
- Create: `tests/properties-extraccion.test.ts`
- Create: `src/plugin/extraccion/properties.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerProperties } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

// Construye un componente-variante con un Label de cierto color.
function variante(props: Record<string, string>, color: { r: number; g: number; b: number }): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: {
      id: "root", name: "Root", type: "COMPONENT",
      children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color }] }],
    },
  };
}

test("una propiedad con dos opciones: saltea el default y compara la otra", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["Gris", "Negro"] },
    defaultProps: { Tone: "Gris" },
    variantes: [
      variante({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variante({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
    ],
  };
  const specs = extraerProperties(set);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].nombre, "Tone");
  assert.equal(specs[0].default, "Gris");
  assert.equal(specs[0].opciones.length, 1);
  assert.equal(specs[0].opciones[0].nombre, "Negro");
  assert.equal(specs[0].opciones[0].cambios[0].elementoNombre, "Label");
  assert.deepEqual(specs[0].opciones[0].cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000" },
  ]);
});

test("opción cuyo componente-variante no existe → se saltea", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["Gris", "Negro", "Rojo"] },
    defaultProps: { Tone: "Gris" },
    variantes: [
      variante({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variante({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
      // no existe variante "Rojo"
    ],
  };
  const specs = extraerProperties(set);
  assert.equal(specs[0].opciones.length, 1);
  assert.equal(specs[0].opciones[0].nombre, "Negro");
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `Could not resolve "../src/plugin/extraccion/properties.ts"`.

- [ ] **Step 3: Implementar `src/plugin/extraccion/properties.ts`**

```typescript
import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm } from "../modelo/tipos.ts";
import { mismasProps, compararVariante } from "../comparacion/variantes.ts";

// Busca en el set la variante cuyo mapa de props coincide exactamente con el target.
function buscarVariante(set: SetNorm, target: Record<string, string>): VarianteNorm | undefined {
  return set.variantes.find((v) => mismasProps(v.variantProperties, target));
}

// Produce las PropiedadSpec[]: por cada propiedad, compara el default contra
// cada opción alternativa (salteando el valor default).
export function extraerProperties(set: SetNorm): PropiedadSpec[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const specs: PropiedadSpec[] = [];

  for (const nombreProp of Object.keys(set.propiedades)) {
    const valorDefault = set.defaultProps[nombreProp];
    const opciones: OpcionSpec[] = [];

    for (const opcion of set.propiedades[nombreProp]) {
      if (opcion === valorDefault) continue;
      const target = { ...set.defaultProps, [nombreProp]: opcion };
      const varianteOpcion = buscarVariante(set, target);
      if (!varianteOpcion) continue; // variante inexistente: se saltea
      const cambios = compararVariante(varianteDefault.raiz, varianteOpcion.raiz);
      opciones.push({ nombre: opcion, cambios });
    }

    specs.push({ nombre: nombreProp, tipo: "VARIANT", default: valorDefault, opciones });
  }

  return specs;
}
```

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (29 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/properties-extraccion.test.ts src/plugin/extraccion/properties.ts
git commit -m "feat: extraerProperties (PropiedadSpec[] desde el set normalizado)"
```

---

## Task 8: Resolver la selección a Component Set

`resolverComponentSet(nodo)` normaliza la entrada (set / componente / instancia) al Component Set, o `null` si no hay variantes. Lee relaciones de Figma; se valida compilando.

**Files:**
- Create: `src/plugin/extraccion/resolver.ts`

- [ ] **Step 1: Implementar `src/plugin/extraccion/resolver.ts`**

```typescript
// Normaliza la selección a un Component Set, o null si no hay variantes.
export function resolverComponentSet(nodo: SceneNode): ComponentSetNode | null {
  if (nodo.type === "COMPONENT_SET") return nodo;
  if (nodo.type === "COMPONENT" && nodo.parent?.type === "COMPONENT_SET") {
    return nodo.parent as ComponentSetNode;
  }
  if (nodo.type === "INSTANCE") {
    const main = nodo.mainComponent;
    if (main && main.parent?.type === "COMPONENT_SET") {
      return main.parent as ComponentSetNode;
    }
  }
  return null;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/extraccion/resolver.ts
git commit -m "feat: resolverComponentSet (normaliza seleccion a Component Set)"
```

---

## Task 9: Generador de Properties

Construye la sección `Properties` con sus subsecciones y opciones (artwork + lista de cambios). Toca `figma.*`; se valida compilando y en la verificación manual.

**Files:**
- Create: `src/plugin/generadores/properties.ts`

- [ ] **Step 1: Implementar `src/plugin/generadores/properties.ts`**

```typescript
import type { PropiedadSpec, ElementoCambiado } from "../modelo/tipos.ts";
import { mismasProps } from "../comparacion/variantes.ts";
import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });

// Busca el componente-variante real del set que coincide con el target de props.
function buscarComponente(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
): ComponentNode | undefined {
  for (const hijo of componentSet.children) {
    if (hijo.type === "COMPONENT" && mismasProps(hijo.variantProperties ?? {}, target)) {
      return hijo;
    }
  }
  return undefined;
}

// Texto legible de un atributo cambiado: "valorOpcion (default: valorDefault)".
function lineaAtributo(c: { clave: string; valorDefault?: string; valorOpcion?: string }): string {
  return `${c.clave}: ${c.valorOpcion ?? "—"} (default: ${c.valorDefault ?? "—"})`;
}

// Construye la lista de cambios de una opción.
async function listaCambios(cambios: ElementoCambiado[]): Promise<FrameNode> {
  const lista = frameVertical("Cambios", 16);
  if (cambios.length === 0) {
    lista.appendChild(await texto("Sin cambios respecto al default", 16));
    return lista;
  }
  for (const cambio of cambios) {
    const fila = frameVertical(cambio.elementoNombre, 4);
    const sufijo = cambio.estado === "modificado" ? "" : ` · ${cambio.estado}`;
    fila.appendChild(await texto(`${cambio.elementoNombre}${sufijo}`, 16));
    for (const attr of cambio.atributos) {
      fila.appendChild(await texto(lineaAtributo(attr), 12));
    }
    lista.appendChild(fila);
  }
  return lista;
}

// Construye el display de una opción: artwork (clon del variante) + lista de cambios.
async function displayOpcion(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
  cambios: ElementoCambiado[],
): Promise<FrameNode> {
  const display = frameHorizontal("Display", 64);

  const componente = buscarComponente(componentSet, target);
  if (componente) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
    const clon = componente.clone();
    artwork.appendChild(clon);
    clon.x = 0;
    clon.y = 0;
    artwork.resize(clon.width, clon.height);
    display.appendChild(artwork);
  }

  display.appendChild(await listaCambios(cambios));
  return display;
}

// Genera el output de Properties. Devuelve el frame Specifications creado.
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  const seccion = frameVertical("Properties", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Properties", 48));

  if (propiedades.length === 0) {
    seccion.appendChild(await texto("Sin propiedades de variante para comparar", 16));
  }

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

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/properties.ts
git commit -m "feat: generador de Properties (subsecciones, opciones, artwork + cambios)"
```

---

## Task 10: Orquestación en main.ts (ramificar Properties vs Anatomy)

`main.ts` resuelve la selección: si hay Component Set con variantes → Properties; si no → Anatomy (flujo existente).

**Files:**
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Reemplazar `src/plugin/main.ts`**

```typescript
import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties } from "./generadores/properties.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 200 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

// Construye el SetNorm para la extracción pura a partir del Component Set real.
function normalizarSet(componentSet: ComponentSetNode): SetNorm {
  const propiedades: Record<string, string[]> = {};
  const grupos = componentSet.variantGroupProperties;
  for (const nombre of Object.keys(grupos)) {
    propiedades[nombre] = grupos[nombre].values;
  }
  const variantes = componentSet.children
    .filter((c): c is ComponentNode => c.type === "COMPONENT")
    .map((c) => ({ variantProperties: c.variantProperties ?? {}, raiz: aNodoLike(c) }));
  const defaultProps = componentSet.defaultVariant?.variantProperties ?? {};
  return { propiedades, variantes, defaultProps };
}

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná algo para generar specs." });
    return;
  }

  const nodo = seleccion[0];

  try {
    const componentSet = resolverComponentSet(nodo);
    if (componentSet) {
      // Camino Properties.
      const setNorm = normalizarSet(componentSet);
      const specs = extraerProperties(setNorm);
      const frame = await generarProperties(componentSet, specs, setNorm.defaultProps);
      figma.viewport.scrollAndZoomIntoView([frame]);
      responder({ tipo: "resultado", ok: true });
      return;
    }

    // Camino Anatomy (flujo existente).
    if (!TIPOS_VALIDOS.includes(nodo.type)) {
      responder({ tipo: "resultado", ok: false, error: "Seleccioná un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
      return;
    }
    const elementos = extraerAnatomy(aNodoLike(nodo));
    const specifications = await generarAnatomy(nodo, elementos);
    figma.viewport.scrollAndZoomIntoView([specifications]);
    responder({ tipo: "resultado", ok: true });
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
```

> Nota: con esto, seleccionar un Component Set (o una variante/instancia con variantes) genera Properties; seleccionar un frame común genera Anatomy. La unificación de ambas secciones en un solo Spec queda fuera de alcance (ver spec).

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 4: Verificar que todos los tests siguen verdes**

Run: `npm test`
Expected: `pass 29`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: orquestacion Properties vs Anatomy segun la seleccion"
```

---

## Task 11: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un Component Set de prueba**

En Figma, crear un componente con variantes (Create component → Add variant) con al menos una propiedad, ej. `Tone` con opciones `Gris` y `Negro`, donde un rectángulo interno cambie de color entre variantes. Asegurarse de que haya un default (el primero del set).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin (o "Run last plugin").

- [ ] **Step 3: Caso feliz (Properties)**

Seleccionar el Component Set (o una de sus variantes) → correr el plugin → "Generate".
Expected: aparece `Specifications → [Nombre] Spec → Properties`, con una subsección por propiedad (`Tone`), y dentro cada opción alternativa (`Negro`) mostrando el artwork del variante y la lista de cambios (ej. `background-color: #000000 (default: #808080)`). Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/2. properties/` y comparar estructura/jerarquía. Anotar diferencias visuales (spacing, tipografía) como pulido para rebanadas siguientes — NO arreglarlas ahora.

- [ ] **Step 5: Casos límite**

- Seleccionar un **frame común** (sin variantes) → "Generate" → Expected: genera **Anatomy** (el flujo anterior sigue funcionando).
- Seleccionar un componente **sin variantes** → Expected: como no resuelve a set, intenta Anatomy.
- Component Set con **una sola variante** → Expected: sección Properties con "Sin propiedades de variante para comparar".

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Properties en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Resolución de entrada y modelo de datos | Task 2 (tipos), Task 8 (resolver), Task 10 (normalizarSet) |
| 2 — Motor de comparación | Task 3 (mismasProps), 4 (emparejar), 5 (diffAtributos), 6 (compararVariante) |
| 3 — Generación visual | Task 1 (frames compartidos), Task 9 (generador) |
| 4 — Errores y casos límite | Task 7 (variante inexistente), Task 9 (sin props), Task 10 (validación/try-catch) |
| 5 — Testing | Tasks 3–7 (unit), Task 11 (manual) |
| Extracción de PropiedadSpec[] | Task 7 |
