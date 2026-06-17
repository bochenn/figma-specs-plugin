# Artwork dividido (Dimensions | Spacing) para chicos — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Cuando el elemento de Layout es chico, dividir el artwork en dos (Dimensions | Spacing) etiquetados, según `docs/superpowers/specs/2026-06-17-artwork-split-chicos-design.md`.

**Architecture:** Helper puro `esChico` decide. `artworkDe` se parte en `artworkModo(...,modo)` (dibuja condicionalmente según "completo"/"dimensiones"/"spacing") + un wrapper que arma uno o dos artworks etiquetados.

**Tech Stack:** TypeScript, `node --test`, esbuild. (Render impuro → manual; el umbral con test puro.)

---

### Task 1: `esChico` (umbral, puro)

**Files:**
- Modify: `src/plugin/utils/marcadores-layout.ts`
- Test: `tests/marcadores-layout.test.ts`

- [ ] **Step 1: Test que falla** — agregar `esChico` al import del módulo (línea 3 del test) y al final:

```typescript
test("esChico: tag (74x24) es chico; card (240x92) no; GRID nunca", () => {
  assert.equal(esChico(74, 24, "HORIZONTAL"), true);
  assert.equal(esChico(240, 92, "VERTICAL"), false);
  assert.equal(esChico(40, 40, "GRID"), false);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: FAIL ("esChico is not a function").

- [ ] **Step 3: Implementar** — agregar al final de `src/plugin/utils/marcadores-layout.ts`:

```typescript
// Un elemento es "chico" (y conviene dividir su artwork) si no es GRID y su lado
// menor está por debajo del umbral.
export function esChico(width: number, height: number, direccion: string): boolean {
  return direccion !== "GRID" && Math.min(width, height) < 48;
}
```

- [ ] **Step 4: Correr y ver pasar**

Run: `node --test tests/marcadores-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/marcadores-layout.ts tests/marcadores-layout.test.ts
git commit -m "feat: esChico decide cuándo dividir el artwork de Layout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `artworkModo` + wrapper que divide

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Importar `esChico`** — agregarlo al import de `../utils/marcadores-layout.ts`.

- [ ] **Step 2: Reemplazar `artworkDe`** — reemplazar la función `artworkDe` COMPLETA (desde su comentario `// Construye el artwork anotado de UN contenedor ...` hasta su `}` de cierre) por:

```typescript
const UMBRAL_CHICO = 48; // referencia; el umbral real vive en esChico

// Dibuja el artwork de un contenedor en un modo: "completo" (todo), "dimensiones"
// (solo W/H + medidas de hijos) o "spacing" (solo padding/gap). El clon va corrido
// (MARGEN_IZQ, MARGEN) para dejar lugar a las anotaciones.
async function artworkModo(contenedor: FrameNode, spec: LayoutSpec, medirHijos: boolean, modo: "completo" | "dimensiones" | "spacing"): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementoNombre}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const clon = contenedor.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN_IZQ;
  clon.y = MARGEN;
  artwork.resize(clon.width + MARGEN_IZQ + MARGEN, clon.height + 2 * MARGEN);

  const frameRect: Rect = { x: MARGEN_IZQ, y: MARGEN, width: clon.width, height: clon.height };
  const hijosRects: Rect[] = contenedor.children.map((c) => ({
    x: MARGEN_IZQ + c.x, y: MARGEN + c.y, width: c.width, height: c.height,
  }));
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  const hijosMedidos = medirHijos ? hijosRects : [];
  if (medirHijos && modo !== "spacing") dibujarLineasHijos(artwork, hijosRects);
  if (modo !== "dimensiones") for (const r of rectsPadding(frameRect, spec.padding)) bandaPunteada(r, PADDING_BANDA, CHIP_PADDING, artwork);
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) bandaPunteada(r, ROJO, ROJO, artwork);
    for (const r of filas) bandaPunteada(r, ROJO, ROJO, artwork);
    dibujarLineasMedida(artwork, clon, spec, []);
    const minLeftX = await dibujarMarcas(artwork, marcasLayout(frameRect, spec.padding, [], "HORIZONTAL", spec.spacingAuto, spec.spacingVars), clon, hijosMedidos);
    await dibujarCotas(artwork, clon, spec, minLeftX);
    return artwork;
  }
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  if (modo !== "dimensiones") {
    for (const r of gaps) bandaPunteada(r, GAP_BANDA, CHIP_GAP, artwork);
    for (const g of spec.grids) {
      for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, ROJO, artwork);
    }
    dibujarLineasMedida(artwork, clon, spec, gaps);
  }

  const marcas = modo === "dimensiones" ? [] : marcasLayout(frameRect, spec.padding, gaps, spec.direccion, spec.spacingAuto, spec.spacingVars);
  const hijosParaMarcas = modo === "spacing" ? [] : hijosMedidos;
  const minLeftX = await dibujarMarcas(artwork, marcas, clon, hijosParaMarcas);
  if (modo !== "spacing") await dibujarCotas(artwork, clon, spec, minLeftX);

  if (modo !== "dimensiones") {
    const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
    icono.x = 8;
    icono.y = 8;
    artwork.appendChild(icono);
  }
  return artwork;
}

// Envuelve un artwork con un título arriba.
async function artworkEtiquetado(titulo: string, art: FrameNode): Promise<FrameNode> {
  const col = frameVertical(titulo, 8);
  col.appendChild(await texto(titulo, 16));
  col.appendChild(art);
  return col;
}

// Artwork de un contenedor: único si es grande; dividido en Dimensions | Spacing
// (etiquetados) si es chico.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec, medirHijos: boolean): Promise<FrameNode> {
  if (!esChico(contenedor.width, contenedor.height, spec.direccion)) {
    return await artworkModo(contenedor, spec, medirHijos, "completo");
  }
  const cont = frameHorizontal(`Artwork ${spec.elementoNombre}`, 48);
  cont.clipsContent = false;
  cont.appendChild(await artworkEtiquetado("Dimensions", await artworkModo(contenedor, spec, medirHijos, "dimensiones")));
  cont.appendChild(await artworkEtiquetado("Spacing", await artworkModo(contenedor, spec, medirHijos, "spacing")));
  return cont;
}
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: artwork dividido en Dimensions | Spacing para elementos chicos

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - `tag` (chico) → dos artworks etiquetados **Dimensions** (W/H + medidas de hijos) y **Spacing** (padding 4 lados + gap), cada uno legible.
  - `card`/`screen` (grandes y GRID) → un solo artwork, igual que antes.
- [ ] **Step 3: Ajustes** — si el umbral 48 deja afuera algún caso, moverlo en `esChico`; si los dos artworks quedan muy juntos, subir el gap del `frameHorizontal`.
