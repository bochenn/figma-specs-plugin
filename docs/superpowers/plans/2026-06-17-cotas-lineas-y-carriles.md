# Líneas de cota padding/gap + carriles externos — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Dibujar una línea de cota con topes sobre cada banda de padding/gap (color semántico) y mover los badges a carriles externos apilados sin superposición, según `docs/superpowers/specs/2026-06-17-cotas-lineas-y-carriles-design.md`.

**Architecture:** Helper puro `carrilDeMarca(lado, tipo)` decide el carril (top/bottom/left). `svgCotaH/svgCotaV` se parametrizan por color para dibujar líneas azules (padding) y rosas (gap) sobre las bandas. `dibujarMarcas` ubica los badges en carriles fuera del elemento con `separarColisiones`.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild. (Render impuro → verificación manual; la asignación de carril con test puro.)

---

### Task 1: `carrilDeMarca` (asignación de carril, pura)

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Test que falla** — agregar al final de `tests/marcadores-layout.test.ts` (agregando `carrilDeMarca` al import existente del módulo en la línea 3):

```typescript
test("carrilDeMarca: padding top arriba; bottom/left/right abajo", () => {
  assert.equal(carrilDeMarca("top", "padding"), "top");
  assert.equal(carrilDeMarca("bottom", "padding"), "bottom");
  assert.equal(carrilDeMarca("left", "padding"), "bottom");
  assert.equal(carrilDeMarca("right", "padding"), "bottom");
});

test("carrilDeMarca: gap horizontal arriba, gap vertical a la izquierda", () => {
  assert.equal(carrilDeMarca("top", "spacing"), "top");
  assert.equal(carrilDeMarca("left", "spacing"), "left");
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL ("carrilDeMarca is not a function").

- [ ] **Step 3: Implementar** — agregar al final de `src/plugin/utils/marcadores-layout.ts`:

```typescript
// Carril externo donde va el badge de una marca: padding-top y gaps horizontales
// arriba; gaps verticales a la izquierda; el resto de paddings (bottom/left/right)
// en la fila de abajo.
export function carrilDeMarca(lado: "top" | "bottom" | "left" | "right", tipo: "padding" | "spacing"): "top" | "bottom" | "left" {
  if (tipo === "spacing") return lado === "top" ? "top" : "left";
  if (lado === "top") return "top";
  return "bottom";
}
```

- [ ] **Step 4: Correr y ver pasar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: carrilDeMarca decide el carril externo de cada marca

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Líneas de cota de padding/gap (color)

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Parametrizar `svgCotaH` por color** — reemplazar la firma y el cuerpo de `svgCotaH` para aceptar un color (default `AZUL_HEX`, así W/H y los hijos siguen en rojo). Reemplazar la función completa por:

```typescript
// Cota horizontal de `largo` px; las puntas codifican el resizing.
function svgCotaH(estilo: "fixed" | "fill" | "hug", largo: number, color = AZUL_HEX): string {
  const L = largo;
  const base = `<line x1="0" y1="6" x2="${L}" y2="6" stroke="${color}"/>`;
  const topes = `<line x1="0.5" y1="0" x2="0.5" y2="12" stroke="${color}"/><line x1="${L - 0.5}" y1="0" x2="${L - 0.5}" y2="12" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M6 1 L1 6 L6 11" stroke="${color}" fill="none"/><path d="M${L - 6} 1 L${L - 1} 6 L${L - 6} 11" stroke="${color}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M2 1 L7 6 L2 11" stroke="${color}" fill="none"/><path d="M${L - 2} 1 L${L - 7} 6 L${L - 2} 11" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="12">${base}${puntas}</svg>`;
}
```

- [ ] **Step 2: Parametrizar `svgCotaV` por color** — reemplazar la función completa por:

```typescript
// Cota vertical de `largo` px (misma idea, ejes intercambiados).
function svgCotaV(estilo: "fixed" | "fill" | "hug", largo: number, color = AZUL_HEX): string {
  const L = largo;
  const base = `<line x1="6" y1="0" x2="6" y2="${L}" stroke="${color}"/>`;
  const topes = `<line x1="0" y1="0.5" x2="12" y2="0.5" stroke="${color}"/><line x1="0" y1="${L - 0.5}" x2="12" y2="${L - 0.5}" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M1 6 L6 1 L11 6" stroke="${color}" fill="none"/><path d="M1 ${L - 6} L6 ${L - 1} L11 ${L - 6}" stroke="${color}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M1 2 L6 7 L11 2" stroke="${color}" fill="none"/><path d="M1 ${L - 2} L6 ${L - 7} L11 ${L - 2}" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="${L}">${base}${puntas}</svg>`;
}
```

- [ ] **Step 3: Helpers de línea + `dibujarLineasMedida`** — agregar justo después de `svgCotaV` (y antes de `ICONOS`):

```typescript
const LINEA_PADDING = "#0D80FF"; // azul, acorde a CHIP_PADDING
const LINEA_GAP = "#E63380";     // rosa, acorde a CHIP_GAP

// Línea de cota vertical centrada en `xCentro`, desde `y`, de `largo` px.
function lineaV(artwork: FrameNode, xCentro: number, y: number, largo: number, color: string): void {
  if (largo <= 0) return;
  const n = figma.createNodeFromSvg(svgCotaV("fixed", largo, color));
  n.x = xCentro - 6;
  n.y = y;
  artwork.appendChild(n);
}

// Línea de cota horizontal centrada en `yCentro`, desde `x`, de `largo` px.
function lineaH(artwork: FrameNode, x: number, yCentro: number, largo: number, color: string): void {
  if (largo <= 0) return;
  const n = figma.createNodeFromSvg(svgCotaH("fixed", largo, color));
  n.x = x;
  n.y = yCentro - 6;
  artwork.appendChild(n);
}

