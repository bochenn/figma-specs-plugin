# Diseño — Properties Boolean + highlight — Rebanada 12

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Sumar las propiedades **Boolean** a Properties, con **resaltado azul** de las capas que cada booleana controla, sobre un clon del variante default.

---

## Contexto y estrategia

Properties (Rebanadas 2 y 10) maneja solo propiedades **Variant**. El PRD suma las propiedades **Boolean**
(true/false que togglean la visibilidad de capas) con resaltado azul de las capas afectadas.

Esta rebanada agrega, por cada propiedad booleana, una subsección con el clon del variante default y
**rects azules** sobre las capas que esa booleana controla, + la lista de esas capas. Es **casi todo
impure** (lee `componentPropertyDefinitions`/`componentPropertyReferences`); la única pieza pura es un
helper que limpia el nombre de la propiedad.

**Decisiones tomadas en el brainstorming:**
- Alcance: detección de booleanas + highlight azul sobre el clon del default. Sin comparación ON/OFF.
- Se renderiza dentro de `generarProperties` (que ya tiene el `componentSet`); `main.ts` no cambia.
- El highlight reusa la técnica de acumulación de `x`/`y` de los overlays de Layout.
- El recorrido frena en instancias (consistente con el resto).

---

## Sección 1 — Detección y helper pure

**Impure** (en el generador): de `componentSet.componentPropertyDefinitions` se filtran las de
`type === "BOOLEAN"`. Cada una tiene una clave (ej. `"Show icon#8:0"`) y un `defaultValue`. Las capas
afectadas son los nodos del variante default cuya `componentPropertyReferences.visible` coincide con esa
clave.

**Pure** (`utils/propiedades.ts`): `nombrePropiedad(clave: string): string` saca el sufijo `#id`:

```
nombrePropiedad("Show icon#8:0") → "Show icon"
nombrePropiedad("Variant")       → "Variant"
nombrePropiedad("")              → ""
```

---

## Sección 2 — Generador: subsección por booleana + highlight (`generadores/properties.ts`)

Se agrega el render de las booleanas dentro de `generarProperties` (que ya recibe el `componentSet`),
después de las subsecciones de Variant.

**Por cada propiedad booleana:**
```
[nombrePropiedad]                         (heading subsección)
[Artwork]  ← clon del variante default + rects azules sobre las capas afectadas
Affected layers: nombre1, nombre2         (texto)
```

**Highlight** (impure, reusa acumulación de `x`/`y` de Layout): se clona `componentSet.defaultVariant` en
un frame `Artwork`; se recorre el clon acumulando offset (frena en instancias). Por cada nodo cuya
`componentPropertyReferences.visible` coincide con la clave de la booleana:
- rect azul semitransparente (opacity ~0.3) en `{ offX, offY, width, height }`,
- su nombre se junta para la lista.

**Decisión de diseño:** la booleana se renderiza dentro de `generarProperties`; `main.ts` no cambia.
`nombrePropiedad` (pura) limpia el nombre; el resto es impure.

> Si una booleana no controla capas visibles, la subsección muestra el artwork sin rects y
> "Affected layers: —".

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Sin propiedades booleanas | No se agregan subsecciones Boolean (solo Variant). |
| Booleana sin capas controladas | Artwork sin rects + "Affected layers: —". |
| `defaultVariant` null / `clone()` falla | Se saltea el artwork (o `try/catch` de `main.ts`). |
| Capa afectada dentro de instancia | El recorrido frena en instancias; no la resalta. |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `nombrePropiedad`: `"Show icon#8:0"` → `"Show icon"`; `"Variant"` → `"Variant"`; `""` → `""`.

**2. Verificación manual en Figma (el grueso):** Component Set con una propiedad booleana que controle la
visibilidad de una/dos capas → "Properties" → verificar la subsección de la booleana con el highlight azul
sobre las capas afectadas + la lista. Comparar contra `prd-images/2. properties/`. Verificar que las Variant
y el resto siguen andando.

**3. Componente de prueba fijo** con una booleana.

**Lo que NO se hace:** mock de `componentPropertyDefinitions`/`componentPropertyReferences`.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Comparación ON/OFF (dos artworks por booleana).
- Propiedades TEXT e INSTANCE_SWAP.
- Capas booleanas dentro de instancias anidadas.
- Two-Way Comparison (compound props).
