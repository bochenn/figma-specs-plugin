# Diseño — Pills en Properties — Rebanada 10

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Llevar el swatch/pill (de Variable Formatting) a los cambios de color de Properties. Un solo swatch (el color de la opción).

---

## Contexto y estrategia

Properties hoy muestra los cambios entre variantes como texto plano (`lineaAtributo`). Variable Formatting
ya puso `swatchHex` en cada `Atributo` (vía `leerAtributos`). Falta arrastrarlo por el diff
(`AtributoCambiado` no lo lleva) y dibujar el pill en el generador de Properties.

**Decisiones tomadas en el brainstorming:**
- Alcance: un solo swatch (el color de la **opción**) en los cambios de color. Dos swatches (default + opción) queda como mejora.
- Reutiliza `hexARgb` (`utils/color.ts`) y el patrón del pill de Anatomy.

---

## Sección 1 — Modelo y diff

**`AtributoCambiado`** (`modelo/tipos.ts`) suma `swatchHex?`:

```typescript
export interface AtributoCambiado {
  clave: string;
  valorDefault?: string;
  valorOpcion?: string;
  swatchHex?: string;   // color del swatch (el de la opción; solo atributos de color)
}
```

**`diffAtributos`** (pura, `comparacion/variantes.ts`): por cada atributo que cambia, arrastra el
`swatchHex` del atributo de la opción (o el del default si la opción no lo tiene). Solo se setea cuando
existe (los no-color quedan sin swatch).

> Como `leerAtributos` ya pone `swatchHex` en los atributos de color, los cambios de color de Properties
> ahora lo llevan. Eso rompe el `deepEqual` de tests existentes (`comparar-variante`, `properties-extraccion`)
> que asumían el shape viejo: **se actualizan** para incluir `swatchHex`.

---

## Sección 2 — Render del pill en `generadores/properties.ts`

Hoy cada cambio se dibuja como texto vía `lineaAtributo(c)`. Se agrega `filaAtributoCambiado(c)`:
- Si `c.swatchHex` (color): frame horizontal con swatch 12×12 (`hexARgb(c.swatchHex)` + borde gris) + el
  texto `lineaAtributo(c)`.
- Si no (width, opacity): `texto(lineaAtributo(c))` plano como hoy.

```
[■] background-color: Color/B (default: Color/A)
```

En `listaCambios`, el loop por atributos pasa de `texto(lineaAtributo(attr))` a `filaAtributoCambiado(attr)`.
`lineaAtributo` no cambia (arma el string). Reutiliza `hexARgb` y `frameHorizontal`.

**Decisión de diseño:** el generador decide el pill por la presencia de `swatchHex` (ya viene en el dato);
no recalcula. Mismo patrón que el pill de Anatomy.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Cambio no-color (width, opacity) | Sin `swatchHex` → texto plano. |
| Color que desaparece en la opción | `swatchHex` del default (o ninguno). |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `diffAtributos`: dos color con `swatchHex` distintos → `AtributoCambiado` con el `swatchHex` de la opción; no-color que cambia → sin `swatchHex`; los casos hardcoded sin swatch existentes siguen pasando.
- Actualizar `comparar-variante` y `properties-extraccion`: las expectativas de `atributos` de color incluyen `swatchHex`.

**2. Verificación manual en Figma:** Component Set con variantes donde cambia un color (idealmente vía
variable) → "Properties" → verificar el swatch del color de la opción junto al texto. Comparar contra
`prd-images/2. properties/`. Verificar que el resto sigue andando.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Dos swatches (default + opción) por cambio.
- Pills en Layout.
- Highlight azul de capas (Boolean props).
