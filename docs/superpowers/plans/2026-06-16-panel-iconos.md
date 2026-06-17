# Panel del exhibit con íconos y chips (DesignDoc visual · D2) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Reestructurar el panel del exhibit de Layout a filas de 2 columnas (ícono+label | valor) con las variables/styles en chips grises (nombre completo), según `docs/superpowers/specs/2026-06-16-panel-iconos-design.md`.

**Architecture:** La decisión "chip vs texto" por propiedad vive en funciones puras (`valorDim`, `valorColor`, `valorSpacing` → `ParteValor[]`), testeables. El generador suma `ICONOS_PROP`, `chipVariable`, `valorConChips`, `filaPropiedad` y reescribe `exhibit` con esas filas.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: Partes del valor (puro) — TDD

**Files:** `src/plugin/utils/marcadores-layout.ts`; test `tests/marcadores-layout.test.ts`.

- [ ] **Step 1: Tests que fallan** — sumar `valorDim, valorColor, valorSpacing` al import de
`marcadores-layout.ts` en el test, y agregar:

```typescript
test("valorDim: con variable → resizing + chip", () => {
  assert.deepEqual(valorDim("Fixed", 240, "px", "sizing/card-width"), [{ texto: "Fixed" }, { chip: "sizing/card-width" }]);
});
test("valorDim: sin variable → resizing + valor en texto", () => {
  assert.deepEqual(valorDim("Hug", 88, "px"), [{ texto: "Hug 88" }]);
});
test("valorColor: variable/style → chip + (raw)", () => {
  assert.deepEqual(valorColor({ clave: "fill", valor: "color/surface", formato: "VARIABLE", rawValue: "#FFFFFF" }), [{ chip: "color/surface" }, { texto: "(#FFFFFF)" }]);
});
test("valorColor: hardcoded → solo texto", () => {
  assert.deepEqual(valorColor({ clave: "fill", valor: "#000000", formato: "HARDCODED" }), [{ texto: "#000000" }]);
});
test("valorSpacing: con variable → chip + (valor)", () => {
  assert.deepEqual(valorSpacing(16, "px", "space/padding-1x"), [{ chip: "space/padding-1x" }, { texto: "(16)" }]);
});
test("valorSpacing: sin variable → solo texto", () => {
  assert.deepEqual(valorSpacing(8, "px"), [{ texto: "8" }]);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL (funciones inexistentes).

- [ ] **Step 3: Implementar** — en `src/plugin/utils/marcadores-layout.ts`, agregar (importar
`Atributo` del modelo y `formatearEspaciado` de espaciado.ts):

```typescript
import type { Unidad, Atributo } from "../modelo/tipos.ts";
import { unidadActual, etiquetaSpacing, formatearEspaciado } from "./espaciado.ts";

export type ParteValor = { texto: string } | { chip: string };

// Width/Height: con variable → modo + chip(nombre); sin variable → "modo valor".
export function valorDim(resizing: string, px: number, unidad: Unidad, nombreVar?: string): ParteValor[] {
  if (nombreVar) return [{ texto: resizing }, { chip: nombreVar }];
  return [{ texto: `${resizing} ${formatearEspaciado(px, unidad)}` }];
}

// Fill/Stroke: variable/style → chip(nombre) + (rawValue); hardcoded → texto(valor).
export function valorColor(attr: Atributo): ParteValor[] {
  if (attr.formato !== "HARDCODED") {
    const partes: ParteValor[] = [{ chip: attr.valor }];
    if (attr.rawValue) partes.push({ texto: `(${attr.rawValue})` });
    return partes;
  }
  return [{ texto: attr.valor }];
}

// Padding/Gap: con variable → chip(nombre) + (valor); sin variable → texto(valor).
export function valorSpacing(px: number, unidad: Unidad, nombreVar?: string): ParteValor[] {
  if (nombreVar) return [{ chip: nombreVar }, { texto: `(${formatearEspaciado(px, unidad)})` }];
  return [{ texto: formatearEspaciado(px, unidad) }];
}
```

(Ajustar el import existente de espaciado.ts para incluir `formatearEspaciado` si ya no estaba.)

- [ ] **Step 4: Correr y verificar que pasa**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: valorDim/valorColor/valorSpacing → partes (texto|chip) para el panel (D2)"
```

