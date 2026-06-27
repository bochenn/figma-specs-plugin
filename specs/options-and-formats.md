# Options and formats

What each panel setting does and which sections it applies to. (UI details in [panel](panel.md).)

## Section-specific
| Option | Applies to |
|---|---|
| **Tabular anatomy** | Anatomy |
| **Anatomy depth** (children/self/all) | Anatomy |
| **Hide outer layout** | Layout & Spacing |
| **Element measures** | Layout & Spacing |
| **Include legend** | Layout & Spacing (the legend table, once at the top) |
| **Spec nested subcomponents** | Anatomy + Properties |
| **Itemize instances** | Anatomy + Layout & Spacing |
| **All document styles** | Styling Inventory |
| **Columns** | Properties, Layout, Modes, Two-Way, Complete |

## Global (affect every section where they apply)
These are **formatting** settings; they're set once (module state) before generating.
| Option | Effect |
|---|---|
| **Mode** (Light/Dark → `dark`) | Dark theme for the whole output |
| **Color** (HEX/RGB/HSL) | Format of hardcoded colors |
| **Units** (px/rem) | Unit of all measures |
| **Type** (Plain/CSS) | Typography format |
| **Raw value** (HEX/RGB/HSL) | Format of a token's resolved value |
| **Show raw value** | Show/hide that resolved value |
| **Preferred** (Variable/Style) | Which to show when there's both a variable **and** a style |

## Key files
- `main.ts` (reads the message, builds `opts`, applies the global formats)
- `utils/color.ts`, `utils/espaciado.ts`, `utils/tipografia.ts`, `utils/valores.ts` (formatting state)
