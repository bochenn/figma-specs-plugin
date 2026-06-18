# Rediseño de specs en cards + pills — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Entradas de specs como cards con borde + filas en pills + ChipVar monospace, en todas las secciones, según `docs/superpowers/specs/2026-06-18-specs-tarjetas-rediseno-design.md`.

**Architecture:** Helpers compartidos en `frames.ts` (`cargarFont` con fallback, `texto` con fuente, `chipVariable`, `filaPill`, `tarjeta`). Cada sección arma sus header+filas y usa los helpers. Faseado: helpers → Anatomy → Layout → Properties/Two-Way/Complete/Modes.

**Tech Stack:** TypeScript, `node --test`, esbuild. (Render impuro → verificación manual; fuentes con fallback impuro.)

---

### Task 1: Fuentes con fallback + `texto` con fuente

**Files:** `src/plugin/generadores/frames.ts`

- [ ] **Step 1: `cargarFont` + constantes + `texto` extendido** — en `frames.ts`, reemplazar la función `texto` y agregar arriba de ella:

```typescript
export const FONT_REG: FontName = { family: "Inter", style: "Regular" };
export const FONT_BOLD: FontName = { family: "Inter", style: "Bold" };
export const FONT_SEMI: FontName = { family: "Inter", style: "Semi Bold" };
export const FONT_MONO: FontName = { family: "JetBrains Mono", style: "Regular" };

const fontsCache = new Map<string, FontName>();

// Carga una fuente; si no está disponible en el archivo, cae a Inter Regular.
export async function cargarFont(font: FontName): Promise<FontName> {
  const key = `${font.family}|${font.style}`;
  const cached = fontsCache.get(key);
  if (cached) return cached;
  let real = font;
  try {
    await figma.loadFontAsync(font);
  } catch {
    real = FONT_REG;
    await figma.loadFontAsync(FONT_REG);
  }
  fontsCache.set(key, real);
  return real;
}

// Crea un texto. fontSize en px; `font` opcional (default Inter Regular), con fallback.
export async function texto(contenido: string, fontSize: number, font: FontName = FONT_REG): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await cargarFont(font);
  t.characters = contenido;
  t.fontSize = fontSize;
  t.fills = fillTematizado(varsTema().texto);
  return t;
}
```

- [ ] **Step 2: Build y suite** — `npm run build && node --test`
Expected: build OK; todos PASS (los usos existentes de `texto(x, n)` siguen con Inter Regular).

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/frames.ts
git commit -m "feat: cargarFont con fallback + texto acepta fuente (Bold/Semi/Mono)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Helpers `chipVariable` + `filaPill` + `tarjeta`

**Files:** `src/plugin/generadores/frames.ts`, `src/plugin/generadores/layout.ts`

- [ ] **Step 1: Agregar helpers a `frames.ts`** — después de `texto`:

```typescript
const BORDE_PILL: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB
const FONDO_CHIP: RGB = { r: 0.898, g: 0.906, b: 0.922 };  // #E5E7EB
const TEXTO_CHIP: RGB = { r: 0.2, g: 0.2, b: 0.2 };

// Chip gris para una variable/style (monospace). Compartido entre secciones.
export async function chipVariable(nombre: string): Promise<FrameNode> {
  const c = frameHorizontal("ChipVar", 0);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = c.paddingRight = 5;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: FONDO_CHIP }];
  const t = await texto(nombre, 11, FONT_MONO);
  t.fills = [{ type: "SOLID", color: TEXTO_CHIP }];
  c.appendChild(t);
  return c;
}

// Fila en pill con borde (cada atributo/propiedad). Appendea los nodos provistos.
export function filaPill(nodos: SceneNode[]): FrameNode {
  const fila = frameHorizontal("Fila", 6);
  fila.counterAxisAlignItems = "CENTER";
  fila.paddingTop = fila.paddingBottom = 6;
  fila.paddingLeft = fila.paddingRight = 8;
  fila.cornerRadius = 4;
  fila.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  fila.strokeWeight = 1;
  for (const n of nodos) fila.appendChild(n);
  return fila;
}

// Card de entrada: header (Inter Bold 16, con divisor inferior) + body (padding 16, gap 8).
export function tarjeta(headerNodos: SceneNode[], filas: FrameNode[]): FrameNode {
  const card = frameVertical("Card", 0);
  card.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.fills = fillTematizado(varsTema().fondoSpec);
  card.clipsContent = true;

  const header = frameHorizontal("Header", 8);
  header.counterAxisAlignItems = "CENTER";
  header.paddingTop = header.paddingBottom = 8;
  header.paddingLeft = header.paddingRight = 16;
  header.strokes = [{ type: "SOLID", color: BORDE_PILL }];
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;
  for (const n of headerNodos) header.appendChild(n);
  card.appendChild(header);
  header.layoutAlign = "STRETCH";

  const body = frameVertical("Body", 8);
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16;
  for (const f of filas) body.appendChild(f);
  card.appendChild(body);
  body.layoutAlign = "STRETCH";
  return card;
}
```

