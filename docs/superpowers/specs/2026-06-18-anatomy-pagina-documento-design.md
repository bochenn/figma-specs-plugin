# Anatomy como página de documento — Diseño

**Fecha:** 2026-06-18
**Referencias:** `Specifications-redesign 2.pdf` (mockup de la página), `Specifications-instrucciones.pdf` (anatomía por capas).

## Objetivo

Envolver el bloque artwork + cards de Anatomy (ya existente) con tres elementos de
presentación que lo conviertan en una página estilo documento, igual al mockup del
usuario: header de página, título + descripción, y un tag "ANATOMY".

## Contexto actual

`src/plugin/generadores/anatomy.ts` genera, por elemento, vía `specDeAnatomy`:

```
<Nombre> Spec (vertical, gap 48)
├─ texto(<nombre>, 64)
└─ Anatomy (vertical, gap 64)           ← seccionDeAnatomy
   ├─ texto("Anatomy", 48)
   └─ Display (horizontal, gap 64)
      ├─ Artwork (clon + marcadores + bordes punteados)
      └─ Content (cards: tarjeta + filaPill + chipVariable)
```

`generarAnatomy` envuelve un solo `specDeAnatomy` en `Specifications`.
`generarAnatomyConNested` apila `specDeAnatomy` del principal + uno por cada anidado.

La estructura de cards / filas-pill / ChipVar ya coincide con la anatomía del PDF; no
se toca.

## Cambios

### 1. Header de página (NUEVO, una sola vez arriba de todo)

Frame horizontal full-width con dos textos a los extremos y borde inferior 1px:

- Izquierda: nombre del plugin, constante `"BLUEPRINT SPECS & HANDOFF"`.
- Derecha: nombre de la sección, `"ANATOMY"`.
- Ambos textos: uppercase, 12px, semibold, color gris oscuro `#374151`, letterSpacing
  ~0.08em.
- Borde inferior: 1px `#D1D5DB` (`BORDE_PILL`).

Se genera **una sola vez**, como primer hijo del frame `Specifications` (no se repite por
elemento anidado).

### 2. Título + descripción (NUEVO, reemplaza al texto de nombre 64px de `specDeAnatomy`)

Bloque vertical (gap 8):

- Título: el nombre del nodo, 40px, `FONT_BOLD`, color de tema `texto`.
- Descripción: texto fijo
  `"This a placeholder text to add a brief description of what this element does in the project."`,
  16px regular, color `#6B7280` (`COLOR_CLAVE`). Queda como texto que el usuario edita a
  mano en Figma.

### 3. Tag "ANATOMY" (NUEVO, reemplaza al `texto("Anatomy", 48)` de `seccionDeAnatomy`)

Chip con borde, sin fill:

- `frameHorizontal`, padding 6/16, corner radius 6.
- Stroke `#374151` 1px, sin fill.
- Texto `"ANATOMY"`, 12px, semibold, uppercase, color `#374151`, letterSpacing ~0.08em.

## Estructura resultante

```
Specifications (vertical)
├─ Header de página         ← NUEVO, una vez
├─ <Nombre> Spec (vertical)
│  ├─ Título + descripción  ← NUEVO (reemplaza texto 64)
│  └─ Anatomy
│     ├─ Tag "ANATOMY"      ← NUEVO (reemplaza texto "Anatomy" 48)
│     └─ Display (Artwork + Content)   ← sin cambios
└─ (por cada anidado) <Nombre> Spec
   ├─ Título + descripción
   └─ Anatomy
      ├─ Tag "ANATOMY"
      └─ Display
```

## Decisiones confirmadas

- Header de página: una sola vez arriba de todo (encabezado de documento).
- Descripción: placeholder fijo, editable a mano.
- Título: 40px (estilo título de documento).

## Alcance / no incluye

- No cambia la estructura de cards, filas-pill ni ChipVar (ya coinciden).
- No cambia el artwork ni los marcadores.
- Solo afecta Anatomy (`generadores/anatomy.ts`); otras secciones no se tocan.

## Testing

- Los generadores nuevos (header, título+desc, tag) tocan `figma.*`, así que se verifican
  manualmente por PDF, igual que el resto de generadores impuros del proyecto.
- Correr `node --test` para confirmar que no se rompe nada existente.
