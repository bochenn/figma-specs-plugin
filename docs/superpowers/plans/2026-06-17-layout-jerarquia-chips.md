# Layout: columna de jerarquía + chips sin superposición — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Agregar a cada fila de Layout una columna de breadcrumb (ancestros, actual resaltado) y eliminar la superposición y el corte de chips, según `docs/superpowers/specs/2026-06-17-layout-jerarquia-chips-design.md`.

**Architecture:** `recorrerAutoLayout` acumula `camino: string[]` (pura). En `layout.ts` cada fila pasa a `[breadcrumb] | [artwork] | [exhibit]`. La separación de chips solapados se hace con un helper puro `separarColisiones` (testeable) que `dibujarMarcas` aplica con los anchos medidos; se desactiva el clipping en los frames intermedios.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild. (Render impuro → verificación manual; lógica geométrica/de datos con tests puros.)

---

### Task 1: `camino` de ancestros en recorrerAutoLayout

**Files:**
- Modify: `src/plugin/traversal/recorrer.ts` (tipo `Recorrido`)
- Modify: `src/plugin/traversal/recorrer-autolayout.ts`
- Test: `tests/recorrer-autolayout.test.ts`

- [ ] **Step 1: Test que falla** — agregar al final de `tests/recorrer-autolayout.test.ts`:

```typescript
test("camino: raíz sola trae su nombre", () => {
  const raiz: NodoLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz)[0].camino, ["Root"]);
});

test("camino: hijo anidado incluye el ancestro aunque no tenga Auto Layout", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz)[0].camino, ["Root", "Inner"]);
});

test("camino: con itemizar acumula la instancia y su contenido", () => {
  const raiz: NodoLike = {
    id: "r", name: "screen", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "card", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "tag", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz, true).map((r) => r.camino), [["screen"], ["screen", "card"], ["screen", "card", "tag"]]);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/recorrer-autolayout.test.ts`
Expected: FAIL (las nuevas comparan `camino` que aún es `undefined`).

- [ ] **Step 3: Agregar `camino` al tipo** — en `src/plugin/traversal/recorrer.ts`, cambiar la interfaz:

```typescript
export interface Recorrido { nodo: NodoLike; profundidad: number; camino?: string[]; }
```

- [ ] **Step 4: Acumular el camino** — reescribir `src/plugin/traversal/recorrer-autolayout.ts`:

```typescript
import type { NodoLike } from "../modelo/tipos.ts";
import type { Recorrido } from "./recorrer.ts";

const CONTENEDOR = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET"];

function tieneAutoLayout(n: NodoLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL" || n.layoutMode === "GRID";
}

// Nodos con Auto Layout y su profundidad (instancias atravesadas). Sin itemizar
// frena en instancias; con itemizar entra (prof +1). La raíz va con prof 0.
// `camino` son los nombres desde la raíz hasta el nodo inclusive.
export function recorrerAutoLayout(nodo: NodoLike, itemizar = false, prof = 0, camino: string[] = []): Recorrido[] {
  const resultado: Recorrido[] = [];
  const propio = [...camino, nodo.name];
  if (tieneAutoLayout(nodo)) resultado.push({ nodo, profundidad: prof, camino: propio });
  for (const hijo of nodo.children ?? []) {
    if (hijo.type === "INSTANCE") {
      if (itemizar) resultado.push(...recorrerAutoLayout(hijo, itemizar, prof + 1, propio));
    } else if (CONTENEDOR.includes(hijo.type)) {
      resultado.push(...recorrerAutoLayout(hijo, itemizar, prof, propio));
    }
  }
  return resultado;
}
```

- [ ] **Step 5: Correr y ver pasar**

Run: `node --test tests/recorrer-autolayout.test.ts`
Expected: PASS (todos, incluidos los previos).

- [ ] **Step 6: Commit**

```bash
git add src/plugin/traversal/recorrer.ts src/plugin/traversal/recorrer-autolayout.ts tests/recorrer-autolayout.test.ts
git commit -m "feat: recorrerAutoLayout devuelve el camino de ancestros"
```

---

### Task 2: `separarColisiones` (geometría pura)

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Test que falla** — agregar al final de `tests/marcadores-layout.test.ts`:

