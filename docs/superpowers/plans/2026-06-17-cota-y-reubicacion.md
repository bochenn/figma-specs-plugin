# Componente `cota` + reubicación de medidas — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Rediseñar el badge de medida como `cota` (dos partes para padding/gap con variable) y reubicar las medidas para que no se superpongan, según `docs/superpowers/specs/2026-06-17-cota-y-reubicacion-design.md`.

**Architecture:** `marcasLayout` separa `nombre`/`valor` (puro). En `layout.ts` se renombra `chip`→`cota` y se agrega `cotaConNombre` (sub-pill + valor). `dibujarMarcas` reubica los paddings horizontales abajo y deja el lado izquierdo para la cota de alto, que se posiciona despejada; se mantiene `separarColisiones`.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild. (Render impuro → verificación manual; la separación de datos con tests puros.)

---

### Task 1: `marcasLayout` separa `nombre` y `valor`

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Actualizar el test del nombre combinado** — en `tests/marcadores-layout.test.ts`, reemplazar el test `"marcasLayout con spacingVars → 'nombreCorto valor'"` por:

```typescript
test("marcasLayout con spacingVars → nombre y valor separados", () => {
  const marcas = marcasLayout({ x: 0, y: 0, width: 200, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  const m = marcas.find((x) => x.lado === "left");
  assert.equal(m.nombre, "padding-1x");
  assert.equal(m.valor, "16");
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL (hoy `valor` es `"padding-1x 16"` y `nombre` no existe).

- [ ] **Step 3: Agregar `nombre` a `Marca`** — en `src/plugin/utils/marcadores-layout.ts`, cambiar la interfaz:

```typescript
export interface Marca {
  lado: "top" | "bottom" | "left" | "right";
  centro: number;  // posición sobre ese lado (x para top/bottom, y para left/right)
  desde: number;   // rango de la banda (para el dedupe de wrap)
  hasta: number;
  valor: string;
  nombre?: string; // nombreCorto de la variable, si la hay
  tipo: "padding" | "spacing";
}
```

- [ ] **Step 4: Separar nombre/valor en `marcasLayout`** — reemplazar el cuerpo desde `const marca = ...` hasta el `return`:

```typescript
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const valorDe = (px: number) => formatearEspaciado(px, u);
  const nombreDe = (nombreVar?: string) => (nombreVar ? { nombre: nombreCorto(nombreVar) } : {});
  const out: Marca[] = [];
  if (padding.left > 0) out.push({ lado: "left", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: valorDe(padding.left), ...nombreDe(spacingVars.paddingLeft), tipo: "padding" });
  if (padding.right > 0) out.push({ lado: "right", centro: cy, desde: frame.y, hasta: frame.y + frame.height, valor: valorDe(padding.right), ...nombreDe(spacingVars.paddingRight), tipo: "padding" });
  if (padding.top > 0) out.push({ lado: "top", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: valorDe(padding.top), ...nombreDe(spacingVars.paddingTop), tipo: "padding" });
  if (padding.bottom > 0) out.push({ lado: "bottom", centro: cx, desde: frame.x, hasta: frame.x + frame.width, valor: valorDe(padding.bottom), ...nombreDe(spacingVars.paddingBottom), tipo: "padding" });
  const spacing: Marca[] = [];
  for (const g of gaps) {
    const auto = spacingAuto;
    if (direccion === "HORIZONTAL") spacing.push({ lado: "top", centro: g.x + g.width / 2, desde: g.x, hasta: g.x + g.width, valor: auto ? "Auto" : valorDe(g.width), ...(auto ? {} : nombreDe(spacingVars.itemSpacing)), tipo: "spacing" });
    else spacing.push({ lado: "left", centro: g.y + g.height / 2, desde: g.y, hasta: g.y + g.height, valor: auto ? "Auto" : valorDe(g.height), ...(auto ? {} : nombreDe(spacingVars.itemSpacing)), tipo: "spacing" });
  }
  return [...out, ...sinPisadas(spacing)];
```

(El `const u = unidadActual();` de la primera línea de la función se mantiene.)

- [ ] **Step 5: Correr la suite completa**

Run: `node --test`
Expected: PASS. (Los tests de gaps que comparan con `deepEqual` sin `nombre` siguen pasando porque `nombre` solo se agrega cuando hay variable.)

- [ ] **Step 6: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: marcasLayout separa nombre y valor de la marca

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Componente `cota` (renombrar `chip`) + `cotaConNombre`

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Renombrar `chip` → `cota` y agregar `cotaConNombre`** — reemplazar la función `chip` completa (su comentario + cuerpo) por:

```typescript
// Aclara un color mezclándolo con blanco (t en [0,1]).
function aclarar(c: RGB, t: number): RGB {
  return { r: c.r + (1 - c.r) * t, g: c.g + (1 - c.g) * t, b: c.b + (1 - c.b) * t };
}

