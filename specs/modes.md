# Modes

## Qué hace
Muestra el valor de cada variable de color a través de sus modes (ej. Light/Dark), para ver cómo cambia el elemento entre temas.

## Qué muestra
Por cada **variable collection con ≥2 modes** usada por el elemento: el nombre de la variable, su `appliedAs` (Background/Text/Border color) y la **comparación de valores por mode** (hex por cada mode, o alias `→ otra/variable`).

## Recolección
Recorre el elemento y sus capas — **también dentro de las instancias** — y junta las variables de color atadas a fill/stroke cuya colección tiene 2+ modes. Las variables en colecciones de un solo mode no aparecen (no hay nada multi-mode que mostrar).

## Opciones que la afectan
- **Columns**.

## Archivos clave
- `variables/recolectar-modes.ts` (recolección, entra a instancias)
- `variables/modes.ts` (agrupado, `hexDeColor`)
- `generadores/modes.ts`