```typescript
import { separarColisiones } from "../src/plugin/utils/marcadores-layout.ts";

test("separarColisiones: sin solape deja los centros igual", () => {
  assert.deepEqual(separarColisiones([0, 100], [10, 10], 4), [0, 100]);
});

test("separarColisiones: dos centros iguales se separan tamaño+sep", () => {
  const r = separarColisiones([50, 50], [10, 10], 4);
  assert.equal(r[0], 50);
  assert.equal(r[1], 64); // 50→55 (borde), +4 sep = 59 inicio, +5 mitad = 64
});

test("separarColisiones: respeta el orden original aunque entren desordenados", () => {
  const r = separarColisiones([100, 0], [10, 10], 4);
  assert.equal(r[1], 0);   // el de centro menor no se mueve
  assert.equal(r[0], 100); // el de centro mayor no solapa
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL ("separarColisiones is not a function" / export inexistente).

- [ ] **Step 3: Implementar** — agregar a `src/plugin/utils/marcadores-layout.ts` (al final):

```typescript
// Dado centros y tamaños a lo largo de un eje, devuelve nuevos centros que no se
// solapan, manteniendo el orden y dejando una separación mínima `sep`. Recorre de
// menor a mayor y empuja hacia el lado positivo el que se solape con el anterior.
export function separarColisiones(centros: number[], tamanos: number[], sep: number): number[] {
  const orden = centros.map((_, i) => i).sort((a, b) => centros[a] - centros[b]);
  const out = centros.slice();
  let limite = -Infinity;
  for (const i of orden) {
    let inicio = centros[i] - tamanos[i] / 2;
    if (inicio < limite + sep) inicio = limite + sep;
    out[i] = inicio + tamanos[i] / 2;
    limite = inicio + tamanos[i];
  }
  return out;
}
```

- [ ] **Step 4: Correr y ver pasar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: separarColisiones para chips no superpuestos"
```

---

### Task 3: Breadcrumb por fila en layout.ts

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Helper breadcrumb** — agregar en `src/plugin/generadores/layout.ts` (junto a los otros helpers, p. ej. después de `filaPropiedad`):

```typescript
const ANCHO_BREADCRUMB = 160;
const GRIS_ANCESTRO: RGB = { r: 0.6, g: 0.6, b: 0.6 };

// Columna de jerarquía: un texto por ancestro (raíz→elemento), indentado por
// nivel. Los ancestros van en gris; el último (el elemento de la fila) en el
// color de texto normal, para resaltarlo. Ancho fijo para alinear los artworks.
async function breadcrumb(camino: string[]): Promise<FrameNode> {
  const col = frameVertical("Hierarchy", 4);
  col.counterAxisSizingMode = "FIXED";
  col.resize(ANCHO_BREADCRUMB, col.height);
  for (let i = 0; i < camino.length; i++) {
    const t = await texto("  ".repeat(i) + camino[i], 12);
    if (i < camino.length - 1) t.fills = [{ type: "SOLID", color: GRIS_ANCESTRO }];
    col.appendChild(t);
  }
  return col;
}
```

- [ ] **Step 2: Guardar los recorridos (con camino)** — en `seccionDeLayout`, cambiar la línea que arma `contenedores` para conservar el recorrido completo:

Reemplazar:
```typescript
  const contenedores = recorrerAutoLayout(seleccionado as unknown as NodoLike, itemizar).map((r) => r.nodo) as unknown as FrameNode[];
```
por:
```typescript
  const recorridos = recorrerAutoLayout(seleccionado as unknown as NodoLike, itemizar);
  const contenedores = recorridos.map((r) => r.nodo) as unknown as FrameNode[];
```

- [ ] **Step 3: Insertar el breadcrumb en la fila de Auto Layout** — en el loop que arma cada `fila`, reemplazar:

```typescript
    const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
    fila.clipsContent = false; // los chips/cotas del artwork pueden asomar del margen
    fila.appendChild(await artworkDe(contenedores[i], specs[i], medirHijos));
    fila.appendChild(await exhibit(specs[i]));
    filas.push(fila);
```
por:
```typescript
    const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
    fila.clipsContent = false; // los chips/cotas del artwork pueden asomar del margen
    fila.appendChild(await breadcrumb(recorridos[i].camino ?? [specs[i].elementoNombre]));
    fila.appendChild(await artworkDe(contenedores[i], specs[i], medirHijos));
    fila.appendChild(await exhibit(specs[i]));
    filas.push(fila);
```

- [ ] **Step 4: Breadcrumb en la fila del frame raíz con grids** — en el bloque del raíz con layout grids (sin Auto Layout), reemplazar:

```typescript
      const fila = frameHorizontal(`Layout ${seleccionado.name}`, 48);
      fila.clipsContent = false;
      fila.appendChild(await artworkGrids(seleccionado as FrameNode, gridsRaiz));
      fila.appendChild(await exhibitGrids(seleccionado, gridsRaiz));
      filas.unshift(fila);
```
por:
```typescript
      const fila = frameHorizontal(`Layout ${seleccionado.name}`, 48);
      fila.clipsContent = false;
      fila.appendChild(await breadcrumb([seleccionado.name]));
      fila.appendChild(await artworkGrids(seleccionado as FrameNode, gridsRaiz));
      fila.appendChild(await exhibitGrids(seleccionado, gridsRaiz));
      filas.unshift(fila);
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: columna de jerarquía (breadcrumb) por fila de Layout"
```

