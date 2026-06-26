# Opciones y formatos

Qué hace cada ajuste del panel y a qué secciones aplica. (Detalle de la UI en [panel](panel.md).)

## Específicas de una sección
| Opción | Aplica a |
|---|---|
| **Tabular anatomy** | Anatomy |
| **Anatomy depth** (children/self/all) | Anatomy |
| **Hide outer layout** | Layout & Spacing |
| **Element measures** | Layout & Spacing |
| **Include legend** | Layout & Spacing (la tabla de leyenda, una vez arriba) |
| **Spec nested subcomponents** | Anatomy + Properties |
| **Itemize instances** | Anatomy + Layout & Spacing |
| **All document styles** | Styling Inventory |
| **Columns** | Properties, Layout, Modes, Two-Way, Complete |

## Globales (afectan a toda sección donde aplique)
Son ajustes de **formato**; se setean una vez (estado de módulo) antes de generar.
| Opción | Efecto |
|---|---|
| **Mode** (Light/Dark → `dark`) | Tema oscuro de todo el output |
| **Color** (HEX/RGB/HSL) | Formato de colores hardcoded |
| **Units** (px/rem) | Unidad de todas las medidas |
| **Type** (Plain/CSS) | Formato de tipografía |
| **Raw value** (HEX/RGB/HSL) | Formato del valor resuelto de un token |
| **Show raw value** | Mostrar/ocultar ese valor resuelto |
| **Preferred** (Variable/Style) | Cuál mostrar cuando hay variable **y** style |

## Archivos clave
- `main.ts` (lee el mensaje, arma `opts`, aplica los formatos globales)
- `utils/color.ts`, `utils/espaciado.ts`, `utils/tipografia.ts`, `utils/valores.ts` (estado de los formatos)
