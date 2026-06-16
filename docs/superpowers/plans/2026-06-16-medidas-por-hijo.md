# Medidas por elemento hijo (DesignDoc 3/3 · C3) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Toggle "Element measures" que dibuja una cota de ancho y otra de alto (línea + número) por cada hijo directo del contenedor en el artwork de Layout, según `docs/superpowers/specs/2026-06-16-medidas-por-hijo-design.md`.

**Architecture:** `artworkDe` reusa `hijosRects` (ya calculados) y, con `medirHijos` activo, dibuja por cada hijo dos cotas con `svgCotaH/svgCotaV` (estilo fixed) + `textoCota`. Toggle nuevo cableado por `MensajeUI`. Generador impuro → verificación manual.

---

### Task 1: Dibujo de cotas por hijo en `artworkDe`

**Files:** `src/plugin/generadores/layout.ts`.

- [ ] **Step 1: Helper `dibujarCotaHijo`** — agregar después de `dibujarCotas` (usa los helpers
existentes `svgCotaH/svgCotaV/textoCota/etiquetaSpacing`):

```typescript
// Cotas de ancho (arriba) y alto (izquierda) de un hijo directo, con su número.
async function dibujarCotaHijo(artwork: FrameNode, hijo: Rect): Promise<void> {
  const u = unidadActual();
  const cw = figma.createNodeFromSvg(svgCotaH("fixed", hijo.width));
  cw.x = hijo.x;
  cw.y = hijo.y - 14;
  artwork.appendChild(cw);
  const tw = await textoCota(etiquetaSpacing(hijo.width, u), artwork);
  tw.x = hijo.x + hijo.width / 2 - tw.width / 2;
  tw.y = hijo.y - 14 - 12;
  const chh = figma.createNodeFromSvg(svgCotaV("fixed", hijo.height));
  chh.x = hijo.x - 14;
  chh.y = hijo.y;
  artwork.appendChild(chh);
  const th = await textoCota(etiquetaSpacing(hijo.height, u), artwork);
  th.x = hijo.x - 14 - th.width - 2;
  th.y = hijo.y + hijo.height / 2 - th.height / 2;
}
```

- [ ] **Step 2: Firma de `artworkDe` y llamada** — `artworkDe` gana `medirHijos: boolean`:
```typescript
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec, medirHijos: boolean): Promise<FrameNode> {
```
Tras pintar los hijos azules (`for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);`),
agregar:
```typescript
  if (medirHijos) for (const h of hijosRects) await dibujarCotaHijo(artwork, h);
```
(Va antes del branch GRID y del camino H/V, así aplica a ambos.)

- [ ] **Step 3: `generarLayout` propaga `medirHijos`** — sumar `medirHijos: boolean` a la firma:
```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean, medirHijos: boolean): Promise<FrameNode> {
```
y en la llamada a `artworkDe` dentro del loop de filas:
```typescript
    fila.appendChild(await artworkDe(contenedores[i], specs[i], medirHijos));
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS (sin tests nuevos).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: cotas de ancho/alto por hijo en el artwork de Layout (C3)"
```

---

### Task 2: Plumbing — toggle, mensaje y main

**Files:** `src/ui/index.html`, `src/ui/ui.ts`, `src/plugin/modelo/tipos.ts`, `src/plugin/main.ts`.

- [ ] **Step 1: UI** — en `src/ui/index.html`, en la sección Opciones (junto a `Itemize instances`):
```html
        <label class="toggle"><input type="checkbox" id="medirHijos" /> Element measures</label>
```
En `src/ui/ui.ts`, agregar la ref y el campo del mensaje:
```typescript
const medirHijosCheck = document.getElementById("medirHijos") as HTMLInputElement;
```
y en el `pluginMessage`, sumar `medirHijos: medirHijosCheck.checked,`.

- [ ] **Step 2: `MensajeUI`** — en `src/plugin/modelo/tipos.ts`, agregar `medirHijos?: boolean;` al
type `MensajeUI` (junto a `itemizar?`).

- [ ] **Step 3: main** — `generarSeccionLayout` gana `medirHijos: boolean`:
```typescript
async function generarSeccionLayout(nodo: SceneNode, columnas: number, hideOuter: boolean, itemizar: boolean, medirHijos: boolean): Promise<void> {
```
y la llamada interna:
```typescript
  const frame = await generarLayout(nodo, specs, columnas, hideOuter, itemizar, medirHijos);
```
En el dispatch del `onmessage`:
```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, columnas, msg.hideOuter ?? false, msg.itemizar ?? false, msg.medirHijos ?? false);
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/modelo/tipos.ts src/plugin/main.ts
git commit -m "feat: toggle Element measures cableado a Layout (C3)"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` → verde.
- [ ] **Step 2: Manual (usuario)** — `Element measures` OFF → como hoy; ON → cada hijo directo del
contenedor muestra su cota de ancho (arriba) y alto (izquierda) con el número. Combinar con
`Itemize instances` y Units = rem. Comparar contra `designdoc.pdf`.
- [ ] **Step 3: Ajustes** — si las cotas de hijo se solapan o salen, ajustar offsets (`-14`, etc.).
```bash
git add -A && git commit -m "fix: ajustes de medidas por hijo"
```
