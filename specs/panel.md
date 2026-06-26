# Panel del plugin

## Qué es
La UI del plugin: un iframe (`src/ui/`) que se comunica con el código del plugin por `postMessage`. **Alto fijo con scroll** en el área de contenido; tabs y footer fijos.

## Estructura
- **Tabs**: Specs / Options / Format / About (la activa con pill gris).
- **Specs**: grid de **cards seleccionables**. Al tildar, la card se pone azul (borde + fondo + texto + check ✓); las no seleccionadas, grises. Son las 8 secciones (Anatomy, Properties, Layout & Spacing, Styling Inventory, Two Way, Data, Modes, Complete).
- **Options**: agrupado por sección (General, Anatomy, Layout & Spacing, Properties, Styling Inventory). Cada fila: label + control (checkbox/dropdown) + descripción. Ver [opciones y formatos](options-and-formats.md).
- **Format**: filas con dropdowns (Columns, Color, Units, Type, Raw values + Show raw value, Preferred).
- **About**: descripción, cómo usarlo, open source, feedback, y link de donación (`buymeacoffee.com/bochenn`) que abre el navegador vía `figma.openExternal`.
- **Footer**: Cancel (cierra el plugin) + Create Spec (deshabilitado si no hay ninguna spec seleccionada).

## Mensajes (UI → plugin)
- `generar` — con las secciones elegidas + todas las opciones/formatos.
- `cancelar` — `figma.closePlugin()`.
- `abrir` `{ url }` — `figma.openExternal(url)`.

## Detalles
- **Mode** (Light/Dark) es un dropdown que mapea al booleano `dark`.
- Las opciones que aparecen en dos secciones (**Itemize instances** en Anatomy/Layout, **Spec nested subcomponents** en Anatomy/Properties) son el mismo valor, **sincronizadas** entre sus dos checkboxes.
- El header con el nombre y la X es la **ventana propia de Figma** (toma el nombre del manifest), no está en el HTML.
- Tamaño actual: 640×500.

## Archivos clave
- `src/ui/index.html` (estructura + estilos), `src/ui/ui.ts` (tabs, selección, sync, mensajes)
- `src/plugin/main.ts` (`figma.showUI`, handler de mensajes)
- `modelo/tipos.ts` (`MensajeUI`)