---

### Task 2: Helpers de dibujo y reescritura del exhibit

**Files:** `src/plugin/generadores/layout.ts`.

- [ ] **Step 1: Imports** — sumar al import de `../utils/marcadores-layout.ts`:
`valorDim, valorColor, valorSpacing, type ParteValor`.

- [ ] **Step 2: Íconos por propiedad** — agregar el mapa (SVG 12×12, gris `#666`):

```typescript
const G = "#666666";
const ICONOS_PROP: Record<string, string> = {
  width: `<line x1="1" y1="6" x2="11" y2="6" stroke="${G}"/><line x1="1" y1="2" x2="1" y2="10" stroke="${G}"/><line x1="11" y1="2" x2="11" y2="10" stroke="${G}"/>`,
  height: `<line x1="6" y1="1" x2="6" y2="11" stroke="${G}"/><line x1="2" y1="1" x2="10" y2="1" stroke="${G}"/><line x1="2" y1="11" x2="10" y2="11" stroke="${G}"/>`,
  direction: `<path d="M2 6 H10 M7 3 L10 6 L7 9" stroke="${G}" fill="none"/>`,
  fill: `<rect x="2" y="2" width="8" height="8" fill="${G}"/>`,
  stroke: `<rect x="2" y="2" width="8" height="8" stroke="${G}" fill="none"/>`,
  align: `<line x1="2" y1="3" x2="10" y2="3" stroke="${G}"/><line x1="2" y1="6" x2="7" y2="6" stroke="${G}"/><line x1="2" y1="9" x2="9" y2="9" stroke="${G}"/>`,
  padding: `<rect x="1" y="1" width="10" height="10" stroke="${G}" fill="none"/><rect x="4" y="4" width="4" height="4" stroke="${G}" fill="none"/>`,
  gap: `<rect x="1" y="3" width="3" height="6" fill="${G}"/><rect x="8" y="3" width="3" height="6" fill="${G}"/>`,
  corner: `<path d="M2 10 V5 A3 3 0 0 1 5 2 H10" stroke="${G}" fill="none"/>`,
  columns: `<rect x="1" y="2" width="2" height="8" fill="${G}"/><rect x="5" y="2" width="2" height="8" fill="${G}"/><rect x="9" y="2" width="2" height="8" fill="${G}"/>`,
  rows: `<rect x="2" y="1" width="8" height="2" fill="${G}"/><rect x="2" y="5" width="8" height="2" fill="${G}"/><rect x="2" y="9" width="8" height="2" fill="${G}"/>`,
};
function svgIconoProp(key: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">${ICONOS_PROP[key]}</svg>`;
}
```

- [ ] **Step 3: chipVariable / valorConChips / filaPropiedad** — agregar (reusa `frameHorizontal`,
`texto`):

```typescript
// Chip gris para una variable/style en el panel (nombre completo, texto oscuro).
async function chipVariable(nombre: string): Promise<FrameNode> {
  const c = frameHorizontal("ChipVar", 0);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = c.paddingRight = 5;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.92 } }];
  const t = await texto(nombre, 11);
  t.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  c.appendChild(t);
  return c;
}

// Lado derecho de una fila: textos y chips según las partes.
async function valorConChips(partes: ParteValor[]): Promise<FrameNode> {
  const f = frameHorizontal("Valor", 4);
  f.counterAxisAlignItems = "CENTER";
  for (const p of partes) {
    if ("chip" in p) f.appendChild(await chipVariable(p.chip));
    else f.appendChild(await texto(p.texto, 12));
  }
  return f;
}

