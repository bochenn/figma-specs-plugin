# Rediseño visual de Anatomy — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Anatomy estilo DesignDoc/EightShapes: profundidad configurable, badge numerado en la esquina de cada capa + borde punteado del color del badge, panel a la derecha con número + ícono de tipo + atributos. Según `docs/superpowers/specs/2026-06-18-anatomy-rediseno-design.md`.

**Architecture:** Pura: límite de profundidad de árbol en `recorrer`; `extraerAnatomy` con `nivelMax`/`incluirRaiz`; `parseVariantes(dependeDe)`. Impura: cajas relativas (mapa id→box desde el árbol original), marcadores (badge+borde punteado por color), panel derecho con `iconoTipo`. Setting `anatomyDepth` en la UI.

**Tech Stack:** TypeScript, `node --test`, esbuild.

---

### Task 1: Profundidad de árbol + raíz en la extracción (puro)

**Files:** `src/plugin/traversal/recorrer.ts`, `src/plugin/extraccion/anatomy.ts`, `tests/recorrer.test.ts`, `tests/anatomy-extraccion.test.ts` (nuevo o existente)

- [ ] **Step 1: Test del límite en recorrer** — agregar a `tests/recorrer.test.ts`:

```typescript
test("recorrer: nivelMax 1 → solo hijos directos", () => {
  const raiz: NodoLike = { id: "r", name: "R", type: "FRAME", children: [
    { id: "a", name: "A", type: "FRAME", children: [{ id: "a1", name: "A1", type: "FRAME", children: [] }] },
    { id: "b", name: "B", type: "TEXT" },
  ] };
  assert.deepEqual(recorrer(raiz, false, 0, 0, 1).map((x) => x.nodo.id), ["a", "b"]);
});
test("recorrer: nivelMax 0 → vacío", () => {
  const raiz: NodoLike = { id: "r", name: "R", type: "FRAME", children: [{ id: "a", name: "A", type: "FRAME" }] };
  assert.deepEqual(recorrer(raiz, false, 0, 0, 0), []);
});
```

- [ ] **Step 2: Correr y ver fallar** — `node --test tests/recorrer.test.ts` → FAIL.

- [ ] **Step 3: Agregar `nivel`/`nivelMax` a recorrer** — en `src/plugin/traversal/recorrer.ts`, cambiar la firma y el cuerpo:

```typescript
export function recorrer(nodo: NodoLike, itemizar = false, prof = 0, nivel = 0, nivelMax = Infinity): Recorrido[] {
  const elementos: Recorrido[] = [];
  if (nivel >= nivelMax) return elementos;
  for (const hijo of nodo.children ?? []) {
    elementos.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === TIPOS_INSTANCIA) {
      if (itemizar) elementos.push(...recorrer(hijo, itemizar, prof + 1, nivel + 1, nivelMax));
    } else if (TIPOS_CONTENEDOR.includes(hijo.type)) {
      elementos.push(...recorrer(hijo, itemizar, prof, nivel + 1, nivelMax));
    }
  }
  return elementos;
}
```

(Default `nivelMax = Infinity` → comportamiento actual; los tests previos no pasan ese arg y siguen pasando.)

- [ ] **Step 4: Correr y ver pasar** — `node --test tests/recorrer.test.ts` → PASS.

- [ ] **Step 5: Test de extraerAnatomy con raíz/profundidad** — agregar a `tests/anatomy-extraccion.test.ts` (crear si no existe; importar `extraerAnatomy` y `NodoLike`):

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerAnatomy } from "../src/plugin/extraccion/anatomy.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

const arbol: NodoLike = { id: "r", name: "screen", type: "FRAME", children: [
  { id: "c", name: "card", type: "INSTANCE", mainComponentName: "Type=A, Orientation=V", children: [
    { id: "t", name: "title", type: "TEXT" },
  ] },
] };

test("extraerAnatomy: incluirRaiz + nivelMax self → solo la raíz", () => {
  const els = extraerAnatomy(arbol, false, { nivelMax: 0, incluirRaiz: true });
  assert.deepEqual(els.map((e) => e.id), ["r"]);
});
test("extraerAnatomy: incluirRaiz + children → raíz + hijos directos", () => {
  const els = extraerAnatomy(arbol, false, { nivelMax: 1, incluirRaiz: true });
  assert.deepEqual(els.map((e) => e.id), ["r", "c"]);
});
test("extraerAnatomy: sin opts → solo descendientes (compat Data)", () => {
  const els = extraerAnatomy(arbol);
  assert.deepEqual(els.map((e) => e.id), ["c", "t"]);
});
```

- [ ] **Step 6: Correr y ver fallar** — `node --test tests/anatomy-extraccion.test.ts` → FAIL.

- [ ] **Step 7: Actualizar extraerAnatomy** — reescribir `src/plugin/extraccion/anatomy.ts`:

```typescript
import type { NodoLike, ElementoAnatomy } from "../modelo/tipos.ts";
import { recorrer } from "../traversal/recorrer.ts";
import { leerAtributos } from "../utils/atributos.ts";

