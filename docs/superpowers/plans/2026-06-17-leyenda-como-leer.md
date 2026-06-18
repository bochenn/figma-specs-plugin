# Leyenda "How to read these specs" (toggle) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Un toggle que antepone al output un bloque "How to read these specs" con muestras visuales reales, según `docs/superpowers/specs/2026-06-17-leyenda-como-leer-design.md`.

**Architecture:** `seccionLeyenda()` en `layout.ts` arma el bloque reusando los helpers visuales (`cota`, `cotaConNombre`, `chipVariable`, `svgCotaH`). Un toggle `leyenda` en la UI lo activa; `main` lo antepone al `spec`.

**Tech Stack:** TypeScript, `node --test`, esbuild. (Contenido impuro → sin tests nuevos; verificación manual.)

---

### Task 1: `seccionLeyenda()` en layout.ts

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Agregar el generador** — al final de `src/plugin/generadores/layout.ts`, agregar:

```typescript
const ANCHO_MUESTRA = 150;

// Caja de ancho fijo donde va la muestra visual de un ítem de la leyenda.
function muestraBox(): FrameNode {
  const box = frameHorizontal("Muestra", 6);
  box.counterAxisAlignItems = "CENTER";
  box.primaryAxisSizingMode = "FIXED";
  box.counterAxisSizingMode = "AUTO";
  box.resize(ANCHO_MUESTRA, 1);
  return box;
}

// Fila de la leyenda: muestra visual (ancho fijo) + explicación.
async function filaLeyenda(box: FrameNode, explicacion: string): Promise<FrameNode> {
  const fila = frameHorizontal("Item", 16);
  fila.counterAxisAlignItems = "CENTER";
  fila.appendChild(box);
  fila.appendChild(await texto(explicacion, 14));
  return fila;
}

// Bloque "How to read these specs": explica las convenciones del artwork de Layout
// con muestras visuales reales.
export async function seccionLeyenda(): Promise<FrameNode> {
  const sec = frameVertical("How to read these specs", 16);
  sec.appendChild(await texto("How to read these specs", 36));

  const b1 = muestraBox();
  await cota("240", CHIP_DIM, b1);
  sec.appendChild(await filaLeyenda(b1, "Dimension cota: element or child width/height (red)."));

  const b2 = muestraBox();
  await cotaConNombre("padding-1x", "16", CHIP_PADDING, b2);
  sec.appendChild(await filaLeyenda(b2, "Padding: distance to the edge; chip with the variable (blue) + value."));

  const b3 = muestraBox();
  await cotaConNombre("gap-0_5x", "8", CHIP_GAP, b3);
  sec.appendChild(await filaLeyenda(b3, "Item spacing (gap): space between children (pink)."));

  const b4 = muestraBox();
  b4.appendChild(figma.createNodeFromSvg(svgCotaH("fixed", 40)));
  sec.appendChild(await filaLeyenda(b4, "Measurement line: marks the span of that band."));

  const b5 = muestraBox();
  b5.appendChild(await chipVariable("sizing/card-width"));
  sec.appendChild(await filaLeyenda(b5, "Grey chip in the panel: bound variable (resolved value in parentheses)."));

  const b6 = muestraBox();
  b6.appendChild(await texto("card", 12));
  sec.appendChild(await filaLeyenda(b6, "Left of each row: the layer hierarchy; the row's element is in bold."));

  sec.appendChild(await texto("For small elements the artwork is split in two: Dimensions (W/H) and Spacing (padding & gap).", 14));
  return sec;
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`. (`seccionLeyenda` aún no se usa; no rompe.)

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: seccionLeyenda (How to read these specs) con muestras visuales

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Mensaje + main anteponen la leyenda

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Campo en el mensaje** — en `src/plugin/modelo/tipos.ts`, en `MensajeUI`, agregar `leyenda?: boolean;` (junto a los otros toggles, p. ej. después de `medirHijos?: boolean;`). Queda, por ejemplo:

```typescript
export type MensajeUI = { tipo: "generar"; secciones: Seccion[]; nested?: boolean; dark?: boolean; columnas?: number; tabla?: boolean; hideOuter?: boolean; itemizar?: boolean; medirHijos?: boolean; leyenda?: boolean; formatoColor?: FormatoColor; unidad?: Unidad; formatoTipo?: FormatoTipo; formatoRaw?: FormatoColor; mostrarRaw?: boolean; preferencia?: Preferencia };
```

- [ ] **Step 2: Importar `seccionLeyenda` en main** — en `src/plugin/main.ts`, agregar `seccionLeyenda` al import existente de `./generadores/layout.ts` (donde se importa `seccionDeLayout`):

```typescript
import { seccionDeLayout, seccionLeyenda } from "./generadores/layout.ts";
```

- [ ] **Step 3: Anteponer la leyenda** — en `main.ts`, dentro del `try` del `onmessage`, después de `specifications.appendChild(spec);` y ANTES de `spec.appendChild(await texto(nodo.name, 64));`, agregar:

```typescript
    if (msg.leyenda) spec.appendChild(await seccionLeyenda());
```

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/main.ts
git commit -m "feat: main antepone la leyenda cuando el toggle está activo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Toggle en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Checkbox** — en `src/ui/index.html`, en el grupo "Opciones" (el `<div class="toggles">`), agregar después del toggle `medirHijos`:

```html
        <label class="toggle"><input type="checkbox" id="leyenda" /> Include legend</label>
```

- [ ] **Step 2: Leer y enviar** — en `src/ui/ui.ts`:
  - declarar la referencia (junto a las otras, p. ej. después de `medirHijosCheck`):
```typescript
const leyendaCheck = document.getElementById("leyenda") as HTMLInputElement;
```
  - en el `pluginMessage` del onclick de `#crear`, agregar `leyenda: leyendaCheck.checked,` (junto a `medirHijos: medirHijosCheck.checked,`).

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK (la UI se inlinea en `dist/ui.html`); todos PASS.

- [ ] **Step 4: Verificar inline** — confirmar que `dist/ui.html` contiene `id="leyenda"` y `leyenda:`.

Run: `grep -c 'id="leyenda"' dist/ui.html && grep -c 'leyenda:' dist/ui.html`
Expected: ambos ≥ 1.

- [ ] **Step 5: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts
git commit -m "feat: toggle 'Include legend' en la UI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, en Figma)**:
  - Con "Include legend" ON + alguna sección → el output arranca con el bloque "How to read these specs" y cada ítem muestra su muestra visual (cota roja, chip azul de padding, chip rosa de gap, línea, chip de variable, breadcrumb) + su explicación; el split aparece en el texto final.
  - Con el toggle OFF → el output es igual que hoy.
- [ ] **Step 3: Ajustes** — `ANCHO_MUESTRA`, tamaños de texto, o el orden de los ítems si hace falta.
