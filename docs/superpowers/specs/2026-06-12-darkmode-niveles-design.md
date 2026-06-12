# Diseño — Dark mode de 3 niveles con variables — Rebanada 32

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Reemplazar el dark mode horneado por el mecanismo del PRD: una colección local de variables con modos Light/Dark, fills generados atados a esas variables, y los 3 niveles (página/spec/artwork) resueltos por el sistema de modos nativo de Figma.

---

## Contexto y estrategia

El dark actual (Rebanada de 2026-06-11) hornea colores al generar: `tema.ts` guarda texto/fondo y
el toggle elige el set. El PRD (`prd-images/11. Dark Mode/`) usa otra cosa: una colección de
variables ("EightShapes Specs") con modos Light/Dark; los outputs se pintan **atados a variables**,
y el usuario cambia el modo desde el panel nativo de Figma a nivel página, frame Spec o artwork.
Eso re-tematiza en vivo, sin regenerar.

**Decisiones tomadas en el brainstorming:**
- Mecanismo fiel al PRD: variables con modos, no selectores horneados.
- Tres variables alcanzan: `texto`, `fondo-spec`, `fondo-artwork`. Los colores de
  marcadores/overlays siguen siendo constantes (legibles en ambos modos).
- Semántica nueva del toggle Dark: ON → modo explícito Dark en el frame Specifications generado;
  OFF → sin modo explícito (Auto: hereda el de la página). La UI no cambia.
- `tema.ts` y `tests/tema.test.ts` quedan sin uso y **se eliminan** (aprobado explícitamente).

---

## Sección 1 — Colección y variables (`utils/variables-tema.ts`)

Módulo nuevo, impuro (API `figma.variables`):

```typescript
export interface VarsTema {
  coleccion: VariableCollection;
  modoLight: string;   // modeId
  modoDark: string;
  texto: Variable;
  fondoSpec: Variable;
  fondoArtwork: Variable;
}

export async function asegurarVariablesTema(): Promise<VarsTema>
export function varsTema(): VarsTema   // las últimas aseguradas (estado de módulo)
```

`asegurarVariablesTema` es **idempotente**:
1. Busca la colección local `"Specs"`; si no existe la crea.
2. Renombra el modo default a `"Light"` y agrega `"Dark"` si falta (buscar por nombre).
3. Busca cada variable por nombre en la colección; si falta la crea (`COLOR`) y setea su valor en
   ambos modos:
   - `texto`: Light `#000000` / Dark `#F2F2F2`
   - `fondo-spec`: Light `#FFFFFF` / Dark `#1F1F24`
   - `fondo-artwork`: Light `#F5F5F5` / Dark `#15171A`
4. Guarda las referencias en estado de módulo y las devuelve.

`main.ts` la llama (await) al inicio de cada generación, antes de despachar la sección.

---

## Sección 2 — Binding en generadores

- **`texto()`** (`generadores/frames.ts`): el fill queda atado a la variable `texto` vía
  `figma.variables.setBoundVariableForPaint(paint, "color", varsTema().texto)`. Desaparece el uso
  de `temaActual()`.
- **Artworks**: los cuatro puntos que pintan gris `0.96` (`anatomy.ts:100`, `layout.ts:115`,
  `properties.ts:42` y `:122`) y el uso de `GRIS_CLARO` en `modes.ts` atan `fondo-artwork` con el
  mismo mecanismo. Helper compartido en `frames.ts`:

```typescript
export function fillTematizado(variable: Variable): Paint[]  // SOLID atado a la variable
```

- **`finalizar()`** (`main.ts`): el frame Specifications ata `fondo-spec` (siempre, ya no según el
  toggle), y si `msg.dark` es true setea
  `frame.setExplicitVariableModeForCollection(coleccion, modoDark)`; si es false no setea nada
  (Auto).

---

## Sección 3 — Limpieza

- Se eliminan `src/plugin/utils/tema.ts` y `tests/tema.test.ts`.
- `main.ts` pierde `aplicarTema`/`temaActual` (import y usos).

---

## Sección 4 — Testing y verificación

Casi todo es impuro (API de variables): la verificación es manual en Figma.

1. Generar Anatomy → en el panel nativo (Appearance → Local variables → Specs) cambiar el modo de
   la **página** a Dark → todo el output se oscurece en vivo, sin regenerar.
2. Toggle Dark del plugin ON → el Specifications generado sale en Dark aunque la página esté Light
   (**nivel spec**); OFF → hereda la página.
3. Setear el modo Dark solo en un **artwork** → solo ese fondo se oscurece (**nivel artwork**).
4. Regenerar varias veces → una sola colección "Specs", sin variables duplicadas.
5. Marcadores de Layout y overlays legibles en ambos modos.
6. `npm run build && node --test` verdes (la suite pierde solo `tema.test.ts`).

---

## Fuera de alcance de esta rebanada

- Variables para los colores de marcadores/overlays (siguen constantes).
- Publicar la colección como librería o alinear nombres con EightShapes DS.
- Migrar outputs ya generados con el mecanismo viejo.
