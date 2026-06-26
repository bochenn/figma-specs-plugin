# Specs

Una página por cada feature del plugin: **qué hace, qué muestra, su estructura de output, las opciones que la afectan y los archivos clave** del código.

Estos specs son la documentación viva del plugin. **Cuando una feature cambia, se actualiza su spec en el mismo cambio**; cuando se suma una feature, se agrega su página acá.

## Secciones del spec generado

- [Anatomy](anatomy.md)
- [Properties](properties.md)
- [Layout & Spacing](layout-and-spacing.md)
- [Styling Inventory](styling-inventory.md)
- [Modes](modes.md)
- [Two-Way](two-way.md)
- [Data (JSON)](data.md)
- [Complete](complete.md)

## Transversal

- [Panel del plugin](panel.md) — la UI: tabs Specs / Options / Format / About.
- [Opciones y formatos](options-and-formats.md) — ajustes que aplican a varias secciones.

## Arquitectura (resumen)

El plugin separa **extracción** (nodos de Figma → datos planos, lógica pura testeable contra `NodoLike`) de **generación** (datos → frames con Auto Layout, toca `figma.*`). `main.ts` orquesta: valida la selección, arma una página por sección y posiciona el output. El panel (`src/ui/`) corre en un iframe y se comunica por `postMessage`.