// Cota simple: pill de color con el valor en blanco. El caller la posiciona.
async function cota(valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const t = await texto(valor, 11);
  t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}

// Cota de dos partes: pill exterior con sub-pill `value` (nombre de variable) +
// el valor numérico, ambos en blanco. Estilo cota.pdf.
async function cotaConNombre(nombre: string, valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.itemSpacing = 4;
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = 2;
  c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const sub = figma.createFrame();
  sub.name = "value";
  sub.layoutMode = "HORIZONTAL";
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.paddingTop = sub.paddingBottom = 0;
  sub.paddingLeft = sub.paddingRight = 2;
  sub.cornerRadius = 2;
  sub.fills = [{ type: "SOLID", color: aclarar(color, 0.35) }];
  const tn = await texto(nombre, 11);
  tn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  sub.appendChild(tn);
  c.appendChild(sub);
  const tv = await texto(valor, 11);
  tv.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(tv);
  artwork.appendChild(c);
  return c;
}
```

- [ ] **Step 2: Actualizar los usos de `chip` en `dibujarCotas`** — en `dibujarCotas`, cambiar las dos llamadas `await chip(...)` por `await cota(...)`:
```typescript
  const tW = await cota(etiquetaSpacing(spec.width, u), CHIP_DIM, artwork);
```
y
```typescript
  const tH = await cota(etiquetaSpacing(spec.height, u), CHIP_DIM, artwork);
```

- [ ] **Step 3: Actualizar los usos de `chip` en `dibujarCotaHijo`** — cambiar las dos llamadas `await chip(...)` por `await cota(...)`:
```typescript
  const tw = await cota(etiquetaSpacing(hijo.width, u), CHIP_DIM, artwork);
