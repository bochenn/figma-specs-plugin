# Diseño — Dark Mode del output — Rebanada 17

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Toggle "Dark mode" que genera el output con un tema oscuro (texto claro + fondo oscuro del `Specifications`), dejando el artwork sin cambios. Aplica a las 8 secciones.

---

## Contexto y estrategia

El PRD (feature #13) cambia el output a modo oscuro en 3 niveles (página/spec/artwork), dependiendo de la
collection de variables "EightShapes Specs" (feature #12, no implementada).

Esta rebanada hace un dark mode directo: un módulo `tema` (light/dark) que `texto()` y `finalizar()` aplican.
Como **todos** los outputs pasan por `finalizar` y todo el texto generado pasa por `texto`, dos puntos de
toque tematizan las 8 secciones. El artwork (el clon real) queda sin cambios, fiel al PRD.

**Decisiones tomadas en el brainstorming:**
- Alcance: toggle dark que tematiza texto + fondo del `Specifications`. Sin los 3 niveles, sin las variables EightShapes.
- En light, el tema deja el output idéntico al de hoy (texto negro, fondo transparente).

---

## Sección 1 — Módulo de tema (`utils/tema.ts`)

```typescript
interface Tema {
  texto: RGB;        // color del texto generado
  fondo: RGB | null; // fondo del frame Specifications (null = transparente, light)
}

const LIGHT: Tema = { texto: { r: 0, g: 0, b: 0 }, fondo: null };
const DARK: Tema = { texto: { r: 0.95, g: 0.95, b: 0.95 }, fondo: { r: 0.12, g: 0.12, b: 0.14 } };

let actual: Tema = LIGHT;

export function aplicarTema(dark: boolean): void {
  actual = dark ? DARK : LIGHT;
}

export function temaActual(): Tema {
  return actual;
}
```

El módulo no toca `figma.*` (solo el tipo `RGB`), así que es testeable. En light deja el output como hoy.

---

## Sección 2 — Aplicar el tema (dos puntos de toque)

1. **`texto()`** (`generadores/frames.ts`): después de setear `characters`/`fontSize`, agrega
   `t.fills = [{ type: "SOLID", color: temaActual().texto }]`. Cubre todo el texto generado. (Los pocos
   casos que pisan el fill después —ej. el número blanco del marcador— quedan igual.)
2. **`finalizar()`** (`main.ts`): setea el fondo del `Specifications`:
   `frame.fills = tema.fondo ? [{ type: "SOLID", color: tema.fondo }] : [];`. Tematiza las 8 secciones en
   un solo lugar.

El artwork (clon + sus fondos `GRIS(0.96)`) queda sin cambios.

**Disparador (UI):** checkbox "Dark mode" (junto al de nested). El mensaje suma `dark`; `MensajeUI` pasa a:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean; dark?: boolean };
```

En `main.ts`, al recibir el mensaje, `aplicarTema(msg.dark ?? false)` **antes** de generar.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Dark off | Output idéntico al de hoy (texto negro, fondo transparente). |
| Dark on | Texto claro + fondo oscuro en el `Specifications`; artwork sin cambios. |
| Dark + nested | Independientes; conviven en el mensaje. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `tema`: `aplicarTema(true)` → `temaActual().fondo` no null; `aplicarTema(false)` → `fondo` null y `texto` negro.

**2. Verificación manual en Figma:** Dark off → "Anatomy" (igual que hoy). Dark on → "Anatomy" → output con
fondo oscuro + texto claro, artwork sin cambios. Probar el dark en varias secciones. Comparar contra
`prd-images/11. Dark Mode/`. Verificar que con dark off todo queda como antes.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; `texto`/`finalizar` se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Los 3 niveles del PRD (página/spec/artwork por separado).
- La collection de variables "EightShapes Specs" (Custom Color Formats).
- Tematizar marcadores/overlays/chips (hoy quedan con sus colores fijos).
- Persistir la preferencia de dark entre runs.
