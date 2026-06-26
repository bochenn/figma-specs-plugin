# Properties

## Qué hace
Documenta las propiedades de variante de un component set: por cada valor de cada propiedad muestra el preview del variante + su tabla de propiedades completa (estilo panel de instancia de Figma).

## Qué muestra
- **Título** = nombre del componente (clave para distinguir el principal de los subcomponentes anidados).
- **Card del default** arriba: artwork (instancia del variante default) + tabla de props.
- **Una subsección por cada propiedad de variante** (Type, Orientation, Breakpoint, Size…):
  - Una **card por cada valor** de la propiedad, con: header = el valor, **artwork** (instancia del variante con ese valor, con artwork mínimo 400×156 y padding ≥64) y la **tabla de propiedades completa** del variante: fila `Label  ◆ Valor` (label gris, marcador ◆ rombo, valor).
  - Si no existe el variante "default con solo esa prop cambiada" (matriz dispersa), se usa **cualquier** variante con ese valor.
- **Propiedades booleanas**: subsección con el artwork (instancia del default) y los layers afectados resaltados en azul.

## Notas
- El artwork usa **`createInstance()`** del variante (instancia), no `clone()` (que duplicaría el componente master).
- No muestra el diff de cambios; eso es solo de **Two-Way**, que comparte el código de comparación.

## Opciones que la afectan
- **Spec nested subcomponents** — agrega una sección Properties por cada component set anidado (detectado en **todas** las variantes, no solo la default).
- **Columns** — cards por fila.

## Archivos clave
- `generadores/properties.ts` (`seccionDeProperties`, `cardVariante`, boolean)
- `extraccion/properties.ts` (extracción, fallback de valor)
- `main.ts` (`setsAnidados` recorre todas las variantes)
