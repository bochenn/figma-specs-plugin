# Diseño — Hide outer layout annotations — Rebanada 33

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Toggle "Hide outer layout" que omite la fila (artwork + exhibit) del contenedor raíz en Layout and Spacing, dejando solo los contenedores anidados.

---

## Contexto y estrategia

Desde la Rebanada 27, Layout and Spacing genera una fila artwork+exhibit por cada contenedor con
Auto Layout, con el raíz primero (cuando tiene Auto Layout). El PRD ofrece "Hide outer layout
annotations" para cuando el contenedor exterior no aporta (es solo un wrapper).

**Decisiones tomadas en el brainstorming:**
- Con el toggle activo se omite **la fila completa** del raíz (artwork + exhibit).
- Si el raíz era el único contenedor, sale el mensaje de vacío existente.
- Default apagado; output idéntico al actual con el toggle off.

---

## Sección 1 — UI y mensaje

- `src/ui/index.html`: checkbox `Hide outer layout` (sin marcar) junto a los toggles existentes.
- `src/ui/ui.ts`: leerlo y sumarlo al `pluginMessage` como `hideOuter`.
- `modelo/tipos.ts`: `hideOuter?: boolean` en `MensajeUI`.
- `main.ts`: `generarSeccionLayout(nodo, columnas, hideOuter)` se lo pasa a `generarLayout`;
  el dispatch le pasa `msg.hideOuter ?? false`.

## Sección 2 — Generador (`generadores/layout.ts`)

`generarLayout` gana `hideOuter: boolean`:
- El primer contenedor es el raíz solo cuando la selección misma tiene Auto Layout
  (`contenedores[0] === seleccionado`, igualdad de referencia: `recorrerAutoLayout` devuelve los
  nodos reales). Con `hideOuter` activo y esa condición, el bucle de filas arranca en el índice 1.
- El mensaje "No se detectaron capas con Auto Layout." pasa a mostrarse cuando **las filas
  construidas** quedan en cero (cubre tanto la falta de contenedores como el raíz único oculto).

## Sección 3 — Testing y verificación

Sin lógica pura nueva (el salto es una condición en código impuro). Verificación manual en Figma:

1. Componente anidado → toggle ON → desaparece la fila del raíz, quedan los anidados.
2. Raíz único con Auto Layout → ON → mensaje de vacío.
3. Toggle OFF → output idéntico al actual.
4. El toggle no afecta a las demás secciones.

`npm run build && node --test` verdes (sin tests nuevos).

---

## Fuera de alcance de esta rebanada

- Ocultar niveles intermedios arbitrarios (solo el exterior, como el PRD).