function elementoDe(nodo: NodoLike, profundidad: number): ElementoAnatomy {
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
}

// Recorre el nodo raíz y produce la lista de elementos de Anatomy.
// opts.nivelMax: límite de profundidad de árbol (default Infinity).
// opts.incluirRaiz: incluye el nodo raíz como primer elemento (default false).
export function extraerAnatomy(
  nodoRaiz: NodoLike,
  itemizar = false,
  opts: { nivelMax?: number; incluirRaiz?: boolean } = {},
): ElementoAnatomy[] {
  const nivelMax = opts.nivelMax ?? Infinity;
  const descendientes = recorrer(nodoRaiz, itemizar, 0, 0, nivelMax).map(({ nodo, profundidad }) => elementoDe(nodo, profundidad));
  return opts.incluirRaiz ? [elementoDe(nodoRaiz, 0), ...descendientes] : descendientes;
}
```

- [ ] **Step 8: Correr y ver pasar** — `node --test` (toda la suite) → PASS.

- [ ] **Step 9: Commit**

```bash
git add src/plugin/traversal/recorrer.ts src/plugin/extraccion/anatomy.ts tests/recorrer.test.ts tests/anatomy-extraccion.test.ts
git commit -m "feat: extraerAnatomy con profundidad de árbol configurable + raíz

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Parse de variant properties (puro)

**Files:** `src/plugin/utils/anatomy-variantes.ts` (nuevo), `tests/anatomy-variantes.test.ts` (nuevo)

- [ ] **Step 1: Test que falla** — `tests/anatomy-variantes.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { parseVariantes } from "../src/plugin/utils/anatomy-variantes.ts";

test("parseVariantes: 'k=v, k=v' → pares", () => {
  assert.deepEqual(parseVariantes("Type=Card 03, Orientation=Vertical, Breakpoint=Mobile"), [
    { clave: "Type", valor: "Card 03" },
    { clave: "Orientation", valor: "Vertical" },
    { clave: "Breakpoint", valor: "Mobile" },
  ]);
});
test("parseVariantes: sin '=' → vacío (no es variante)", () => {
  assert.deepEqual(parseVariantes("Blog post card"), []);
});
test("parseVariantes: undefined → vacío", () => {
  assert.deepEqual(parseVariantes(undefined), []);
});
```

- [ ] **Step 2: Correr y ver fallar** — `node --test tests/anatomy-variantes.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — `src/plugin/utils/anatomy-variantes.ts`:

```typescript
// Parsea el nombre de variante "Type=A, Orientation=V" en pares clave/valor.
// Si no tiene formato de variante (sin '='), devuelve [] (es un nombre común).
export function parseVariantes(dependeDe: string | undefined): { clave: string; valor: string }[] {
  if (!dependeDe || !dependeDe.includes("=")) return [];
  const out: { clave: string; valor: string }[] = [];
  for (const parte of dependeDe.split(",")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    out.push({ clave: parte.slice(0, i).trim(), valor: parte.slice(i + 1).trim() });
  }
  return out;
}
```

- [ ] **Step 4: Correr y ver pasar** — `node --test tests/anatomy-variantes.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/anatomy-variantes.ts tests/anatomy-variantes.test.ts
git commit -m "feat: parseVariantes (variant properties desde dependeDe)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Setting de profundidad (mensaje + UI + main)

**Files:** `src/plugin/modelo/tipos.ts`, `src/ui/index.html`, `src/ui/ui.ts`, `src/plugin/main.ts`

- [ ] **Step 1: Tipo** — en `tipos.ts`, `MensajeUI`: agregar `anatomyDepth?: "self" | "children" | "all";` (junto a los otros campos de formato).

- [ ] **Step 2: UI select** — en `src/ui/index.html`, en el grupo "Formato" (`.campos`), agregar una fila:

```html
        <div class="campo">
          <label for="anatomyDepth">Anatomy depth</label>
          <select id="anatomyDepth"><option value="children">Direct children</option><option value="self">Selected only</option><option value="all">All layers</option></select>
        </div>
```

- [ ] **Step 3: ui.ts** — declarar `const anatomyDepthSelect = document.getElementById("anatomyDepth") as HTMLSelectElement;` y agregar `anatomyDepth: anatomyDepthSelect.value,` al `pluginMessage`.