```
y
```typescript
  const th = await cota(etiquetaSpacing(hijo.height, u), CHIP_DIM, artwork);
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`. (No debe quedar ninguna referencia a `chip(`; `dibujarMarcas` se actualiza en Task 3.)

NOTA: en este punto `dibujarMarcas` todavía llama a `chip`. Para que el build no rompa por símbolo inexistente, en este Step también cambiá en `dibujarMarcas` la línea `const c = await chip(m.valor, color, artwork);` por `const c = await cota(m.valor, color, artwork);` (Task 3 la reescribe completa después).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: componente cota (renombra chip) + cotaConNombre de dos partes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Reubicación de medidas sin superposición

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Margen izquierdo dedicado** — agregar junto a `MARGEN`:
```typescript
const MARGEN_IZQ = 160; // margen izquierdo ancho: aloja la cota de alto + breadcrumb del artwork
```

- [ ] **Step 2: Reescribir `dibujarMarcas`** — reemplazar la función completa por (devuelve el x mínimo alcanzado a la izquierda, para que la cota de alto se despeje; reubica los paddings horizontales a la fila de abajo; usa `cotaConNombre` cuando hay `nombre`):

```typescript
const SEP_CHIP = 4; // separación mínima entre cotas del mismo lado

// Posiciona las cotas de marca. Los paddings horizontales (left/right) van a la
// fila de abajo para liberar el lado izquierdo (donde va la cota de alto).
// Devuelve el x mínimo alcanzado por las cotas de la izquierda.
async function dibujarMarcas(artwork: FrameNode, marcas: Marca[], clon: FrameNode): Promise<number> {
  const grupos: Record<string, { c: FrameNode; centro: number }[]> = { top: [], bottom: [], left: [], right: [] };
  for (const m of marcas) {
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    const c = m.nombre ? await cotaConNombre(m.nombre, m.valor, color, artwork) : await cota(m.valor, color, artwork);
    if (m.tipo === "padding" && m.lado === "left") grupos.bottom.push({ c, centro: clon.x });
    else if (m.tipo === "padding" && m.lado === "right") grupos.bottom.push({ c, centro: clon.x + clon.width });
    else grupos[m.lado].push({ c, centro: m.centro });
  }
  let minLeftX = clon.x;
  for (const lado of ["top", "bottom", "left", "right"] as const) {
    const grupo = grupos[lado];
    if (grupo.length === 0) continue;
    const ejeX = lado === "top" || lado === "bottom";
    const centros = grupo.map((g) => g.centro);
    const tamanos = grupo.map((g) => (ejeX ? g.c.width : g.c.height));
    const ajustados = separarColisiones(centros, tamanos, SEP_CHIP);
    for (let i = 0; i < grupo.length; i++) {
      const c = grupo[i].c;
      const p = ajustados[i];
      if (lado === "top") { c.x = p - c.width / 2; c.y = clon.y - 18; }
      else if (lado === "bottom") { c.x = p - c.width / 2; c.y = clon.y + clon.height + 8; }
      else if (lado === "left") { c.x = clon.x - 8 - c.width; c.y = p - c.height / 2; minLeftX = Math.min(minLeftX, c.x); }
      else { c.x = clon.x + clon.width + 8; c.y = p - c.height / 2; }
    }
  }
  return minLeftX;
}
```

- [ ] **Step 3: Reescribir `dibujarCotas`** — reemplazar la función completa por (usa `clon.x`/`clon.y`; el alto se ubica despejado a la izquierda de `minLeftX`):

```typescript
// Cotas de W/H (rojo) con su valor. La de alto se ubica a la izquierda de
// `minLeftX` (lo más a la izquierda que llegaron las cotas de ese lado).
async function dibujarCotas(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec, minLeftX: number): Promise<void> {
  const u = unidadActual();
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = clon.x;
  cotaH.y = clon.y - 44;
  artwork.appendChild(cotaH);
  const tW = await cota(etiquetaSpacing(spec.width, u), CHIP_DIM, artwork);
  tW.x = clon.x + clon.width / 2 - tW.width / 2;
  tW.y = clon.y - 44 - 12;
  const xLinea = Math.min(clon.x - 44, minLeftX - 28);
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = xLinea;
  cotaV.y = clon.y;
  artwork.appendChild(cotaV);
  const tH = await cota(etiquetaSpacing(spec.height, u), CHIP_DIM, artwork);
  tH.x = xLinea - tH.width - 2;
  tH.y = clon.y + clon.height / 2 - tH.height / 2;
}
```

- [ ] **Step 4: Actualizar `artworkDe`** — usar `MARGEN_IZQ` para el eje x, y llamar a `dibujarMarcas` ANTES de `dibujarCotas` pasando `minLeftX`. Reemplazar el cuerpo desde `clon.x = MARGEN;` hasta el `return artwork;` del final por:

```typescript
  clon.x = MARGEN_IZQ;
  clon.y = MARGEN;
  artwork.resize(clon.width + MARGEN_IZQ + MARGEN, clon.height + 2 * MARGEN);

  const frameRect: Rect = { x: MARGEN_IZQ, y: MARGEN, width: clon.width, height: clon.height };
  const hijosRects: Rect[] = contenedor.children.map((c) => ({
    x: MARGEN_IZQ + c.x, y: MARGEN + c.y, width: c.width, height: c.height,
  }));
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  if (medirHijos) for (const h of hijosRects) await dibujarCotaHijo(artwork, h);
  for (const r of rectsPadding(frameRect, spec.padding)) bandaPunteada(r, PADDING_BANDA, CHIP_PADDING, artwork);
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) bandaPunteada(r, ROJO, ROJO, artwork);
    for (const r of filas) bandaPunteada(r, ROJO, ROJO, artwork);
    const minLeftX = await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, [], "HORIZONTAL", spec.spacingAuto, spec.spacingVars), clon);
    await dibujarCotas(artwork, clon, spec, minLeftX);
    return artwork;
  }
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  for (const r of gaps) bandaPunteada(r, GAP_BANDA, CHIP_GAP, artwork);
  for (const g of spec.grids) {
    for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, ROJO, artwork);
  }

  // Cotas de padding/gap (reubicadas) + cotas de W/H (rojo) despejadas.
  const minLeftX = await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars), clon);
  await dibujarCotas(artwork, clon, spec, minLeftX);

  // Ícono de dirección, arriba a la izquierda del artwork.
  const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
  icono.x = 8;
  icono.y = 8;
  artwork.appendChild(icono);

  return artwork;
```

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "fix: reubicar medidas de Layout sin superposición (alto despejado, paddings abajo)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Las cotas de padding/gap con variable se ven como en `cota.pdf`: sub-pill con el nombre + valor en blanco, color semántico (padding azul, gap rosa).
  - Ninguna medida se superpone en `screen`/`card`/`tag`.
  - La cota de alto queda despejada a la izquierda; los paddings horizontales (left/right) aparecen en la fila de abajo.
- [ ] **Step 3: Ajustes** — si algo roza, subir `MARGEN_IZQ` o el offset `- 28`/`- 8`; si el sub-pill tiene poco contraste, ajustar el factor `0.35` de `aclarar`.