---

### Task 4: Chips sin superposición ni corte

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Importar `separarColisiones`** — en `src/plugin/generadores/layout.ts`, agregar `separarColisiones` al import de `marcadores-layout.ts`:

```typescript
import { marcasLayout, estiloCota, iconoDireccion, valorDim, valorColor, valorSpacing, separarColisiones, type ParteValor, type Marca } from "../utils/marcadores-layout.ts";
```

- [ ] **Step 2: Reescribir `dibujarMarcas` con anti-colisión** — reemplazar la función `dibujarMarcas` completa por:

```typescript
const SEP_CHIP = 4; // separación mínima entre chips del mismo lado

// Posiciona los chips de marca por lado, separando los que se solaparían.
async function dibujarMarcas(artwork: FrameNode, marcas: Marca[], clon: FrameNode): Promise<void> {
  const lados = ["top", "bottom", "left", "right"] as const;
  const porLado: Record<string, { c: FrameNode; centro: number }[]> = { top: [], bottom: [], left: [], right: [] };
  for (const m of marcas) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    const c = await chip(m.valor, color, artwork);
    porLado[m.lado].push({ c, centro: m.centro });
  }
  for (const lado of lados) {
    const grupo = porLado[lado];
    if (grupo.length === 0) continue;
    const ejeX = lado === "top" || lado === "bottom";
    const centros = grupo.map((g) => g.centro);
    const tamanos = grupo.map((g) => (ejeX ? g.c.width : g.c.height));
    const ajustados = separarColisiones(centros, tamanos, SEP_CHIP);
    for (let i = 0; i < grupo.length; i++) {
      const c = grupo[i].c;
      const p = ajustados[i];
      if (lado === "top") { c.x = p - c.width / 2; c.y = MARGEN - 18; }
      else if (lado === "bottom") { c.x = p - c.width / 2; c.y = MARGEN + clon.height + 6; }
      else if (lado === "left") { c.x = MARGEN - 16 - c.width; c.y = p - c.height / 2; }
      else { c.x = MARGEN + clon.width + 16; c.y = p - c.height / 2; }
    }
  }
}
```

- [ ] **Step 3: Desactivar clipping en los frames intermedios** — en `seccionDeLayout`, justo después de crear `seccion`, agregar `seccion.clipsContent = false;` y, donde se usa `enColumnas`, desactivar el clipping del contenedor. Reemplazar:

```typescript
  const seccion = frameVertical("Layout and Spacing", 64);
  seccion.appendChild(await texto("Layout and Spacing", 48));
```
por:
```typescript
  const seccion = frameVertical("Layout and Spacing", 64);
  seccion.clipsContent = false; // los chips/cotas asoman del margen del artwork
  seccion.appendChild(await texto("Layout and Spacing", 48));
```

Y reemplazar el bloque final que apila las filas:
```typescript
  if (filas.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    seccion.appendChild(enColumnas(filas, columnas));
  } else {
    for (const f of filas) seccion.appendChild(f);
  }
```
por:
```typescript
  if (filas.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    const cont = enColumnas(filas, columnas);
    cont.clipsContent = false;
    seccion.appendChild(cont);
  } else {
    for (const f of filas) seccion.appendChild(f);
  }
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "fix: chips de Layout sin superposición ni corte"
```

---

### Task 5: Verificación final

- [ ] **Step 1: Suite completa**

Run: `npm run build && node --test`
Expected: build OK; todos los tests PASS (los nuevos de Task 1 y 2 incluidos; el total sube en ~6).

- [ ] **Step 2: Manual (usuario, en Figma con PDF)**
  - Sobre el `screen` de prueba (con `card` y `tag` anidados): cada fila de Layout muestra a la izquierda el breadcrumb (p. ej. `screen` / `card` / `tag`), con el elemento de esa fila en color normal y los ancestros en gris.
  - En `card` y `tag` (elementos chicos) los chips de padding/gap **no se superponen** entre sí.
  - **Ningún** chip queda cortado por el borde de un frame (clipping).
  - Los artworks quedan alineados verticalmente entre filas (columna de breadcrumb de ancho fijo).

- [ ] **Step 3: Ajustes** — si algún chip sigue rozando el breadcrumb, subir `MARGEN` o `ANCHO_BREADCRUMB`; si el breadcrumb resalta poco, oscurecer/ aclarar `GRIS_ANCESTRO`.
