# Íconos UI3 + variables del grid + text-style — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Reemplazar los íconos del panel de Layout por la librería `resources/figma-UI3` (inlineada en el bundle), con dirección/gap/alignment dinámicos, más mostrar las variables del grid como chip y el text-style de los elementos con texto, según `docs/superpowers/specs/2026-06-17-iconos-ui3-grid-vars-textstyle-design.md`.

**Architecture:** esbuild inlinea los `.svg` (loader text). Módulo `iconos.ts` mapea key→SVG y normaliza (16px, gris). Helpers puros `iconoAlineacion` y `textStyleDe` testeados. El adaptador captura las variables del gap del grid. El exhibit de `layout.ts` usa las nuevas keys y filas.

**Tech Stack:** TypeScript, `node --test`, esbuild. (Render/adapter impuros → manual; lógica de keys/text-style con tests puros.)

---

### Task 1: Loader SVG + módulo de íconos UI3

**Files:**
- Modify: `esbuild.config.mjs`
- Create: `src/svg.d.ts`
- Create: `src/plugin/generadores/iconos.ts`

- [ ] **Step 1: Loader `.svg` en esbuild** — en `esbuild.config.mjs`, en `buildPlugin()` agregar `loader` al objeto de `esbuild.build`:

```javascript
async function buildPlugin() {
  await esbuild.build({
    entryPoints: ["src/plugin/main.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    format: "iife",
    loader: { ".svg": "text" },
  });
}
```

Y en el bloque `watch` (el `esbuild.context({...})`), agregar la misma línea `loader: { ".svg": "text" },` al objeto de opciones.

- [ ] **Step 2: Declaración de módulo SVG** — crear `src/svg.d.ts`:

```typescript
declare module "*.svg" {
  const content: string;
  export default content;
}
```

- [ ] **Step 3: Módulo de íconos** — crear `src/plugin/generadores/iconos.ts`:

```typescript
import iconWidth from "../../../resources/figma-UI3/icon.24.prop-width.svg";
import iconHeight from "../../../resources/figma-UI3/icon.24.prop-height.svg";
import iconDirH from "../../../resources/figma-UI3/icon.24.al.layout-horizontal.svg";
import iconDirV from "../../../resources/figma-UI3/icon.24.al.layout-vertical.svg";
import iconDirGrid from "../../../resources/figma-UI3/icon.24.grid.svg";
import iconFill from "../../../resources/figma-UI3/icon.24.fill.solid.small.svg";
import iconStroke from "../../../resources/figma-UI3/icon.24.outline.stroke.small.svg";
import iconPadding from "../../../resources/figma-UI3/icon.24.al.padding-all.svg";
import iconSpacingH from "../../../resources/figma-UI3/icon.24.al.spacing-horizontal.svg";
import iconSpacingV from "../../../resources/figma-UI3/icon.24.al.spacing-vertical.svg";
import iconCorner from "../../../resources/figma-UI3/icon.24.corners.svg";
import iconColumns from "../../../resources/figma-UI3/icon.24.grid-column.svg";
import iconRows from "../../../resources/figma-UI3/icon.24.grid-row.svg";
import iconText from "../../../resources/figma-UI3/icon.24.prop-text.svg";
import iconAlignVLeft from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.left.svg";
import iconAlignVCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.center.svg";
import iconAlignVRight from "../../../resources/figma-UI3/icon.16.autolayoutgrid.vertical.right.svg";
import iconAlignHTop from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.top.svg";
import iconAlignHCenter from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.center.svg";
import iconAlignHBottom from "../../../resources/figma-UI3/icon.16.autolayoutgrid.horizontal.bottom.svg";
import iconAlignBaseline from "../../../resources/figma-UI3/icon.16.autolayout.alignment.baseline.svg";

// key lógica → SVG crudo de la librería UI3.
const ICONOS_UI3: Record<string, string> = {
  width: iconWidth,
  height: iconHeight,
  "dir-horizontal": iconDirH,
  "dir-vertical": iconDirV,
  "dir-grid": iconDirGrid,
  fill: iconFill,
  stroke: iconStroke,
  padding: iconPadding,
  "spacing-h": iconSpacingH,
  "spacing-v": iconSpacingV,
  corner: iconCorner,
  columns: iconColumns,
  rows: iconRows,
  text: iconText,
  "align-v-left": iconAlignVLeft,
  "align-v-center": iconAlignVCenter,
  "align-v-right": iconAlignVRight,
  "align-h-top": iconAlignHTop,
  "align-h-center": iconAlignHCenter,
  "align-h-bottom": iconAlignHBottom,
  "align-baseline": iconAlignBaseline,
};

const GRIS_ICONO = "#666666";

// Crea el nodo del ícono normalizado a 16px y recoloreado al gris del panel.
export function nodoIcono(key: string): SceneNode {
  const raw = ICONOS_UI3[key] ?? ICONOS_UI3.width;
  const svg = raw
    .replace(/width="\d+"/, 'width="16"')
    .replace(/height="\d+"/, 'height="16"')
    .split("#171717").join(GRIS_ICONO);
  return figma.createNodeFromSvg(svg);
}
```

