# Nueva estructura de Specifications — Diseño

**Fecha:** 2026-06-23
**Referencias:** `the new Specifications.pdf` (demo), `Specifications de la nueva estructura.pdf` (specs exactas de cada frame).

## Objetivo

Rediseñar el output de Specifications: en vez de **un** frame `Specifications` con todas las
secciones apiladas, generar **un frame `Specifications` por cada sección incluida** (Anatomy,
Layout, Properties, …), cada uno con su propia cáscara (Header / Hero / Feature / anatomyItem /
Footer), nombres nuevos y tipografías nuevas. Todos los frames de sección van apilados dentro de
un contenedor `Specs`.

## Estructura por sección

Cada sección incluida produce un frame con esta forma:

```
Specifications  (vertical · hug · gap 0 · padding 0 · radius 40 · ancho 1980 por sus hijos)
├─ Header   (fixed 1980 · hug ~84 · fill fondo-spec · borde #E1E1E1 · horizontal · center/center
│            · padding 32/100/32/100 · gap 32)
│     "BLUEPRINT SPECS & HANDOFF"  [Inter Medium 16]   ····(FILL)····   "ANATOMY"  [Inter Medium 16]
├─ Hero     (fixed 1980 · fill fondo-spec · borde #E1E1E1 · vertical · padding 100 · gap 56)
│  └─ heroHeader  (FILL · vertical · gap 24)
│     ├─ Title  (vertical · gap 12)
│     │   ├─ Badge  (hug · fill fondo-spec · borde #E1E1E1 · horizontal · center/center
│     │   │          · padding 6/12/6/12 · radius 8): "specifications"  [Inter Medium 14]
│     │   └─ "Anatomy"  [Inter Medium 56]
│     └─ descripción de la sección  [Inter Regular 18, gris #6B7280]
├─ Feature  (fixed 1980 · fill fondo-spec · borde #E1E1E1 · vertical · padding 72/100/0/100 · gap 56)
│  └─ Title  (vertical · gap 8)
│     ├─ "Blog post card" (= nombre del elemento)  [Inter Medium 32]
│     └─ descripción del elemento (placeholder fijo)  [Inter Regular 16, gris #6B7280]
├─ anatomyItem  (FILL · fill fondo-spec · vertical · padding 72/100/72/100 · gap 48)   [1 o varios]
│  └─ <contenido de la sección>  (el Display actual: artwork + cards)
└─ Footer   (fixed 1980 · hug ~108 · fill fondo-spec · borde #E1E1E1 · horizontal · center/center
             · padding 32/100/32/100 · gap 32)
      "BLUEPRINT SPECS & HANDOFF"  [Inter Medium 16]
```

**Contenedor raíz** `Specs` (vertical · gap 80 · sin fill) apila los frames `Specifications` de
todas las secciones, uno debajo del otro. Es el frame que se posiciona en el canvas y al que se le
aplica el modo Dark.

### Decisiones confirmadas

- **Un solo Feature** (nombre del elemento principal = `nodo.name`) + **uno o varios `anatomyItem`**:
  cada frame que devuelve el generador de la sección se envuelve en su propio `anatomyItem`.
- **Footer**: solo "BLUEPRINT SPECS & HANDOFF" centrado.
- **Alcance**: todas las secciones del `ORDEN`.
- **Hero**: descripción propia por sección. **Feature**: descripción placeholder fija para todas.
- **Distribución**: frames apilados en vertical dentro de `Specs`.

## Colores y fuentes

- **Fills** de Header/Hero/Feature/Footer/anatomyItem → `fillTematizado(varsTema().fondoSpec)`
  (blanco en Light, oscuro en Dark; así el modo Dark sigue funcionando). El contenedor `Specs`
  no lleva fill.
- **Strokes** de Header/Hero/Feature/Footer/Badge → SOLID `#E1E1E1` (igual que los bordes
  existentes, que son SOLID). Weight 1.
- **Radius**: `Specifications` 40, `Badge` 8.
- **Tipografías** (todas con fallback vía `cargarFont`):
  - Header / Footer: Inter Medium 16.
  - Badge: Inter Medium 14.
  - Hero título de sección: Inter Medium 56.
  - Hero descripción: Inter Regular 18, gris `#6B7280`.
  - Feature nombre del elemento: Inter Medium 32.
  - Feature descripción: Inter Regular 16, gris `#6B7280` (placeholder).

## Módulos

### Nuevo: `src/plugin/generadores/pagina.ts`

Constructores de la cáscara. Cada uno crea su frame y deja que el caller lo fije a 1980/FILL.

- `header(etiquetaSeccion: string): Promise<FrameNode>` — barra horizontal con el nombre del
  plugin (FILL a la izquierda) y la etiqueta de sección (a la derecha). Borde inferior NO; borde
  completo #E1E1E1 (la barra ahora es una caja con borde, no solo divisor).
- `hero(titulo: string, descripcion: string): Promise<FrameNode>` — Hero → heroHeader → Title
  (Badge + título 56) + descripción 18.
- `feature(nombreElemento: string, descripcion: string): Promise<FrameNode>` — Feature → Title
  (nombre 32 + descripción 16).
- `footer(): Promise<FrameNode>` — barra con "BLUEPRINT SPECS & HANDOFF" centrado.
- `envolverItem(contenido: FrameNode): FrameNode` — crea `anatomyItem` (vertical, padding
  72/100/72/100, gap 48, fill fondo-spec), appendea `contenido` y lo deja FILL.
- `badgeSpecifications(): Promise<FrameNode>` — el Badge "specifications" (reusa el patrón de
  `tagSeccion` pero con texto fijo "specifications", radius 8, borde #E1E1E1, Inter Medium 14,
  padding 6/12, sin uppercase ni letterSpacing).

