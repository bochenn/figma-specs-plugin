# Diseño — Variable Formatting (motor en Anatomy) — Rebanada 7

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Feature **Variable Formatting** del PRD, limitada a: cadena de prioridad **variable > style > hardcoded** para atributos de **color** (fill + stroke), mostrados como **pills con swatch**, en **Anatomy**. Sin Token Studio (es la feature #9, aparte). Properties/Layout y otros tipos de variable quedan para rebanadas posteriores.

---

## Contexto y estrategia

Variable Formatting (feature #11 del PRD) hace que los atributos mapeados a variables de Figma se
muestren como un **pill** con collection + nombre de variable + raw value, y para colores un **swatch**.
Define una prioridad: variable > style > token > hardcoded.

Variable Formatting **no es una sección con botón**: enriquece cómo se muestran los atributos de color.
Esta rebanada implementa el **motor completo de prioridad** (variable > style > hardcoded, **sin Token
Studio**) para colores (fill + stroke), con pills + swatch, **en Anatomy**.

**Decisiones tomadas en el brainstorming:**
- Alcance: motor de prioridad variable > style > hardcoded; colores (fill + stroke); pills + swatch; en Anatomy.
- Token Studio excluido (feature #9 aparte).
- El hex del swatch sale del color resuelto de Figma (`fills[0].color` / `strokes[0].color`), que existe aunque haya variable/style.
- La *detección* (qué es variable/style) vive en el adaptador (impure); la *prioridad/formato* en `colorAtributo` (pura, testeada).
- Como `leerAtributos` es compartido, Properties también empieza a comparar por nombre de variable/style (sin pill visual; eso queda para después).

---

## Sección 1 — Modelo y motor de prioridad

**`Atributo` enriquecido** (`modelo/tipos.ts`):

```typescript
export interface Atributo {
  clave: string;
  valor: string;        // hex, o "Colección/Variable", o nombre del style
  formato: "HARDCODED" | "VARIABLE" | "STYLE";
  rawValue?: string;    // hex resuelto (para variable/style)
  swatchHex?: string;   // color del swatch (presente en atributos de color)
}
```

**`colorAtributo(clave, opts)`** (pura, en `utils/atributos.ts`) — cadena variable > style > hardcoded:

```
colorAtributo(clave, { hex?, variableName?, styleName? }):
  si !hex → undefined
  si variableName → { clave, valor: variableName, formato: "VARIABLE", rawValue: hex, swatchHex: hex }
  si styleName    → { clave, valor: styleName,    formato: "STYLE",    rawValue: hex, swatchHex: hex }
  si no           → { clave, valor: hex,          formato: "HARDCODED", swatchHex: hex }
```

**`leerAtributos` reescrito**: usa `colorAtributo` para `background-color` (fill) y `border-color`
(stroke, nuevo), más width/opacity como antes. El hex sale del primer paint SOLID de fills/strokes.

> Cambia el output de Anatomy: `background-color` puede ser variable/style; se suma `border-color`.
> Como `leerAtributos` es compartido, Properties compara por nombre de variable/style (mejora gratis).

---

## Sección 2 — Captura en el adaptador

**Nuevos campos en `NodoLike`:**

```typescript
strokes?: ReadonlyArray<{ type: string; color?: { r: number; g: number; b: number } }>;
fillVariableName?: string;     // "Colección/Variable"
strokeVariableName?: string;
```

**Lo que hace el adaptador (impure, ya resuelve styles), por nodo:**
1. Captura `strokes` igual que `fills` (para el hex de border-color hardcoded).
2. Variable del fill: si `boundVariables.fills[0]` → `getVariableById` → `getVariableCollectionById` →
   `fillVariableName = "${collection.name}/${variable.name}"`.
3. Variable del stroke: idem con `boundVariables.strokes[0]` → `strokeVariableName`.

Reutiliza la lectura de `boundVariables` (helper compartido para no duplicar la de Modes). El hex
resuelto sale de `fills[0].color`/`strokes[0].color`.

**Decisión de diseño:** detección en el adaptador (figma); prioridad/formato en `colorAtributo` (pura).

---

## Sección 3 — Render del pill en Anatomy

En `generadores/anatomy.ts`, los atributos con `swatchHex` se dibujan como **pill** (swatch + texto):

```
[■] background-color: ESDS Color/Action/Initial (#0E68D4)
```

`filaAtributo(attr)`:
- Si `attr.swatchHex` (color): frame **horizontal** con:
  - rect 12×12 relleno con `swatchHex` + borde gris finito (para verse contra fondos iguales).
  - `texto` con `${clave}: ${valor}` + (si hay `rawValue`) ` (${rawValue})`.
- Si no (width, opacity): `texto("${clave}: ${valor}")` como antes.

**Decisión de diseño:** el generador solo decide cómo dibujar según `swatchHex`/`rawValue`; no recalcula.

> El pill es solo en Anatomy en esta rebanada.

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Fill/stroke no SOLID | No emite ese atributo de color. |
| Variable que no resuelve | El adaptador no setea el nombre → degrada a style/hardcoded. |
| Style + variable | Gana la variable (prioridad). |
| Sin fill/stroke sólido | Sin atributos de color. |

Sin manejo de errores nuevo en `main.ts` (vive dentro de Anatomy, ya con `try/catch`).

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `colorAtributo`: solo hex → HARDCODED con swatchHex sin rawValue; hex+variableName → VARIABLE (valor=variableName, rawValue=hex); hex+styleName → STYLE; hex+variable+style → gana VARIABLE; sin hex → undefined.
- `leerAtributos` (actualizar existentes + nuevos): fill hardcoded → background-color HARDCODED+swatchHex; fill con `fillVariableName` → VARIABLE; stroke sólido → border-color (nuevo); width/opacity sin swatch.

**2. Verificación manual en Figma:** frame con fill hardcoded, fill con variable, fill con color style,
y stroke con variable → Anatomy → verificar pills (swatch + nombre + raw value) y la prioridad. Comparar
contra `prd-images/9. Variable formatting/`. Verificar que las otras secciones siguen andando.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de `figma.variables`/`getStyleById`.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Token Studio tokens (feature #9): cadena variable > style > **token** > hardcoded.
- Pills en Properties y Layout.
- Variables/atributos no-color (FLOAT en spacing, etc.).
- Distinción "Text color" vs "Background color" en fills de TEXT (hoy todo fill → "background-color").
- Custom Value Formats (hex vs HSLA, toggle de raw value).
