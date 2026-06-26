# Complete

## Qué hace
Vista todo-en-uno del componente: combina la anatomía y el layout de **todas** las variantes. Sirve como referencia única.

## Qué muestra
Dos partes:
- **Complete Anatomy**: por cada variante, lista los elementos que aparecen en **esa** variante pero **no** en la default (ej. un frame `Categories`, instancias `Badge`…). Si no hay extras, lo aclara.
- **Complete Layout**: lo mismo para diferencias de layout (capas con Auto Layout que agregan otras variantes). Si no hay, lo aclara.

## Opciones que la afectan
- **Columns**.

## Pendiente
El header de cada card todavía usa el string `Type=…, Orientation=…` (formato viejo) y no consolida los repetidos — a diferencia de Properties/Two-Way. Queda para unificar.

## Archivos clave
- `extraccion/properties.ts` (`extraerCompleteAnatomy`, `extraerCompleteLayout`)
- `generadores/complete.ts`