Constantes locales: `NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF"`, `BORDE_SHELL = #E1E1E1`,
`GRIS_DESC = #6B7280`, `DESCRIPCION_ELEMENTO` (placeholder), `ANCHO_PAGINA = 1980`.

### Reemplazo: `src/plugin/generadores/encabezado.ts`

La barra de página vieja (`tituloYEncabezado`, `barraStatus`, `docHeading`) queda obsoleta: ya
no se importa en `main.ts`. Se borra el archivo (el tree-shaking lo sacaría igual, pero borrarlo
evita dead code). **Borrado de archivo = pedir confirmación**: se confirma en el plan/ejecución.

### Modificación: `src/plugin/generadores/anatomy.ts` y `layout.ts`

Quitar de `seccionDeAnatomy` y `seccionDeLayout` las dos líneas que appendean
`tagSeccion(...)` + `parrafoSeccion(...)`: ese contenido ahora vive en el Hero. El generador
pasa a devolver solo el contenido (Display + lo que siga). Quitar los imports de `tagSeccion` y
`parrafoSeccion` si quedan sin uso.

### Modificación: `src/plugin/generadores/frames.ts`

Renombrar el frame de `filaPill` de `"Fila"` a `"itemValue"` (nombre nuevo del PDF). Sin otros
cambios de comportamiento.

### Modificación: `src/plugin/main.ts`

- Agregar mapas:
  - `TITULO_SECCION: Record<Seccion, string>` — el título grande del Hero ("Anatomy",
    "Layout & Spacing", "Properties", "Data", "Styling Inventory", "Modes", "Two-Way",
    "Complete").
  - `DESCRIPCION_SECCION: Record<Seccion, string>` — el párrafo del Hero. Anatomy y Layout reusan
    los textos que ya existían en sus generadores; las demás reciben una descripción breve nueva.
- Reescribir el cuerpo del `try`:
  ```
  const specs = frameVertical("Specs", 80, 0);   // contenedor, sin fill
  let primeraSeccion = true;
  for (const seccion of ORDEN) {
    if (!msg.secciones.includes(seccion)) continue;
    const pagina = frameVertical("Specifications", 0, 0);
    pagina.cornerRadius = 40;

    const head = await header(ETIQUETA_SECCION[seccion]);
    pagina.appendChild(head); head.layoutSizingHorizontal = "FIXED"; head.resize(1980, head.height);

    const her = await hero(TITULO_SECCION[seccion], DESCRIPCION_SECCION[seccion]);
    pagina.appendChild(her); her.layoutSizingHorizontal = "FIXED"; her.resize(1980, her.height);

    const feat = await feature(nodo.name, DESCRIPCION_ELEMENTO);
    pagina.appendChild(feat); feat.layoutSizingHorizontal = "FIXED"; feat.resize(1980, feat.height);

    if (primeraSeccion && msg.leyenda) {
      const it = envolverItem(await seccionLeyenda());
      pagina.appendChild(it); it.layoutSizingHorizontal = "FILL";
    }
    for (const contenido of await seccionPara(nodo, seccion, opts)) {
      const it = envolverItem(contenido);
      pagina.appendChild(it); it.layoutSizingHorizontal = "FILL";
    }

    const foot = await footer();
    pagina.appendChild(foot); foot.layoutSizingHorizontal = "FIXED"; foot.resize(1980, foot.height);

    pagina.fills = [];                 // el fill lo ponen los hijos shell
    specs.appendChild(pagina);
    primeraSeccion = false;
  }
  figma.currentPage.appendChild(specs);
  finalizar(specs, nodo);
  ```
- `finalizar(specs, nodo)`: ya no setea `frame.fills` (el contenedor `Specs` queda sin fill). Sí
  mantiene el posicionamiento (`x/y` a la derecha del nodo), el `setExplicitVariableModeForCollection`
  (se hereda a los hijos) y el `scrollAndZoomIntoView`. Quitar la línea `frame.fills = fillTematizado(...)`.

## Ancho fijo 1980 y overflow

Header/Hero/Feature/Footer son `FIXED 1980`; `anatomyItem` es `FILL` → el `Specifications` huggea
a 1980. Si el contenido (artwork grande) supera 1780 de ancho útil, el `anatomyItem` crece y el
`Specifications` pasa de 1980; las barras shell se quedan en 1980. Es una degradación aceptable;
no se agrega scroll ni reescalado en este pase.
<!-- ponytail: ancho fijo 1980; si el artwork excede, el page crece. Reescalar el artwork si molesta. -->

## Alcance / no incluye

- No se renombran todos los frames internos de cada generador (Display, Content, Card, Header,
  Body ya existen; el PDF usa esos mismos nombres salvo `anatomyItem`/`itemValue`, que sí se
  aplican). El contenido de cada sección se reusa tal cual, envuelto en `anatomyItem`.
- No cambian las cotas, marcadores, colores de specs ni la lógica de extracción.
- No se agrega manejo de overflow/reescalado del artwork.

## Testing

- Todo el cambio es impuro (toca `figma.*`) → verificación por PDF, sin tests nuevos.
- Cada tarea: `npm run build && npm test` sin errores ni regresiones (214 tests).
- Verificación final por PDF: por cada sección un frame `Specifications` (radius 40, ancho 1980)
  con Header (plugin ···· SECCIÓN), Hero (Badge "specifications" + título 56 + descripción),
  Feature (nombre del elemento + descripción), anatomyItem(s) con el contenido, y Footer
  (plugin centrado); todas las secciones apiladas dentro de `Specs`.
