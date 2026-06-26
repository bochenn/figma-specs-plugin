# Layout & Spacing

## Qué hace
Muestra cómo está organizado el contenido: dirección, alineación, padding, item spacing (gap), grids y dimensiones de cada frame con Auto Layout, con cotas sobre el diseño.

## Qué muestra
Por cada capa con Auto Layout, una fila (`layoutItem01`, `layoutItem02`…) con:
- **Breadcrumb** de la jerarquía (a la izquierda).
- **Artwork** con cotas/overlays: líneas de medida (rojo), padding, item spacing; chips con la variable + valor cuando el spacing/dimensión está atado a una variable; íconos de dirección, alineación y resizing.
- **Exhibit** (card a la derecha): Width/Height (con ícono Hug/Fixed/Fill), Direction, Alignment, Padding, Item spacing, Corner radius, Grid.

La sección **es** el frame-item (`Layout&Spacing`), con su padding y fondo; las filas van directo adentro (sin doble envoltura).

## Legend (opcional, "Include legend")
Tabla **Element | Detail** (ancho fijo 656px) que explica las convenciones del artwork: cotas, padding, gap, líneas de medida, chips de variable, jerarquía. Textos en Inter Medium 12 / lh 150% / text-secondary.

## Opciones que la afectan
- **Hide outer layout** — omite la fila del frame más externo.
- **Element measures** — agrega cotas también a los elementos hijos.
- **Itemize instances** — entra a las instancias para medir sus capas.
- **Include legend** — agrega la tabla de leyenda (una vez, arriba).
- **Columns**, Units.

## Archivos clave
- `extraccion/layout.ts`, `traversal/recorrer-autolayout.ts`
- `generadores/layout.ts` (`seccionDeLayout`, artwork/cotas, `seccionLeyenda`)
- `utils/marcadores-layout.ts`, `utils/overlays.ts`, `utils/grilla.ts`