// Dibuja una línea de cota sobre cada banda de padding (azul) y cada gap (rosa).
function dibujarLineasMedida(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec, gaps: Rect[]): void {
  const cx = clon.x + clon.width / 2;
  const cy = clon.y + clon.height / 2;
  const p = spec.padding;
  lineaV(artwork, cx, clon.y, p.top, LINEA_PADDING);
  lineaV(artwork, cx, clon.y + clon.height - p.bottom, p.bottom, LINEA_PADDING);
  lineaH(artwork, clon.x, cy, p.left, LINEA_PADDING);
  lineaH(artwork, clon.x + clon.width - p.right, cy, p.right, LINEA_PADDING);
  for (const g of gaps) {
    if (spec.direccion === "VERTICAL") lineaV(artwork, g.x + g.width / 2, g.y, g.height, LINEA_GAP);
    else lineaH(artwork, g.x, g.y + g.height / 2, g.width, LINEA_GAP);
  }
}
```

- [ ] **Step 4: Llamar a `dibujarLineasMedida` en `artworkDe`** — en el bloque GRID, agregar la línea ANTES de `dibujarMarcas`:

```typescript
    for (const r of filas) bandaPunteada(r, ROJO, ROJO, artwork);
    dibujarLineasMedida(artwork, clon, spec, []);
    const minLeftX = await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, [], "HORIZONTAL", spec.spacingAuto, spec.spacingVars), clon);
```

Y en el bloque normal, agregarla justo antes de `// Cotas de padding/gap (reubicadas) ...`:

```typescript
  dibujarLineasMedida(artwork, clon, spec, gaps);
  // Cotas de padding/gap (reubicadas) + cotas de W/H (rojo) despejadas.
  const minLeftX = await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars), clon);
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: línea de cota con topes sobre cada banda de padding/gap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Badges en carriles externos

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Importar `carrilDeMarca`** — agregarlo al import de `../utils/marcadores-layout.ts`:

```typescript
import { marcasLayout, estiloCota, iconoDireccion, valorDim, valorColor, valorSpacing, separarColisiones, carrilDeMarca, type ParteValor, type Marca } from "../utils/marcadores-layout.ts";
```

- [ ] **Step 2: Reescribir `dibujarMarcas`** — reemplazar la función completa (desde `const SEP_CHIP = 4;` y su comentario hasta su `}`) por:

```typescript
const SEP_CHIP = 4;     // separación mínima entre cotas del mismo carril
const FILA_TOP = 24;    // distancia de la fila superior sobre el borde del elemento
const FILA_BOT = 8;     // distancia de la fila inferior bajo el borde
const COL_IZQ = 8;      // distancia de la columna izquierda al borde

// Ubica los badges de padding/gap en carriles externos (fuera del elemento):
// fila arriba (padding-top + gaps horizontales), fila abajo (padding bottom/left/
// right), columna izquierda (gaps verticales). Devuelve el x mínimo a la izquierda.
async function dibujarMarcas(artwork: FrameNode, marcas: Marca[], clon: FrameNode): Promise<number> {
  const top: { c: FrameNode; centro: number }[] = [];
  const bottom: { c: FrameNode; centro: number }[] = [];
  const left: { c: FrameNode; centro: number }[] = [];
  for (const m of marcas) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    const c = m.nombre ? await cotaConNombre(m.nombre, m.valor, color, artwork) : await cota(m.valor, color, artwork);
    const carril = carrilDeMarca(m.lado, m.tipo);
    if (carril === "top") top.push({ c, centro: m.centro });
    else if (carril === "left") left.push({ c, centro: m.centro });
    else {
      const centro = m.tipo === "padding" && m.lado === "left" ? clon.x
        : m.tipo === "padding" && m.lado === "right" ? clon.x + clon.width
        : m.centro;
      bottom.push({ c, centro });
    }
  }
  const filas: [{ c: FrameNode; centro: number }[], number][] = [[top, clon.y - FILA_TOP], [bottom, clon.y + clon.height + FILA_BOT]];
  for (const [grupo, y] of filas) {
    if (grupo.length === 0) continue;
    const ajustados = separarColisiones(grupo.map((g) => g.centro), grupo.map((g) => g.c.width), SEP_CHIP);
    for (let i = 0; i < grupo.length; i++) { grupo[i].c.x = ajustados[i] - grupo[i].c.width / 2; grupo[i].c.y = y; }
  }
  let minLeftX = clon.x;
  if (left.length > 0) {
    const ajustados = separarColisiones(left.map((g) => g.centro), left.map((g) => g.c.height), SEP_CHIP);
    for (let i = 0; i < left.length; i++) {
      const c = left[i].c;
      c.x = clon.x - COL_IZQ - c.width;
      c.y = ajustados[i] - c.height / 2;
      minLeftX = Math.min(minLeftX, c.x);
    }
  }
  return minLeftX;
}
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS (incluido `carrilDeMarca` de Task 1).

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "fix: badges de Layout en carriles externos sin superposición

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Cada padding/gap tiene su línea de cota con topes sobre la banda (padding azul, gap rosa).
  - Los badges quedan **fuera** del elemento, sin superponerse, en `screen`/`card`/`tag`.
  - W arriba, H a la izquierda, padding-top + gaps horizontales arriba, padding bottom/left/right abajo, gaps verticales a la izquierda.
  - Con Element measures ON, las cotas de hijos ya no chocan con los badges.
- [ ] **Step 3: Ajustes** — si hace falta, subir `FILA_TOP`/`FILA_BOT`/`COL_IZQ`, o agregar línea conectora (leader) entre badge y banda.