- [ ] **Step 4: main** — en `main.ts`, dentro de `seccionPara` para `anatomy`, traducir el depth a `nivelMax` y pasar `incluirRaiz: true`:

```typescript
  if (seccion === "anatomy") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.")];
    const nivelMax = opts.anatomyDepth === "self" ? 0 : opts.anatomyDepth === "all" ? Infinity : 1;
    const elementos = extraerAnatomy(aNodoLike(nodo), opts.itemizar, { nivelMax, incluirRaiz: true });
    const secciones = [await seccionDeAnatomy(nodo, elementos, opts.tabla)];
    if (opts.nested) {
      for (const inst of instanciasAnidadas(nodo)) {
        secciones.push(await seccionDeAnatomy(inst, extraerAnatomy(aNodoLike(inst), opts.itemizar, { nivelMax, incluirRaiz: true }), opts.tabla));
      }
    }
    return secciones;
  }
```

Y agregar `anatomyDepth` a `OpcionesGen` (`anatomyDepth: msg.anatomyDepth ?? "children"` en el armado de `opts`).

- [ ] **Step 5: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: setting Anatomy depth (self/children/all)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Marcadores (badge esquina + borde punteado) y cajas

**Files:** `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Mapa de cajas relativas** — agregar en `anatomy.ts` un helper que recorre el nodo original y mapea `id → caja relativa al root`:

```typescript
// Mapa id → caja (x/y/w/h) relativa a la esquina del nodo raíz.
function cajasRelativas(raiz: SceneNode): Map<string, { x: number; y: number; width: number; height: number }> {
  const mapa = new Map<string, { x: number; y: number; width: number; height: number }>();
  const base = raiz.absoluteBoundingBox;
  function walk(n: SceneNode): void {
    const b = n.absoluteBoundingBox;
    if (base && b) mapa.set(n.id, { x: b.x - base.x, y: b.y - base.y, width: b.width, height: b.height });
    if ("children" in n) for (const c of n.children) walk(c);
  }
  walk(raiz);
  return mapa;
}

// Paleta de colores de marcador (badge + borde), cicla por índice.
const COLORES_MARCA: RGB[] = [
  { r: 0.05, g: 0.4, b: 0.85 }, { r: 0.9, g: 0.2, b: 0.5 }, { r: 0.45, g: 0.3, b: 0.8 },
  { r: 0.95, g: 0.45, b: 0.1 }, { r: 0.1, g: 0.6, b: 0.4 },
];
```

- [ ] **Step 2: Badge coloreable + borde punteado** — reemplazar `marcador` por una versión que recibe color, y agregar `bordeMarca`:

```typescript
// Borde punteado alrededor de la caja, del color del marcador.
function bordeMarca(caja: { x: number; y: number; width: number; height: number }, color: RGB, artwork: FrameNode): void {
  const r = figma.createRectangle();
  r.x = caja.x; r.y = caja.y;
  r.resize(Math.max(caja.width, 0.01), Math.max(caja.height, 0.01));
  r.fills = [];
  r.strokes = [{ type: "SOLID", color }];
  r.strokeWeight = 1;
  r.dashPattern = [4, 3];
  artwork.appendChild(r);
}

// Badge numerado (círculo de color + número blanco). El caller lo posiciona.
async function marcador(numero: number, x: number, y: number, color: RGB): Promise<FrameNode> {
  const circulo = figma.createEllipse();
  circulo.resize(TAM_MARCADOR, TAM_MARCADOR);
  circulo.fills = [{ type: "SOLID", color }];
  const num = await texto(String(numero), 11);
  num.fills = [{ type: "SOLID", color: GRIS(1) }];
  const cont = figma.createFrame();
  cont.name = `Marcador ${numero}`;
  cont.layoutMode = "NONE";
  cont.resize(TAM_MARCADOR, TAM_MARCADOR);
  cont.fills = [];
  cont.clipsContent = false;
  cont.appendChild(circulo);
  cont.appendChild(num);
  num.x = (TAM_MARCADOR - num.width) / 2;
  num.y = (TAM_MARCADOR - num.height) / 2;
  cont.x = x; cont.y = y;
  return cont;
}
```

- [ ] **Step 3: Dibujar marcadores sobre las cajas reales** — en `seccionDeAnatomy`, reemplazar el bloque del artwork (clon + bucle de marcadores por índice) por: clon en (0,0); mapa de cajas; por cada elemento con caja, borde punteado + badge en la esquina sup-izq (`caja.x - 8, caja.y - 8`), con el color `COLORES_MARCA[i % n]`.

```typescript
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0; clon.y = 0;
  artwork.resize(clon.width, clon.height);

  const cajas = cajasRelativas(seleccionado);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    bordeMarca(caja, color, artwork);
    artwork.appendChild(await marcador(i + 1, caja.x - 8, caja.y - 8, color));
  }
