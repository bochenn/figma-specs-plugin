# Diseño — Rediseño de las "tablas" de specs en cards + pills

**Fecha:** 2026-06-18
**Proyecto:** Specs Plugin para Figma — handoff.
**Alcance:** Rediseñar las entradas/filas de specs (lo que hoy son textos sueltos) en
**cards con borde** + **filas en pills con borde** + **ChipVar monospace**, en TODAS las
secciones. Valores exactos tomados del Figma del usuario (`rediseño de los specs.pdf`,
`Specifications del rediseño de specs.pdf`).

---

## Decisiones (confirmadas con el usuario)

- **Aplica a TODAS las secciones** con filas de atributos/propiedades (Anatomy, Layout,
  Properties, Modes, Two-Way, Complete). La tabla de Styling Inventory queda como
  tabla (no es entrada-por-elemento); se evalúa aparte.
- **Fuentes con fallback:** Inter Bold (headers), Inter Semi Bold (filas), JetBrains
  Mono Regular (ChipVar). Si una fuente no está instalada → fallback a Inter Regular.
- Supera al PR #68 (ChipVar en Anatomy); ese PR se cierra.

## Especificación visual (exacta, del Figma del usuario)

- **Card de entrada** (por elemento): vertical, fill `#FFFFFF` (tematizado fondoSpec),
  stroke `#D1D5DB` 1px, corner radius **8**, padding 0, gap 0, clipsContent.
  - **Header:** horizontal, padding `8 16`, alto ~40, align Start/Center, **divisor**
    inferior `#D1D5DB` 1px; contenido en **Inter Bold 16** (badge + ícono de tipo + nombre).
  - **Body:** vertical, padding **16**, gap **8**; contiene las filas-pill.
- **Fila-pill** (por atributo/propiedad): horizontal, stroke `#D1D5DB` 1px, corner
  radius **4**, padding `6 8`, item spacing 6–8, align según el caso; texto en
  **Inter Semi Bold 12** (`clave:` + valor/chip + `(raw)`).
- **ChipVar:** horizontal, fill `#E5E7EB`, corner radius **4**, padding `2 5`,
  texto **JetBrains Mono Regular 11** (fallback Inter), color de texto oscuro.

## Sección 1 — Fuentes con fallback

Helper `cargarFont(family, style): Promise<FontName>` en `frames.ts`: intenta
`figma.loadFontAsync({family, style})`; si tira, carga y devuelve `{family:"Inter",
style:"Regular"}`. Cachea resultados para no reintentar.

`texto(contenido, fontSize, font?)`: 3er parámetro opcional `font = {family:"Inter",
style:"Regular"}`; usa `cargarFont(font)` para resolver la fuente real (con fallback) y
la setea en el nodo. (Default = comportamiento actual → no rompe los usos existentes.)
Constantes de estilo: `FONT_BOLD = {family:"Inter", style:"Bold"}`, `FONT_SEMI =
{family:"Inter", style:"Semi Bold"}`, `FONT_MONO = {family:"JetBrains Mono", style:"Regular"}`.

## Sección 2 — Helpers compartidos (frames.ts)

- **`chipVariable(nombre)`** (mover desde layout.ts y reestilar): fill `#E5E7EB`,
  radius 4, padding `2 5`, texto con `FONT_MONO` (11). Reusado por Layout y Anatomy.
- **`filaPill(nodos: SceneNode[])`**: frame horizontal con stroke `#D1D5DB`, radius 4,
  padding `6 8`, gap 6, align Start/Center; appendea los nodos. Devuelve el pill.
- **`tarjeta(headerNodos: SceneNode[], filas: FrameNode[])`**: card vertical (stroke
  `#D1D5DB`, radius 8, fill tematizado) con un header (padding 8/16, divisor inferior,
  contenido `headerNodos` en Inter Bold 16) y un body (padding 16, gap 8) con `filas`.

(El divisor inferior del header: stroke con `strokeTopWeight/Right/Left = 0` y
`strokeBottomWeight = 1`, o una línea fina full-width; el plan elige.)

## Sección 3 — Aplicación por sección

- **Anatomy** (`entradaLista`): card por elemento; header = badge + ícono de tipo +
  nombre·TIPO; filas-pill = variant props (`Type: …`) + atributos (`clave:` + ChipVar/
  valor + `(raw)`, con swatch de color).
- **Layout** (`exhibit`/`filaPropiedad`): card por capa (header = ícono dir + nombre);
  cada propiedad (Width/Height/Fill/…) como fila-pill (ícono + label + valor con ChipVar).
- **Properties / Two-Way / Complete / Modes:** cada bloque por opción/variante/mode
  como card; sus atributos/cambios como filas-pill.
- **Styling Inventory:** queda como tabla (fuera del patrón card/pill por ahora).

El patrón es uniforme; cada sección arma sus `headerNodos` + `filas` y llama a
`tarjeta`/`filaPill`/`chipVariable`.

## Sección 4 — Testing y verificación

- **Pura:** `cargarFont` no es testeable (impuro). Sin tests nuevos relevantes; la
  lógica de datos (parseVariantes, valorColor, etc.) ya está testeada.
- **Manual (PDF):** cards con borde + header en negrita con divisor + filas-pill con
  borde + ChipVar monospace, en cada sección; fallback de fuente si JetBrains Mono no
  está; nada se corta.

## Fuera de alcance

- Reescribir la tabla de Styling Inventory como cards (queda tabla).
- Cambiar la lógica de extracción/datos (solo presentación).