- [ ] **Step 2: Quitar `chipVariable` de layout.ts e importarlo** — en `layout.ts`, borrar la función local `chipVariable` (la que crea el chip gris Inter 11) y agregar `chipVariable` al import de `./frames.ts`. (El resto de layout.ts sigue igual por ahora; Task 4 lo reescribe.)

- [ ] **Step 3: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/frames.ts src/plugin/generadores/layout.ts
git commit -m "feat: helpers tarjeta/filaPill + chipVariable monospace compartido

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Aplicar en Anatomy

**Files:** `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Importar helpers** — agregar `tarjeta, filaPill, chipVariable, FONT_SEMI, FONT_BOLD` al import de `./frames.ts`.

- [ ] **Step 2: `filaAtributo` → pill** — reescribir `filaAtributo(attr)` para devolver un `filaPill([...])` con: swatch (si color) + `texto("clave:", 12, FONT_SEMI)` + (si variable/style: `chipVariable(valor)` + `texto("(raw)", 12, FONT_SEMI)`; si hardcoded: `texto(valor, 12, FONT_SEMI)`).

- [ ] **Step 3: `entradaLista` → card** — reescribir `entradaLista(indice, el, color)`:
  - `headerNodos = [badgePanel(indice, color), nodoIconoTipo(el.tipo)?, texto("nombre · TIPO", 16, FONT_BOLD)]`.
  - `filas`: por cada variant prop → `filaPill([texto("clave:", 12, FONT_SEMI), texto(valor, 12, FONT_SEMI)])` (o un solo texto); por cada atributo → `await filaAtributo(attr)`. Si no hay variantes pero hay `dependeDe` → una fila `Depends on: …`.
  - `return tarjeta(headerNodos, filas)`.

- [ ] **Step 4: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: Anatomy en cards + pills (header bold + atributos en pill + ChipVar)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Aplicar en Layout (exhibit)

**Files:** `src/plugin/generadores/layout.ts`

- [ ] **Step 1: `filaPropiedad` → pill** — reescribir `filaPropiedad(iconoKey, label, partes)` para devolver `filaPill([nodoIcono(iconoKey), texto(label, 12, FONT_SEMI), ...valorConChips_partes])`. (Mantener `valorConChips` que arma chips/textos; los textos a `FONT_SEMI`.) Importar `tarjeta, filaPill, FONT_SEMI, FONT_BOLD` de `./frames.ts`.

- [ ] **Step 2: `exhibit` → card** — envolver el contenido del exhibit en `tarjeta`: header = `[texto(nombre · TIPO, 16, FONT_BOLD)]` (con el ícono de dirección opcional); filas = las `filaPropiedad(...)` que hoy se appendean al `fila` vertical. `exhibit` devuelve `tarjeta(header, filas)`.

- [ ] **Step 3: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: panel de Layout en card + filas-pill

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Aplicar en Properties / Two-Way / Complete / Modes

**Files:** `src/plugin/generadores/properties.ts`, `complete.ts`, `modes.ts`

- [ ] **Step 1: Properties** — los bloques por opción/variante pasan a `tarjeta` (header = nombre de la opción/variante en `FONT_BOLD`); cada atributo cambiado a `filaPill` (con `chipVariable` si hay variable). Read `properties.ts` y adaptar `displayOpcion`/`subseccion`.

- [ ] **Step 2: Two-Way** — idem: cada combinación como `tarjeta` con sus cambios en `filaPill`.

- [ ] **Step 3: Complete** — los bloques por variante (Complete Anatomy/Layout) como `tarjeta`; las líneas de propiedades como `filaPill`.

- [ ] **Step 4: Modes** — cada bloque de mode como `tarjeta`; los `appliedAs: variable (valor)` como `filaPill` (con `chipVariable`).

- [ ] **Step 5: Build y suite** — `npm run build && node --test` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/properties.ts src/plugin/generadores/complete.ts src/plugin/generadores/modes.ts
git commit -m "feat: Properties/Two-Way/Complete/Modes en cards + pills

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Cada entrada de spec es una card con borde + header en negrita con divisor + filas-pill con borde.
  - ChipVar en monospace `#E5E7EB` (o Inter si JetBrains Mono no está instalado).
  - Aplica en Anatomy, Layout, Properties, Two-Way, Complete, Modes; Styling sigue como tabla.
- [ ] **Step 3: Ajustes** — colores de borde/fondo, paddings, o fuentes si el fallback no convence.
