# Data (JSON)

## Qué hace
Representa el elemento como datos estructurados (JSON) para entender su jerarquía y conectarlo con código.

## Qué muestra
Un bloque de código con el JSON de la anatomía del elemento (cada elemento con `name`, `type`, `attributes` [`key`, `value`, `format`] y `instanceOf` si es instancia), serializado con `JSON.stringify(..., 2)`.

El código va:
- En **font mono**.
- Con **sintaxis coloreada** (vía `setRangeFills`): keys en rosa `#EA10AC`, strings en verde `#1FA855`, números/`true`/`false`/`null` en azul `#0D80FF`, puntuación en gris `#6B7280`.
- Dentro de un **bloque con fondo** gris claro `#F3F4F6`, redondeado, con padding (legible con los colores).

## Archivos clave
- `serializacion/anatomy-json.ts` (modelo → JSON)
- `generadores/data.ts` (tokenizador + render coloreado)
