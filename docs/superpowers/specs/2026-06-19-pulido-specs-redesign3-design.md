# Pulido del output de specs (redesign 3 + estructura + colores) — Diseño

**Fecha:** 2026-06-19
**Referencias:** `Specifications-redesign 3.pdf`, `Specifications-structure.pdf`,
`colores-badges.pdf`, `colores-cotas-anotaciones.pdf`, `Image #2`, `Image #3`.

## Objetivo

Cuatro mejoras al output de specs, surgidas del feedback:
1. Typography muestra el nombre del estilo de texto (con su grupo) cuando hay estilo aplicado.
2. La caja gris del artwork de Anatomy es de tamaño mínimo grande, con el elemento centrado.
3. La página `Specifications` adopta la estructura de `Specifications-structure.pdf`.
4. Badges (marcadores) y cotas usan las paletas provistas (hex estimados, se ajustan por PDF).

Decisión previa confirmada: hex estimados de los swatches; se afinan por feedback.

---

## 1. Typography con nombre de estilo (pura, testeable)

`src/plugin/utils/atributos.ts`, en `leerAtributos`, el atributo `typography` (línea ~82)
hoy siempre usa el raw `formatearTipografia(...)`. El modelo ya tiene `nodo.textStyleName`
(lo llena el adaptador desde `textStyleId` vía `getStyleById`), pero no se usa.

Cambio: si `nodo.textStyleName` existe, `valor` = `nodo.textStyleName` (ej. `Text SM/Medium`,
que ya incluye el grupo); si no, el raw actual. Sigue `formato: "HARDCODED"` (se renderiza
como texto plano, igual que hoy; en redesign 3 la typography con estilo se ve como texto
plano, sin chip ni raw extra).

```ts
if (nodo.fontFamily && typeof nodo.fontSize === "number") {
  const valor = nodo.textStyleName ??
    formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight, letterSpacing: nodo.letterSpacing }, formatoTipoActual());
  atributos.push({ clave: "typography", valor, formato: "HARDCODED" });
}
```

**Test** (`src/plugin/utils/atributos.test.ts` o donde estén los tests de atributos):
- nodo con `textStyleName: "Text SM/Medium"` → atributo typography `valor === "Text SM/Medium"`.
- nodo con `fontFamily/fontSize` y sin `textStyleName` → `valor` = el raw formateado (comportamiento actual).

---

## 2. Caja gris del artwork con tamaño mínimo y elemento centrado

`src/plugin/generadores/anatomy.ts`, en `seccionDeAnatomy`, el `Artwork` hoy hace:
```ts
clon.x = MARGEN_ARTWORK; clon.y = MARGEN_ARTWORK;
artwork.resize(clon.width + 2 * MARGEN_ARTWORK, clon.height + 2 * MARGEN_ARTWORK);
```
Para un elemento chico (badge) la caja gris queda muy chica.

Cambio: el `Artwork` tiene un **tamaño mínimo** (constante `ARTWORK_MIN = 440`). El canvas
es `max(min, contenido + 2*margen)` en cada eje, y el clon se **centra**:
```ts
const contenidoW = clon.width + 2 * MARGEN_ARTWORK;
const contenidoH = clon.height + 2 * MARGEN_ARTWORK;
const canvasW = Math.max(ARTWORK_MIN, contenidoW);
const canvasH = Math.max(ARTWORK_MIN, contenidoH);
artwork.resize(canvasW, canvasH);
const offsetX = (canvasW - clon.width) / 2;
const offsetY = (canvasH - clon.height) / 2;
clon.x = offsetX; clon.y = offsetY;
```
Los marcadores y bordes punteados ya se calculan a partir de `cajasRelativas(seleccionado)`
sumando el offset del clon: hay que reemplazar el `+ MARGEN_ARTWORK` por `+ offsetX` / `+ offsetY`
para que sigan cayendo sobre la caja real del clon centrado.

`ARTWORK_MIN = 440` es un valor inicial (canvas ~cuadrado tipo redesign 3); se ajusta por PDF.

---

## 3. Estructura de página (`Specifications-structure.pdf`)