- [ ] **Step 4: Build** — `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html` (esbuild inlinea los SVG; aún no se usa `nodoIcono`, no rompe).

- [ ] **Step 5: Commit**

```bash
git add esbuild.config.mjs src/svg.d.ts src/plugin/generadores/iconos.ts
git commit -m "feat: inline de íconos figma-UI3 (loader svg + módulo iconos)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `iconoAlineacion` (pura)

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Test que falla** — agregar `iconoAlineacion` al import del módulo en la línea 3 del test, y al final del archivo:

```typescript
test("iconoAlineacion: vertical mapea Start/Center/End a left/center/right", () => {
  assert.equal(iconoAlineacion("VERTICAL", "Start"), "align-v-left");
  assert.equal(iconoAlineacion("VERTICAL", "Center"), "align-v-center");
  assert.equal(iconoAlineacion("VERTICAL", "End"), "align-v-right");
});

test("iconoAlineacion: horizontal mapea a top/center/bottom y baseline", () => {
  assert.equal(iconoAlineacion("HORIZONTAL", "Start"), "align-h-top");
  assert.equal(iconoAlineacion("HORIZONTAL", "Center"), "align-h-center");
  assert.equal(iconoAlineacion("HORIZONTAL", "End"), "align-h-bottom");
  assert.equal(iconoAlineacion("HORIZONTAL", "Baseline"), "align-baseline");
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL ("iconoAlineacion is not a function").

- [ ] **Step 3: Implementar** — agregar al final de `src/plugin/utils/marcadores-layout.ts`:

```typescript
// Ícono de la fila Alignment: depende de la dirección y la alineación del eje
// contrario (los 6 íconos de autolayoutgrid + baseline en horizontal).
export function iconoAlineacion(direccion: string, alineacionContraria: string): string {
  if (direccion === "HORIZONTAL") {
    if (alineacionContraria === "Center") return "align-h-center";
    if (alineacionContraria === "End") return "align-h-bottom";
    if (alineacionContraria === "Baseline") return "align-baseline";
    return "align-h-top";
  }
  if (alineacionContraria === "Center") return "align-v-center";
  if (alineacionContraria === "End") return "align-v-right";
  return "align-v-left";
}
```

- [ ] **Step 4: Correr y ver pasar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: iconoAlineacion elige el ícono de Alignment según dirección/eje

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `textStyleDe` (pura) + campo en LayoutSpec

**Files:**
- Modify: `src/plugin/modelo/tipos.ts` (LayoutSpec)
- Modify: `src/plugin/extraccion/layout.ts`
- Test: `tests/textstyle.test.ts` (nuevo)

- [ ] **Step 1: Test que falla** — crear `tests/textstyle.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { textStyleDe } from "../src/plugin/extraccion/layout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("textStyleDe: hijo TEXT con text style → nombre", () => {
  const n: NodoLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", textStyleName: "Heading/H1" },
  ] };
  assert.deepEqual(textStyleDe(n), { nombre: "Heading/H1" });
});

test("textStyleDe: hijo TEXT sin style → resumen de fuente", () => {
  const n: NodoLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", fontFamily: "Inter", fontStyle: "Semi Bold", fontSize: 16 },
  ] };
  assert.deepEqual(textStyleDe(n), { resumen: "Inter Semi Bold · 16" });
});

test("textStyleDe: sin hijo texto → undefined", () => {
  const n: NodoLike = { id: "f", name: "box", type: "FRAME", children: [
    { id: "r", name: "rect", type: "RECTANGLE" },
  ] };
  assert.equal(textStyleDe(n), undefined);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/textstyle.test.ts`
Expected: FAIL ("textStyleDe is not a function").

- [ ] **Step 3: Agregar el tipo** — en `src/plugin/modelo/tipos.ts`, dentro de `interface LayoutSpec`, agregar (junto a los demás opcionales, p. ej. después de `cornerRadius?`):

```typescript
  textStyle?: { nombre?: string; resumen?: string };
  gridColumnGapVar?: string;
  gridRowGapVar?: string;
```

- [ ] **Step 4: Implementar `textStyleDe` y usarla** — en `src/plugin/extraccion/layout.ts`, agregar la función exportada (antes de `layoutSpecDe`):

```typescript
// Estilo de texto del primer hijo TEXT directo (para mostrarlo en el exhibit).
export function textStyleDe(nodo: NodoLike): { nombre?: string; resumen?: string } | undefined {
  const txt = (nodo.children ?? []).find((c) => c.type === "TEXT");
  if (!txt) return undefined;
  if (txt.textStyleName) return { nombre: txt.textStyleName };
  if (txt.fontFamily) return { resumen: `${txt.fontFamily} ${txt.fontStyle ?? ""} · ${txt.fontSize ?? ""}`.replace(/\s+/g, " ").trim() };
  return undefined;
}
```

Y dentro de `layoutSpecDe`, antes de `return spec;`, agregar:

```typescript
  const ts = textStyleDe(nodo);
  if (ts) spec.textStyle = ts;
```

- [ ] **Step 5: Correr y ver pasar**

Run: `node --test tests/textstyle.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/extraccion/layout.ts tests/textstyle.test.ts
git commit -m "feat: textStyleDe + LayoutSpec.textStyle/gridGapVar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Variables del gap del grid en el adaptador

**Files:**
- Modify: `src/plugin/modelo/tipos.ts` (NodoLike)
- Modify: `src/plugin/extraccion/adaptador.ts`
- Modify: `src/plugin/extraccion/layout.ts`

- [ ] **Step 1: Campos en NodoLike** — en `src/plugin/modelo/tipos.ts`, dentro de `interface NodoLike`, junto a `gridColumnGap?`/`gridRowGap?`, agregar:

```typescript
  gridColumnGapVar?: string;
  gridRowGapVar?: string;
```

- [ ] **Step 2: Capturar en el adaptador** — en `src/plugin/extraccion/adaptador.ts`, dentro del bloque `if (nodo.layoutMode === "GRID") { ... }`, después de asignar `base.gridRowGap = g.gridRowGap;`, agregar:

```typescript
      const colVar = bvLayout["gridColumnGap"];
      if (colVar) { const n = nombreVariable(colVar.id); if (n) base.gridColumnGapVar = n; }
      const rowVar = bvLayout["gridRowGap"];
      if (rowVar) { const n = nombreVariable(rowVar.id); if (n) base.gridRowGapVar = n; }
```

(`bvLayout` ya está declarado más arriba en ese mismo bloque GRID/auto-layout.)

- [ ] **Step 3: Copiar al spec** — en `src/plugin/extraccion/layout.ts`, dentro del `if (nodo.layoutMode === "GRID")`, después de `if (typeof nodo.gridRowGap === "number") spec.gridRowGap = nodo.gridRowGap;`, agregar:

```typescript
    if (nodo.gridColumnGapVar) spec.gridColumnGapVar = nodo.gridColumnGapVar;
    if (nodo.gridRowGapVar) spec.gridRowGapVar = nodo.gridRowGapVar;
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/extraccion/adaptador.ts src/plugin/extraccion/layout.ts
git commit -m "feat: capturar variables del gridColumnGap/gridRowGap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Exhibit con íconos UI3 + filas dinámicas

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Imports** — en `src/plugin/generadores/layout.ts`:
  - agregar `import { nodoIcono } from "./iconos.ts";`
  - agregar `iconoAlineacion` al import de `../utils/marcadores-layout.ts`.

- [ ] **Step 2: `filaPropiedad` usa `nodoIcono`** — reemplazar en `filaPropiedad` la línea:
```typescript
  izq.appendChild(figma.createNodeFromSvg(svgIconoProp(iconoKey)));
```
por:
```typescript
  izq.appendChild(nodoIcono(iconoKey));
```

- [ ] **Step 3: Eliminar los íconos a mano** — borrar de `layout.ts` la constante `G_ICONO`, el objeto `ICONOS_PROP` completo y la función `svgIconoProp` (ya no se usan).

- [ ] **Step 4: Reescribir `exhibit`** — reemplazar la función `exhibit` completa por:

```typescript
// Construye el exhibit (bloque de texto) de una capa con Auto Layout.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 6);
  fila.appendChild(await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16));
  const u = unidadActual();
  const sv = spec.spacingVars;
  fila.appendChild(await filaPropiedad("width", "Width", valorDim(spec.resizingHorizontal, spec.width, u, spec.widthVar)));
  fila.appendChild(await filaPropiedad("height", "Height", valorDim(spec.resizingVertical, spec.height, u, spec.heightVar)));
  if (spec.fill) fila.appendChild(await filaPropiedad("fill", "Fill", valorColor(spec.fill)));
  if (spec.stroke) fila.appendChild(await filaPropiedad("stroke", "Stroke", valorColor(spec.stroke)));

  // Padding: chip si los 4 lados comparten variable y valor; si no, texto colapsado.
  const p = spec.padding;
  const padUniforme = !!sv.paddingLeft && sv.paddingLeft === sv.paddingTop && sv.paddingTop === sv.paddingRight && sv.paddingRight === sv.paddingBottom && p.left === p.top && p.top === p.right && p.right === p.bottom;
  const partesPadding: ParteValor[] = padUniforme ? valorSpacing(p.left, u, sv.paddingLeft) : [{ texto: textoPadding(p, u, sv) }];

  if (spec.direccion === "GRID") {
    fila.appendChild(await filaPropiedad("dir-grid", "Direction", [{ texto: "Grid" }]));
    if (spec.gridColumnas !== undefined) fila.appendChild(await filaPropiedad("columns", "Columns", [{ texto: String(spec.gridColumnas) }]));
    if (spec.gridFilas !== undefined) fila.appendChild(await filaPropiedad("rows", "Rows", [{ texto: String(spec.gridFilas) }]));
    if (spec.gridColumnGap !== undefined) fila.appendChild(await filaPropiedad("spacing-h", "Column gap", valorSpacing(spec.gridColumnGap, u, spec.gridColumnGapVar)));
    if (spec.gridRowGap !== undefined) fila.appendChild(await filaPropiedad("spacing-v", "Row gap", valorSpacing(spec.gridRowGap, u, spec.gridRowGapVar)));
    fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
    if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
    if (spec.textStyle) fila.appendChild(await filaPropiedad("text", "Text style", spec.textStyle.nombre ? [{ chip: spec.textStyle.nombre }] : [{ texto: spec.textStyle.resumen ?? "" }]));
    return fila;
  }

  const dirKey = spec.direccion === "HORIZONTAL" ? "dir-horizontal" : "dir-vertical";
  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  const gapKey = spec.direccion === "HORIZONTAL" ? "spacing-h" : "spacing-v";
  fila.appendChild(await filaPropiedad(dirKey, "Direction", [{ texto: direccion }]));
  fila.appendChild(await filaPropiedad(iconoAlineacion(spec.direccion, spec.alineacionContraria), "Alignment", [{ texto: `${spec.alineacionPrimaria} / ${spec.alineacionContraria}` }]));
  fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
  fila.appendChild(await filaPropiedad(gapKey, "Item spacing", valorSpacing(spec.itemSpacing, u, sv.itemSpacing)));
  if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
  for (const g of spec.grids) fila.appendChild(await filaPropiedad("columns", "Grid", [{ texto: textoGrid(g) }]));
  if (spec.textStyle) fila.appendChild(await filaPropiedad("text", "Text style", spec.textStyle.nombre ? [{ chip: spec.textStyle.nombre }] : [{ texto: spec.textStyle.resumen ?? "" }]));
  return fila;
}
```

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK (sin referencias a `ICONOS_PROP`/`svgIconoProp`/`G_ICONO`); todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: panel de Layout con íconos UI3 + dirección/gap/alignment/text-style dinámicos

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - El panel usa los íconos UI3 (width/height/padding/fill/stroke/corner/columns/rows/text).
  - Direction muestra el ícono horizontal/vertical/grid; Item spacing usa el ícono del eje; Column gap → horizontal, Row gap → vertical.
  - Alignment muestra el ícono correcto según dirección + alineación (incluido baseline).
  - En SCREEN, Column gap/Row gap muestran su variable como chip (si está atada).
  - `title` muestra una fila "Text style" con el estilo del Heading.
- [ ] **Step 3: Ajustes** — color/tamaño de íconos (`GRIS_ICONO`, el `16`), o key de `boundVariables` del grid gap si el chip no aparece.