```

(El color por índice se usa también en el panel — ver Task 5; se exporta o se recalcula con el mismo `i % n`.)

- [ ] **Step 4: Build** — `npm run build` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: marcadores de Anatomy sobre las cajas reales (badge esquina + borde punteado)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Panel derecho (número + ícono de tipo + atributos) y layout

**Files:** `src/plugin/generadores/iconos.ts`, `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Íconos de tipo en iconos.ts** — importar y mapear los íconos UI3 por tipo de nodo, y exportar un helper:

```typescript
import iconFrame from "../../../resources/figma-UI3/icon.24.frame.svg";
import iconInstance from "../../../resources/figma-UI3/icon.24.instance.small.svg";
import iconComponent from "../../../resources/figma-UI3/icon.24.component.svg";
import iconComponentSet from "../../../resources/figma-UI3/icon.24.component.set.svg";
import iconGroup from "../../../resources/figma-UI3/icon.24.group.small.svg";
import iconImage from "../../../resources/figma-UI3/icon.24.image.svg";
// (iconText ya existe = shape.text.small)

const ICONOS_TIPO: Record<string, string> = {
  FRAME: iconFrame, INSTANCE: iconInstance, COMPONENT: iconComponent,
  COMPONENT_SET: iconComponentSet, GROUP: iconGroup, TEXT: iconText, VECTOR: iconImage,
};

// Nodo del ícono del tipo de capa (o undefined si no hay ícono para ese tipo).
export function nodoIconoTipo(tipo: string): SceneNode | undefined {
  const raw = ICONOS_TIPO[tipo];
  if (!raw) return undefined;
  const svg = raw.replace(/width="\d+"/, 'width="16"').replace(/height="\d+"/, 'height="16"').replace(/\s*style="[^"]*"/g, "").split("black").join("#666666").split("#007BE5").join("#666666");
  return figma.createNodeFromSvg(svg);
}
```

- [ ] **Step 2: Entrada del panel** — en `anatomy.ts`, reescribir `entradaLista` para el panel nuevo: header con `(N) [icono tipo] nombre · TIPO` (badge del color del marcador), luego atributos + variant props (via `parseVariantes`) + typography. Importar `nodoIconoTipo` y `parseVariantes` y `COLORES_MARCA`.

```typescript
async function entradaPanel(indice: number, el: ElementoAnatomy, color: RGB): Promise<FrameNode> {
  const fila = frameVertical(`${indice}. ${el.nombre}`, 4);
  const header = frameHorizontal("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.appendChild(await marcadorChico(indice, color));   // círculo número del color del marcador
  const icono = nodoIconoTipo(el.tipo);
  if (icono) header.appendChild(icono);
  header.appendChild(await texto(`${el.nombre} · ${el.tipo}`, 16));
  fila.appendChild(header);
  const variantes = parseVariantes(el.dependeDe);
  if (variantes.length > 0) for (const v of variantes) fila.appendChild(await texto(`${v.clave}: ${v.valor}`, 12));
  else if (el.dependeDe) fila.appendChild(await texto(`Depends on: ${el.dependeDe}`, 12));
  for (const attr of el.atributos) fila.appendChild(await filaAtributo(attr));
  return fila;
}
```

Y un `marcadorChico(num, color)` que devuelve un círculo chico numerado (reusar lógica de `marcador` sin posicionar, o una versión inline). El panel itera `entradaPanel(i+1, el, COLORES_MARCA[i % n])`.

- [ ] **Step 3: Layout artwork ↔ panel** — en `seccionDeAnatomy`, poner el **artwork a la izquierda y el panel a la derecha** (invertir el orden de `display.appendChild`): primero el artwork, después la lista/panel. La vista tabla (`tabla`) se mantiene en el lugar del panel.

- [ ] **Step 4: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/iconos.ts src/plugin/generadores/anatomy.ts
git commit -m "feat: panel de Anatomy con ícono de tipo + variant props; artwork a la izquierda

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Badges numerados en la esquina de cada capa real + borde punteado del mismo color.
  - Panel a la derecha: `(N) [ícono de tipo] nombre · TIPO` + atributos + variant props.
  - El setting "Anatomy depth" cambia cuántas capas se marcan (Self / Direct children / All).
- [ ] **Step 3: Ajustes** — paleta de colores, tamaño del badge, offset de la esquina, o íconos de tipo faltantes.
