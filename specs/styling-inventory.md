# Styling Inventory

## Qué hace
Inventario de los colores, tipografías y variables que usa el elemento (o todo el documento): muestra **cómo se ve** cada token **y dónde se usa**.

## Qué muestra
Tres subsecciones (cada una con título + descripción + observación si aplica): **Variables**, **Color styles**, **Text styles**. Cada entrada es una card:
- **Color** (variables + color styles): **swatch grande** (56×56, sólido o **gradiente** real) + nombre (ChipVar) + hex. Si el paint no es sólido ni gradiente (ej. imagen), no hay swatch y se aclara con una nota.
- **Text styles**: a la izquierda las **propiedades** (Font family, weight, size, line height, letter spacing); a la derecha el **preview** *"The quick brown fox jumps over the lazy dog"* renderizado en el estilo real (carga la fuente, cae a Inter si no está).
- Debajo de cada card (solo en modo elemento): **Applied as** / **Applied to** (dónde se usa).

## Modos
- **Por elemento** (default): solo los estilos/variables que usa la selección (y sus capas, también dentro de instancias). Cada entrada lleva el applied-where.
- **Todos los del documento** (opción *All document styles*): catálogo de **todos** los color styles, text styles y variables de color **locales** del archivo. Sin applied-where. Solo alcanza estilos locales (no de librerías remotas).

## Datos
La recolección captura el color resuelto (sólido o gradiente, con sus stops) y, para text styles, la tipografía completa.

## Archivos clave
- `inventario/recolectar.ts` (por elemento), `inventario/documento.ts` (todo el documento), `inventario/agrupar.ts`
- `generadores/styling.ts` (cards, preview, swatch de gradiente)
- `extraccion/adaptador.ts` (captura de paints/gradiente)
