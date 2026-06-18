# Diseño — Leyenda "Cómo leer estos specs" (toggle)

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Agregar un **setting (toggle)** que, al generar, antepone un bloque de
**leyenda** explicando cómo leer el artwork de Layout (qué es cada cosa), con
muestras visuales reales.

Referencia: pedido del usuario ("un área de explicación de cómo se leen estos
specs, qué es cada cosa").

---

## Estado actual

El output es un frame `Specifications` con un `spec` (`frameVertical`) que tiene el
título del nodo + las secciones elegidas. No hay ninguna explicación de las
convenciones visuales (colores de cota, chips, líneas, breadcrumb, split). El
lenguaje visual de Layout vive en `generadores/layout.ts` (`cota`, `cotaConNombre`,
`chipVariable`, `svgCotaH`, colores `CHIP_DIM`/`CHIP_PADDING`/`CHIP_GAP`).

`MensajeUI` tiene toggles (nested, dark, tabla, hideOuter, itemizar, medirHijos,
mostrarRaw) leídos en `ui.ts` y aplicados en `main.ts`.

## Decisiones (brainstorming, confirmadas)

- **Alcance:** convenciones del **artwork de Layout** (no todas las secciones).
- **Formato:** cada ítem con una **muestra visual real** + su explicación en texto.
- **Ubicación:** un bloque "Cómo leer estos specs" **al principio del
  `Specifications`**, antes del título del nodo.
- Es **opt-in** vía un toggle nuevo (off por defecto).

## Sección 1 — Generador de la leyenda

Nueva función exportada `seccionLeyenda(): Promise<FrameNode>` en
`generadores/layout.ts` (donde están los helpers visuales). Devuelve un
`frameVertical("How to read these specs", ...)` con un heading + una fila por
convención. Cada fila: `[muestra visual] | [texto]`, con la muestra de ancho fijo
para alinear. Reusa los helpers existentes (`cota`, `cotaConNombre`,
`chipVariable`, `svgCotaH`).

El texto de la leyenda va en **inglés**, para ser consistente con el resto del
output (Width, Padding, "Layout and Spacing", etc.), que es el artefacto de
handoff. (A confirmar con el usuario; si lo prefiere en español, se traduce.)

Ítems (muestra → explicación):
- `cota("240", CHIP_DIM)` → "Dimension cota: element or child width/height (red)."
- `cotaConNombre("padding-1x", "16", CHIP_PADDING)` → "Padding: distance to the edge; chip with the variable (blue) + value."
- `cotaConNombre("gap-0_5x", "8", CHIP_GAP)` → "Item spacing (gap): space between children (pink)."
- línea `svgCotaH("fixed", 40)` → "Measurement line: marks the span of that band."
- `chipVariable("sizing/card-width")` → "Grey chip in the panel: bound variable (the resolved value is shown in parentheses)."
- breadcrumb de muestra (texto "card" en negrita / oscuro) → "Left of each row: the layer hierarchy; the row's element is in bold."
- (solo texto) → "For small elements the artwork is split in two: Dimensions (W/H) and Spacing (padding & gap)."

## Sección 2 — Toggle y cableado

- `MensajeUI`: agregar `leyenda?: boolean`.
- `ui/index.html`: un checkbox nuevo en el grupo Opciones, `id="leyenda"`, label
  "Include legend".
- `ui/ui.ts`: leer `leyendaCheck.checked` y pasarlo en el `pluginMessage`.
- `main.ts`: importar `seccionLeyenda`; tras crear `spec` y antes de
  `spec.appendChild(await texto(nodo.name, 64))`, si `msg.leyenda` →
  `spec.appendChild(await seccionLeyenda())`.

La leyenda se muestra siempre que el toggle esté ON, sin importar qué secciones se
generen.

## Sección 3 — Testing y verificación

- Es contenido impuro (genera nodos): **sin tests nuevos**; verificación manual.
- **Manual (PDF):** con el toggle ON, el output arranca con el bloque "Cómo leer
  estos specs" y cada ítem muestra su muestra visual + explicación; con el toggle
  OFF, el output es igual que hoy.

## Fuera de alcance

- Explicar las demás secciones (Anatomy/Styling/Modes/Properties).
- Traducir la leyenda (queda en español, como el resto del plugin para el usuario;
  los títulos de sección del output siguen en inglés).
- Muestras animadas o interactivas.
