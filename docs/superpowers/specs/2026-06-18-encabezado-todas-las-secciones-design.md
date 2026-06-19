# Encabezado "Title & Heading" en todas las secciones — Diseño

**Fecha:** 2026-06-18
**Referencias:** `Specifications-instrucciones 2.pdf` (anatomía del "Title & Heading"), `Specifications-redesign 2.pdf` (mockup de página), `Image #1` (objetivo del usuario).

## Objetivo

Que cada sección que genera el plugin arranque con un encabezado de documento
("Title & Heading"): barra con el nombre del plugin + el nombre de la sección, más el
título del elemento y una descripción placeholder. Hoy esto no existe en el plugin real.

## Contexto y hallazgo

`src/plugin/main.ts` (`figma.ui.onmessage`) es el path real: arma UN frame
`Specifications` (padding 64) → UN `<nombre> Spec` (gap 48) → opcional leyenda →
`texto(nodo.name, 64)` (título único) → y en el loop de `ORDEN` apila las secciones
elegidas llamando a `seccionDeAnatomy`, `seccionDeLayout`, etc.

La iteración anterior agregó el header dentro de `generarAnatomy` / `headerPagina` /
`tituloYDescripcion` en `anatomy.ts`, pero `main.ts` NO llama a esas funciones. El
bundler las descartó por tree-shaking: `dist/code.js` no contiene
"BLUEPRINT SPECS & HANDOFF". Es decir, ese header nunca llegó al plugin. Hay que
construirlo bien y cablearlo en `main.ts`.

## Decisión de granularidad (confirmada)

**Un header por sección.** Cuando se generan varias secciones (ej. Anatomy + Layout),
cada una arranca con su propio "Title & Heading" (la barra muestra el nombre de ESA
sección y se repite el título del elemento). No hay un único header global.

## Componente nuevo: `tituloYEncabezado`

**Archivo nuevo:** `src/plugin/generadores/encabezado.ts`

```
tituloYEncabezado(nombreElemento: string, etiquetaSeccion: string): Promise<FrameNode>
```

Devuelve el frame "Title & Heading":

```
Title & Heading (vertical, gap 64)            ← se estira a FILL al appendearlo
├─ _Status (horizontal, FILL, borde inferior 1px #D1D5DB, paddingBottom ~12)
│  ├─ texto plugin:  "BLUEPRINT SPECS & HANDOFF"  (izquierda)
│  └─ texto sección: etiquetaSeccion en MAYÚSCULAS (derecha, SPACE_BETWEEN)
│     ambos: FONT_BARRA 13px, color #374151
└─ _Doc/Heading (vertical, FILL, paddingLeft/Right 64, gap 24)
   ├─ Título: nombreElemento — FONT_TITULO 36px, color de tema `texto`
   └─ Descripción: DESCRIPCION_PLACEHOLDER — 16px, color #6B7280
```

Notas de layout:
- `Title & Heading` y `_Status` y `_Doc/Heading` van en FILL horizontal (se setea
  `layoutSizingHorizontal = "FILL"` después de cada `appendChild`, igual que el patrón de
  `tarjeta` en `frames.ts`).
- La barra `_Status` no tiene padding lateral, así su divisor abarca el ancho completo del
  contenido. `_Doc/Heading` tiene padding lateral 64, así el título queda indentado +64
  respecto del divisor (igual que el mockup).
- `_Status` usa `primaryAxisAlignItems = "SPACE_BETWEEN"` para separar plugin (izq) y
  sección (der).

### Fuentes (con fallback a Inter)

Las instrucciones piden SF Pro (fuentes de sistema macOS). Se cargan con la cadena de
fallback que ya soporta `cargarFont` (FontName[]), cayendo a Inter si no están:

```ts
const FONT_BARRA: FontName[] = [{ family: "SF Pro Text", style: "Medium" }, { family: "Inter", style: "Semi Bold" }];
const FONT_TITULO: FontName[] = [{ family: "SF Pro Display", style: "Regular" }, { family: "Inter", style: "Bold" }];
```

(`FONT_REG`, `FONT_SEMI`, `FONT_BOLD` ya existen en `frames.ts`.)

### Constantes

```ts
const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB
```

## Cambios en `main.ts`

1. Eliminar el título global `spec.appendChild(await texto(nodo.name, 64));` (línea 214).
2. Definir el mapa sección → etiqueta:

```ts
const ETIQUETA_SECCION: Record<Seccion, string> = {
  anatomy: "ANATOMY",
  properties: "PROPERTIES",
  layout: "LAYOUT AND SPACING",
  data: "DATA",
  styling: "STYLING INVENTORY",
  modes: "MODES",
  twoway: "TWO-WAY",
  complete: "COMPLETE",
};
```

3. En el loop de `ORDEN`, por cada sección incluida: appendear primero el header y
   estirarlo a FILL, después los frames de la sección:

```ts
for (const seccion of ORDEN) {
  if (!msg.secciones.includes(seccion)) continue;
  const header = await tituloYEncabezado(nodo.name, ETIQUETA_SECCION[seccion]);
  spec.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  for (const f of await seccionPara(nodo, seccion, opts)) spec.appendChild(f);
}
```

(La leyenda opcional `seccionLeyenda` se mantiene como está, antes del loop.)

## Limpieza del dead-code previo (en `anatomy.ts`)

Revertir lo agregado en la iteración anterior que quedó muerto:
- Borrar las funciones `headerPagina` y `tituloYDescripcion`.
- En `generarAnatomy` y `generarAnatomyConNested`: quitar las 3 líneas del header
  (`const header = await headerPagina("Anatomy"); ...appendChild; ...FILL`), volviendo a su
  forma original.
- En `specDeAnatomy`: volver a `spec.appendChild(await texto(seleccionado.name, 64));` y
  gap 48 (estado original).
- Quitar las constantes que quedan sin uso en `anatomy.ts` (`NOMBRE_PLUGIN`,
  `GRIS_OSCURO`, `BORDE_HEADER`, `DESCRIPCION_PLACEHOLDER`, `GRIS_DESC`) y el import de
  `FONT_SEMI` si queda sin uso.

**Conservar** lo que sí usa el plugin: en `seccionDeAnatomy`, el chip `tagSeccion("Anatomy")`
y el gap 24. Mantener la función `tagSeccion`.

## Alcance / no incluye

- No se cambian los headings internos de cada sección (ej. el texto "Layout and Spacing"
  que ya tenga Layout). Solo se agrega el header arriba de cada sección.
- No se borran `generarAnatomy` / `generarAnatomyConNested` / `specDeAnatomy` (dead code
  preexistente): solo se revierten las adiciones de la iteración anterior.
- No se tocan otras secciones más allá del cableado en `main.ts`.

## Testing

- Todo es impuro (toca `figma.*`) → sin tests unitarios nuevos, se verifica por PDF.
- `ETIQUETA_SECCION` es un `const` trivial; no requiere test.
- Verificación de cada tarea: `npm run build && npm test` sin errores ni regresiones.
- Verificación final manual: generar Anatomy + Layout juntas, exportar PDF y confirmar que
  cada sección arranca con su barra (plugin / sección), título y descripción, y que el chip
  `[ANATOMY]` sigue apareciendo bajo el header de Anatomy.