Hoy: `main.ts` arma `Specifications` (padding 64, gap 128) → `<name> Spec` (gap 48) →
[leyenda] → por sección: `tituloYEncabezado` + frames de sección. Y `encabezado.ts` arma
`Title & Heading` con `_Status` (SPACE_BETWEEN) + `_Doc/Heading` (padding lateral 64).

Estructura objetivo (por sección se repite el header + el contenido):

```
Specifications (vertical, gap 64, padding 0, fill fondo-spec)
└─ por cada sección:
   ├─ title-header (vertical, gap 64)
   │  ├─ wrapper (vertical, gap 8, padding 0/64)
   │  │  └─ _Status (horizontal): Right Side [FILL, align start: BLUEPRINT…] +
   │  │                            Left Side [FILL, align end: SECCIÓN]
   │  │     (SF Pro Text Medium 13, color #374151; divisor inferior 1px #D1D5DB)
   │  └─ _Doc/Heading (vertical, gap 10, padding 0/64)
   │     └─ Description (vertical, gap 24): título 36 + descripción 16
   └─ <name> Spec (vertical, gap 64, padding 0/64/64/64): frames de la sección
```

Diferencias clave vs hoy:
- `Specifications` pasa a **padding 0** (antes 64) y **gap 64** (antes 128).
- El padding lateral 64 se mueve a los wrappers internos (`wrapper`, `_Doc/Heading`,
  `<name> Spec`), así la **barra y el título quedan alineados** al mismo margen de 64.
- El contenido de cada sección se envuelve en un frame `<name> Spec` con padding `0/64/64/64`
  y gap 64.

### Cambios en `encabezado.ts`

`tituloYEncabezado(nombreElemento, etiquetaSeccion)` devuelve `title-header` con la nueva
estructura interna:
- `wrapper` (vertical, gap 8, paddingLeft/Right 64) contiene `_Status`.
- `_Status` (horizontal): `Right Side` (FILL, primaryAxisAlign START, texto plugin) +
  `Left Side` (FILL, primaryAxisAlign END, texto sección). Ambos SF Pro Text Medium 13,
  color #374151. Divisor: borde inferior 1px #D1D5DB en `_Status`, con `paddingBottom`
  para separar del texto (mantener el divisor visible como hoy).