// Fila del panel: [ícono + label] (ancho fijo) | valor.
async function filaPropiedad(iconoKey: string, label: string, partes: ParteValor[]): Promise<FrameNode> {
  const fila = frameHorizontal(`Prop ${label}`, 8);
  fila.counterAxisAlignItems = "CENTER";
  const izq = frameHorizontal("Label", 6);
  izq.counterAxisAlignItems = "CENTER";
  izq.primaryAxisSizingMode = "FIXED";
  izq.resize(150, 16);
  izq.counterAxisSizingMode = "AUTO";
  const icono = figma.createNodeFromSvg(svgIconoProp(iconoKey));
  izq.appendChild(icono);
  izq.appendChild(await texto(label, 12));
  fila.appendChild(izq);
  fila.appendChild(await valorConChips(partes));
  return fila;
}
```

- [ ] **Step 4: Reescribir `exhibit`** — reemplazar el cuerpo de `exhibit` (desde la línea del
título hasta el `return fila`) por filas. El título queda como texto; las propiedades pasan a
`filaPropiedad`:

```typescript
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const fila = frameVertical(spec.elementoNombre, 6);
  fila.appendChild(await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16));
  const u = unidadActual();
  const sv = spec.spacingVars;
  fila.appendChild(await filaPropiedad("width", "Width", valorDim(spec.resizingHorizontal, spec.width, u, spec.widthVar)));
  fila.appendChild(await filaPropiedad("height", "Height", valorDim(spec.resizingVertical, spec.height, u, spec.heightVar)));
  if (spec.fill) fila.appendChild(await filaPropiedad("fill", "Fill", valorColor(spec.fill)));
  if (spec.stroke) fila.appendChild(await filaPropiedad("stroke", "Stroke", valorColor(spec.stroke)));

  // Padding: chip si los 4 lados comparten la misma variable y valor; si no, texto colapsado.
  const p = spec.padding;
  const padUniforme = sv.paddingLeft && sv.paddingLeft === sv.paddingTop && sv.paddingTop === sv.paddingRight && sv.paddingRight === sv.paddingBottom && p.left === p.top && p.top === p.right && p.right === p.bottom;
  const partesPadding: ParteValor[] = padUniforme ? valorSpacing(p.left, u, sv.paddingLeft) : [{ texto: textoPadding(p, u, sv) }];

  if (spec.direccion === "GRID") {
    fila.appendChild(await filaPropiedad("direction", "Direction", [{ texto: "Grid" }]));
    if (spec.gridColumnas !== undefined) fila.appendChild(await filaPropiedad("columns", "Columns", [{ texto: String(spec.gridColumnas) }]));
    if (spec.gridFilas !== undefined) fila.appendChild(await filaPropiedad("rows", "Rows", [{ texto: String(spec.gridFilas) }]));
    if (spec.gridColumnGap !== undefined) fila.appendChild(await filaPropiedad("gap", "Column gap", [{ texto: etiquetaSpacing(spec.gridColumnGap, u) }]));
    if (spec.gridRowGap !== undefined) fila.appendChild(await filaPropiedad("gap", "Row gap", [{ texto: etiquetaSpacing(spec.gridRowGap, u) }]));
    fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
    if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
    return fila;
  }

  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  fila.appendChild(await filaPropiedad("direction", "Direction", [{ texto: direccion }]));
  fila.appendChild(await filaPropiedad("align", "Alignment", [{ texto: `${spec.alineacionPrimaria} / ${spec.alineacionContraria}` }]));
  fila.appendChild(await filaPropiedad("padding", "Padding", partesPadding));
  fila.appendChild(await filaPropiedad("gap", "Item spacing", valorSpacing(spec.itemSpacing, u, sv.itemSpacing)));
  if (spec.cornerRadius) fila.appendChild(await filaPropiedad("corner", "Corner radius", [{ texto: etiquetaSpacing(spec.cornerRadius, u) }]));
  for (const g of spec.grids) fila.appendChild(await filaPropiedad("columns", "Grid", [{ texto: textoGrid(g) }]));
  return fila;
}
```

(`lineaColor` queda sin uso → eliminarla.)

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: panel del exhibit con íconos por propiedad y chips de variable (D2)"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — el panel del `card`/`screen` muestra cada propiedad con su
ícono a la izquierda y el valor a la derecha; las variables/styles en chips grises
(`sizing/card-width`, `color/surface`, `space/padding-1x`). Comparar con `DesignDoc-layout.pdf`.
- [ ] **Step 3: Ajustes** — anchos de columna / tamaño de íconos si hace falta (afinado fino → D3).
```bash
git add -A && git commit -m "fix: ajustes del panel con íconos"
```
