# Diseño — Exhibit de Layout enriquecido (DesignDoc 1/3) — Rebanada A

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Primera de tres rebanadas del rediseño estilo DesignDoc. Enriquecer el bloque de texto (exhibit) de cada contenedor en Layout and Spacing: Width/Height con resizing y valor/variable, Fill/Stroke (color/variable/style), Corner radius. No toca el recorrido (rebanada B) ni los overlays/marcadores (rebanada C).

---

## Contexto

DesignDoc, en su vista de spacing, da un panel de propiedades por nodo:

```
card
Width   Fixed card-width
Height  Hug 88px
Fill    variable surface
Stroke  variable border
Direction Vertical
Align Children Top Left
Padding padding-1x
Gap     gap-0_5x
```

Nuestro exhibit actual (`exhibit` en `generadores/layout.ts`) muestra: nombre·tipo, Direction,
Alignment, `Resizing: H × V`, Padding, Item spacing, Grid. Le faltan dimensiones con valor,
fill/stroke y corner radius.

---

## Sección 1 — Modelo (`modelo/tipos.ts`)

`NodoLike` += `cornerRadius?: number;` (el resto ya existe: width, height, widthVariableName,
heightVariableName, fills, strokes, fillVariableName, strokeVariableName, fillStyleName,
strokeStyleName).

`LayoutSpec` += :
```typescript
  width: number;
  height: number;
  widthVar?: string;     // variable atada al ancho
  heightVar?: string;    // variable atada al alto
  cornerRadius?: number; // radio de esquina (ausente o 0 = no se muestra)
  fill?: Atributo;       // relleno resuelto (reusa colorAtributo)
  stroke?: Atributo;     // borde resuelto
```

`Atributo` ya existe (clave/valor/formato/rawValue/swatchHex).

## Sección 2 — Formato puro (`utils/marcadores-layout.ts`)

```typescript
// "<resizing> <dim>" con la dimensión formateada (variable + valor si la hay):
// "Fixed sizing/card-width (240)", "Hug 88", "Fill 240".
export function textoDimension(resizing: string, px: number, unidad: Unidad, nombreVar?: string): string {
  return `${resizing} ${etiquetaSpacing(px, unidad, nombreVar)}`;
}
```

## Sección 3 — Extracción (`extraccion/layout.ts`)

`layoutSpecDe` puebla los campos nuevos:
- `width: nodo.width ?? 0`, `height: nodo.height ?? 0`.
- `widthVar: nodo.widthVariableName`, `heightVar: nodo.heightVariableName`.
- `cornerRadius: nodo.cornerRadius` (si > 0).
- `fill`/`stroke`: vía `colorAtributo` (reusa la lógica de variable/style/preferencia/raw ya testeada),
  con `hex` del primer paint SOLID, `variableName` y `styleName`. `colorAtributo` devuelve `undefined`
  si no hay color → el campo queda ausente.

El adaptador (`extraccion/adaptador.ts`) ya copia casi todo; se le suma `cornerRadius` cuando es
`number` (no `figma.mixed`).

## Sección 4 — Generador (`generadores/layout.ts`, función `exhibit`)

Nuevo orden de líneas (reemplaza la línea `Resizing`):
```
<nombre> · <tipo>
Width: <textoDimension(resizingHorizontal, width, unidad, widthVar)>
Height: <textoDimension(resizingVertical, height, unidad, heightVar)>
Fill: <fill>        (solo si spec.fill)
Stroke: <stroke>    (solo si spec.stroke)
Direction: <…>(, wrapping)
Alignment: <primaria> / <contraria>
Padding: <textoPadding>
Item spacing: <etiqueta>
Corner radius: <etiquetaSpacing(cornerRadius, unidad)>   (solo si cornerRadius > 0)
Grid: <…>           (las que haya)
```

Fill/Stroke se renderizan con un helper local `lineaColor(attr)` que arma
`attr.rawValue ? `${attr.valor} (${attr.rawValue})` : attr.valor` (consistente con Anatomy lista).

## Sección 5 — Testing y verificación

Tests (`node --test`):
- `textoDimension` (Fixed con variable, Hug sin variable, Fill, unidad rem) en `tests/marcadores-layout.test.ts`.
- Extracción: `layoutSpecDe` puebla width/height/widthVar/heightVar/cornerRadius/fill/stroke en
  `tests/layout-extraccion.test.ts` (actualizar el `deepEqual` del primer test con los campos nuevos).

Verificación manual: frame con Auto Layout (width fijo atado a variable, height hug, fill+stroke con
variable, corner radius) → Layout & Spacing → exhibit con Width/Height/Fill/Stroke/Corner radius
estilo DesignDoc; combinar con Units = rem.

## Fuera de alcance (rebanadas siguientes)

- Recorrer dentro de instancias (B).
- Marcadores de medidas sobre el artwork (C).
- Width/Height en Complete Layout (se mantiene su línea resumida actual).
