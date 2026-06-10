# Diseño — Overlays de Layout — Rebanada 9

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Agregar los **overlays de color** a Layout and Spacing: azul = elemento, verde = padding, naranja = item spacing, sobre un clon del artwork. Sin marcadores numéricos, íconos ni labels de resizing (rebanada posterior).

---

## Contexto y estrategia

Layout and Spacing (Rebanada 3) hoy genera solo la **lista textual** de atributos por capa con Auto Layout.
El PRD además dibuja overlays de color (azul=elemento, verde=padding, naranja=spacing), marcadores e íconos
sobre un clon anotado.

Esta rebanada agrega **los tres overlays de color**, que son el corazón visual de la feature. La geometría
(dónde van los rects de padding y los gaps) queda en funciones puras testeadas; el clon + dibujo es impure
(se valida a mano).

**Decisiones tomadas en el brainstorming:**
- Alcance: overlays azul/verde/naranja sobre el clon, para todos los frames con Auto Layout (raíz + anidados). Sin marcadores/íconos/labels.
- La posición de cada frame se calcula por **acumulación de `x`/`y`** relativa a la raíz del clon (no `absoluteBoundingBox`).
- El gap naranja usa el **hueco medido** entre hijos (robusto con "Space between").
- Colores semitransparentes (aprox.); se afinan contra `prd-images` si hace falta.

---

## Sección 1 — Geometría pura (`utils/overlays.ts`)

```typescript
export interface Rect { x: number; y: number; width: number; height: number; }
```

**`rectsPadding(frame: Rect, padding: { left: number; top: number; right: number; bottom: number }): Rect[]`**
— bandas verdes de padding (top, bottom, left, right), omitiendo las de padding 0:

```
top:    { x: frame.x, y: frame.y, width: frame.width, height: padding.top }
bottom: { x: frame.x, y: frame.y + frame.height - padding.bottom, width: frame.width, height: padding.bottom }
left:   { x: frame.x, y: frame.y + padding.top, width: padding.left, height: frame.height - padding.top - padding.bottom }
right:  { x: frame.x + frame.width - padding.right, y: frame.y + padding.top, width: padding.right, height: frame.height - padding.top - padding.bottom }
```

**`rectsSpacing(children: Rect[], direccion: "HORIZONTAL" | "VERTICAL"): Rect[]`** — gaps naranjas entre
hijos consecutivos (hueco medido), omitiendo gaps ≤ 0:

```
HORIZONTAL: x = children[i].x + children[i].width; w = children[i+1].x - x; → { x, y: children[i].y, width: w, height: children[i].height }
VERTICAL:   y = children[i].y + children[i].height; h = children[i+1].y - y; → { x: children[i].x, y, width: children[i].width, height: h }
```

**Decisión de diseño:** toda la matemática de overlays en estas dos funciones puras y testeadas. El azul
(elemento) es el rect del frame en sí, sin cálculo.

---

## Sección 2 — Clon, recorrido y dibujo (`generadores/layout.ts`)

`generarLayout` pasa a recibir el **nodo real** (para clonar):

```
generarLayout(seleccionado: SceneNode, specs: LayoutSpec[])
```

**Estructura del output:**
```
Layout and Spacing (section)
├── Heading "Layout and Spacing"
├── Artwork  ← clon del seleccionado + overlays   [NUEVO]
└── exhibits de texto (uno por capa)              [como hoy]
```

**Artwork:** clon del seleccionado dentro de un frame `Artwork` (layoutMode NONE) en (0,0).

**`dibujarOverlays`** (impure): recorre el clon acumulando offset relativo a la raíz (con `node.x`/`node.y`),
frena en instancias. Por cada frame con Auto Layout (layoutMode HORIZONTAL/VERTICAL):
- `frameRect = { x: offX, y: offY, width: node.width, height: node.height }`.
- azul: rect en `frameRect`, fill azul opacity ~0.12.
- verde: `rectsPadding(frameRect, padding)` → rects opacity ~0.35.
- naranja: `rectsSpacing(childrenRects, layoutMode)` → rects opacity ~0.5.

`childrenRects` = cada hijo directo en coords relativas a la raíz (`offX + child.x`, `offY + child.y`,
`child.width`, `child.height`). Los overlays se cuelgan del `Artwork` (sin clip), apilados azul→verde→naranja.

**`main.ts`:** `generarSeccionLayout` pasa el nodo real a `generarLayout`.

**Decisión de diseño:** posición por acumulación de `x`/`y` (no `absoluteBoundingBox`), así funciona aunque
el clon no esté renderizado. `dibujarOverlays` (impure) usa `rectsPadding`/`rectsSpacing` (puras).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Sin Auto Layout | Artwork = clon sin overlays; exhibits con la nota de siempre. |
| Padding 0 (algún lado) | `rectsPadding` omite esa banda. |
| 0 o 1 hijo | `rectsSpacing` no emite gaps. |
| Gaps ≤ 0 | Se omiten. |
| `clone()` falla | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `rectsPadding`: frame 100×100 con padding {10,10,10,10} → 4 bandas correctas; solo top → 1; padding 0 → [].
- `rectsSpacing`: 2 hijos horizontales con hueco 12 → 1 gap; 2 verticales → gap vertical; 1 hijo → []; hijos pegados → [].

**2. Verificación manual en Figma:** frame con Auto Layout (padding + gap + varios hijos + un frame interno
con su propio Auto Layout) → "Layout & Spacing" → verificar los overlays (azul/verde/naranja) bien
posicionados sobre el clon, además de los exhibits. Comparar contra `prd-images/3. Layout and Spacing/`.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Marcadores numéricos de padding/spacing.
- Íconos de dirección y alineación.
- Marcadores de resizing (Fill/Hug/Fixed) visuales.
- "Hide outer layout annotations".
- Overlays para layout-grid (solo HORIZONTAL/VERTICAL).