- `_Doc/Heading` (vertical, gap 10, paddingLeft/Right 64) → `Description` (vertical, gap 24):
  título 36 (FONT_TITULO) + descripción 16 (#6B7280).
- Los `layoutSizingHorizontal = "FILL"` se setean después de cada `appendChild`, como hoy.

(El gap exterior 64 entre `wrapper` y `_Doc/Heading` lo da `title-header`.)

### Cambios en `main.ts`

- `Specifications`: `frameVertical("Specifications", 64, 0)` (gap 64, padding 0).
- Quitar el `spec` intermedio `<name> Spec` con gap 48 que envuelve todo; en su lugar, por
  cada sección incluida: appendear el `title-header` y un frame `<name> Spec`
  (vertical, gap 64, padding 0/64/64/64) que contenga los frames de esa sección.
- La leyenda opcional, si está, va dentro del primer `<name> Spec` (o como hoy, antes del
  contenido). Se mantiene su comportamiento.

```ts
const specifications = frameVertical("Specifications", 64, 0);
for (const seccion of ORDEN) {
  if (!msg.secciones.includes(seccion)) continue;
  const header = await tituloYEncabezado(nodo.name, ETIQUETA_SECCION[seccion]);
  specifications.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  const cuerpo = frameVertical(`${nodo.name} Spec`, 64);
  cuerpo.paddingTop = 0; cuerpo.paddingLeft = cuerpo.paddingRight = cuerpo.paddingBottom = 64;
  if (seccion === ORDEN.find((s) => msg.secciones.includes(s)) && msg.leyenda) {
    cuerpo.appendChild(await seccionLeyenda());
  }
  for (const f of await seccionPara(nodo, seccion, opts)) cuerpo.appendChild(f);
  specifications.appendChild(cuerpo);
  cuerpo.layoutSizingHorizontal = "FILL";
}
```

(El `finalizar(specifications, nodo)` ya aplica el fill del tema; se mantiene.)

---

## 4. Colores de badges y cotas (hex estimados)

### 4a. Badges (marcadores numerados) — `anatomy.ts`

Reemplazar `COLORES_MARCA` (5 colores) por la paleta de 8, en el orden que valida
redesign 3 (1=azul, 2=magenta, 3=violeta), texto blanco (el número ya es blanco):

```ts
const COLORES_MARCA: RGB[] = [
  hexARgb("#0D80FF"), // azul
  hexARgb("#FF2D9C"), // magenta
  hexARgb("#9747FF"), // violeta
  hexARgb("#F0411E"), // rojo
  hexARgb("#F5C518"), // amarillo
  hexARgb("#1FA855"), // verde
  hexARgb("#5E6B8A"), // slate
  hexARgb("#F5921E"), // naranja
];
```
(`hexARgb` ya se importa en `anatomy.ts`.) El borde punteado (`bordeMarca`) y el badge del
panel (`badgePanel`) ya usan el color de `COLORES_MARCA`, así que heredan la paleta.

### 4b. Cotas y anotaciones — `layout.ts`

Hoy `cota` / `cotaConNombre` usan **fondo saturado + texto blanco**. La paleta de cotas es
**fondo claro + texto oscuro**, así que se invierte: el chip pasa a fondo claro + texto
oscuro. Se introduce un tipo de par de color y se cambian las firmas:

```ts
interface ParCota { bg: RGB; texto: RGB; }
const COTA_PADDING: ParCota = { bg: hexARgb("#E6F0FB"), texto: hexARgb("#324049") }; // azul claro / slate
const COTA_GAP: ParCota     = { bg: hexARgb("#FBE5F0"), texto: hexARgb("#C71E84") }; // rosa claro / magenta
const COTA_DIM: ParCota     = { bg: hexARgb("#E8F6EC"), texto: hexARgb("#1E6B3A") }; // verde claro / verde
```

- `cota(valor, par, artwork)` y `cotaConNombre(nombre, valor, par, artwork)`: `c.fills = par.bg`;
  los textos pasan de blanco a `par.texto`. El sub-color (`aclarar(color, 0.35)`) se reemplaza
  por una variante del texto (ej. `aclarar(par.texto, 0.35)`).
- `chipSpacing` y `dibujarMarcas` pasan `COTA_PADDING` / `COTA_GAP` (y `COTA_DIM` para medidas
  de hijos) en lugar de `CHIP_PADDING` / `CHIP_GAP`.
- Líneas de bracket: `LINEA_PADDING` y `LINEA_GAP` pasan a los colores de texto oscuros
  (`#324049` y `#C71E84`) para que el bracket combine con el chip.
- Las bandas/overlays (`bandaPunteada`, `rectOverlay`) que usaban `PADDING_BANDA` / `GAP_BANDA`
  pueden seguir; si quedan duros respecto del nuevo esquema, se ajustan por PDF.

Nota: las constantes viejas que queden sin uso (`CHIP_PADDING`, `CHIP_GAP`, `CHIP_DIM`,
`AZUL/VERDE/NARANJA/ROJO` si aplica) se eliminan en el mismo cambio para no dejar dead-code.

---

## Alcance / no incluye

- No se rediseñan los headings internos de cada sección (salvo el envoltorio `<name> Spec`).
- No se tocan otras secciones más allá de lo descrito.
- Los hex son estimados; se afinan por feedback de PDF.

## Testing

- #1 es pura → lleva test unitario (arriba).
- #2, #3, #4 son impuros (tocan `figma.*`) → verificación por PDF, sin tests nuevos.
- Cada tarea: `npm run build && npm test` sin errores ni regresiones.
- Verificación final: generar Anatomy + Layout, exportar PDF y comparar contra redesign 3 /
  structure: header alineado, caja gris grande con elemento centrado, typography con nombre
  de estilo, marcadores con la paleta de 8, cotas con fondo claro + texto oscuro.
