# Diseño — Marcadores de Layout — Rebanada 27

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Completar las anotaciones visuales de Layout and Spacing que quedaron fuera de la Rebanada 9: marcadores numéricos de padding/spacing, cotas de resizing (Fill/Hug/Fixed) e íconos de dirección. Incluye reestructurar el output a **un artwork por contenedor** con Auto Layout, como muestra el PRD.

---

## Contexto y estrategia

La Rebanada 9 agregó los overlays de color (azul = elemento, verde = padding, naranja = item spacing)
sobre **un único clon** del nodo seleccionado, dibujando los overlays de todos los niveles juntos.

El PRD (`prd-images/3. Layout and Spacing/`) muestra además:

1. **Marcadores numéricos**: cifras verdes (padding) y naranjas (item spacing) proyectadas a los bordes
   del artwork, con `Auto` cuando el spacing es "space between".
2. **Cotas de resizing** (azules, sin número): una horizontal arriba y una vertical a la izquierda,
   cuyo estilo de puntas codifica el resizing del eje (Fixed / Fill / Hug).
3. **Ícono de dirección** arriba a la izquierda: flecha → (horizontal), ↓ (vertical), variante con
   grilla cuando hay wrap.

Con marcadores numéricos, dibujar todos los niveles sobre un solo clon hace que los números se
superpongan en componentes anidados. El PRD lo resuelve con **un artwork por contenedor**: cada frame
con Auto Layout tiene su propio clon anotado junto a su exhibit de texto.

**Decisiones tomadas en el brainstorming:**
- Alcance: todo lo del PRD en una rebanada (números + cotas de resizing + íconos de dirección).
  Esto cierra los tres pendientes de Layout del backlog.
- Estructura: un artwork por contenedor con Auto Layout (raíz + anidados), cada uno junto a su
  exhibit de texto. En cada artwork se pintan solo los overlays de **ese** contenedor
  (padding verde, gaps naranjas, hijos directos en azul).
- Las cotas azules no llevan número: su forma es el marcador de resizing.
- Los colores de marcadores pasan por `tema.ts` (Dark mode sigue funcionando).

---

## Sección 1 — Modelo (`modelo/tipos.ts`)

`LayoutSpec` ya tiene `direccion`, `resizingHorizontal/Vertical` (`"Fill" | "Hug" | "Fixed"`) e
`itemSpacing: number`. Se agregan dos campos que el PRD necesita:

```typescript
wrap: boolean;        // layoutWrap === "WRAP"
spacingAuto: boolean; // primaryAxisAlignItems === "SPACE_BETWEEN" → marcador "Auto"
```

La extracción los completa donde hoy se arma el `LayoutSpec`.

---

## Sección 2 — Geometría pura (`utils/marcadores-layout.ts`)

Archivo nuevo, hermano de `marcadores.ts` (que es de Anatomy). Todo opera sobre los `Rect` que ya
devuelven `rectsPadding` y `rectsSpacing` de `utils/overlays.ts`.

**`marcasEjeX(frame: Rect, bandas: Banda[], spacingAuto: boolean): MarcaX[]`** — para cada banda
**vertical** (padding left/right, gaps de dirección HORIZONTAL): una marca proyectada **arriba** del
artwork, centrada en el ancho de la banda.

**`marcasEjeY(frame: Rect, bandas: Banda[], spacingAuto: boolean): MarcaY[]`** — para cada banda
**horizontal** (padding top/bottom, gaps de dirección VERTICAL): una marca proyectada **a la
izquierda**, centrada en el alto de la banda.

```typescript
export interface Banda { rect: Rect; tipo: "padding" | "spacing"; }
export interface MarcaX { x: number; valor: string; tipo: "padding" | "spacing"; }
export interface MarcaY { y: number; valor: string; tipo: "padding" | "spacing"; }
```

- `valor` es el grosor de la banda formateado con las utilidades de unidades existentes
  (`espaciado.ts`); si `spacingAuto` es true, las marcas de spacing dicen `"Auto"`.
- Bandas de grosor 0 no generan marca (igual que los overlays).

**`estiloCota(resizing: string): "fixed" | "fill" | "hug"`** — mapea el resizing del eje al estilo
de puntas de la cota azul: Fixed = línea con topes en los extremos, Fill = flechas hacia afuera,
Hug = flechas hacia adentro.

**`iconoDireccion(direccion: "HORIZONTAL" | "VERTICAL", wrap: boolean): "flecha-h" | "flecha-v" | "grilla-h" | "grilla-v"`**
— elige el ícono del artwork.

Constantes de posición (offsets de las marcas respecto del borde, separación de las cotas, tamaño
del ícono) en este mismo archivo, exportadas para los tests.

---

## Sección 3 — Generador (`generadores/layout.ts`)

`generarLayout` cambia de estructura:

1. El recorrido actual que detecta frames con Auto Layout (raíz + anidados) se conserva, pero en vez
   de acumular overlays sobre un clon único, por cada contenedor produce **una fila**: artwork
   anotado + exhibit de texto (el exhibit por contenedor ya existe).
2. El artwork de cada contenedor es un **clon de ese subárbol**. Sobre él se pintan los overlays del
   contenedor (reutilizando `rectsPadding`/`rectsSpacing`) y las anotaciones nuevas:
   - **Números**: nodos de texto verdes/naranjas en las posiciones de `marcasEjeX`/`marcasEjeY`,
     con sus líneas de extensión finas hacia la banda correspondiente.
   - **Cotas azules**: una horizontal arriba (estilo según `estiloCota(resizingHorizontal)`) y una
     vertical a la izquierda (según `resizingVertical`), dibujadas con `createNodeFromSvg`.
   - **Ícono de dirección**: SVG fijo según `iconoDireccion`, arriba a la izquierda del artwork.
3. Los SVG de puntas e íconos son strings constantes en el generador; el color se inyecta desde
   `tema.ts` antes de crear el nodo.

El layout general del output (frame contenedor, columnas, títulos) no cambia: solo se multiplican
las filas artwork+exhibit.

---

## Sección 4 — Testing y verificación

**Tests (`node --test`, `tests/marcadores-layout.test.ts`):**
- `marcasEjeX`/`marcasEjeY`: posiciones y valores para un frame con padding asimétrico y varios gaps;
  bandas de grosor 0 omitidas; `Auto` cuando `spacingAuto`.
- `estiloCota`: los tres mapeos.
- `iconoDireccion`: las cuatro combinaciones.
- Extracción: `wrap` y `spacingAuto` salen bien del nodo (con los fixtures de extracción existentes).

**Verificación manual en Figma:** componente con Auto Layout anidado (estilo "ESDSV Alert" del PRD:
raíz horizontal con padding 16 y spacing 8, hijo vertical con spacing 4) → "Layout & Spacing" →
comparar contra `prd-images/3. Layout and Spacing/layout-1.*.webp`: un artwork por contenedor,
números bien ubicados y coloreados, cotas con las puntas correctas, ícono correcto. Probar también
un frame con wrap y "space between" (marcador `Auto` + ícono grilla) y Dark mode.

---

## Fuera de alcance de esta rebanada

- "Hide outer layout annotations" (toggle del PRD).
- Overlays/marcadores para layout grids (solo HORIZONTAL/VERTICAL).
- Marcadores de spacing negativo.
