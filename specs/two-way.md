# Two-Way

## Qué hace
Cruza las **dos primeras propiedades de variante** (producto cartesiano) y, por cada combinación, muestra el artwork del variante + **qué cambia respecto del variante default**. Útil para *compound props* (cuando dos ejes hay que verlos juntos).

## Qué muestra
Header `Prop1 × Prop2`. Por cada combinación existente, una card con:
- Artwork (instancia del variante de esa combinación).
- **Lista de cambios** vs el default:
  - **Raíz del variante**: nombre del componente + sus props en vertical (`Type: …`, etc.) y sus cambios de atributo.
  - Por cada elemento **modificado**: el cambio en dos pills — `itemValue-current` (clave + valor de la combinación) e `itemValue-default` (default + su valor). ChipVar solo si el valor es token; `width`/`height` con el ícono Hug/Fixed/Fill.
  - Elementos **added/removed**: una nota ("Added/Removed in this variant"); los repetidos del mismo nombre se consolidan (`Vector · Added ×2`).

## Opciones que la afectan
- **Columns**.

## Archivos clave
- `extraccion/properties.ts` (`extraerDosWay`)
- `comparacion/variantes.ts` (`compararVariante`, `diffAtributos`, `emparejar`)
- `generadores/properties.ts` (`seccionDeDosWay`, `listaCambios`, `filaAtributoCambiado`)
