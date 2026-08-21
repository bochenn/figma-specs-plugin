# Blueprint Specs & Handoff — Bitácora / Second-Brain

> Documento de trabajo para destilar tweets y un post de LinkedIn.
> No es documentación del producto: es el detrás de escena — cronología, decisiones, pivoteos, dudas y aprendizajes.
> Fuente de los datos: historial real de git (508 commits, 75 PRs) + specs del repo.
> Última actualización: **2026-07-04**.

---

## 0. Resumen en una línea

Un plugin de Figma que **automatiza el handoff de diseño a desarrollo**: seleccionás un componente y genera, sobre el canvas, la documentación visual de su anatomía, propiedades, layout, variables y estilos. Lo que un diseñador de sistemas haría a mano en horas, el plugin lo dibuja en segundos.

---

## 1. Métricas duras (la foto)

| Métrica | Valor |
|---|---|
| Inicio | **2026-06-09 14:54** |
| Estado a hoy | **2026-07-04** (activo) |
| Tiempo calendario | **~25 días** |
| Días con actividad real | **19 días** |
| Commits | **508** |
| Pull requests | **75** |
| Tests unitarios | **~220** (lógica pura, sin mockear Figma) |
| Secciones de spec generadas | **8** (Anatomy, Properties, Layout & Spacing, Styling Inventory, Modes, Two-Way, Data/JSON, Complete) |
| Stack | TypeScript + esbuild, **cero frameworks de UI** |
| Idioma del código | Español (identificadores y comentarios); docs en inglés |

**Ritmo real por día (commits):**

```
06-09: 41   ██████████
06-10: 81   ████████████████████   ← pico
06-11: 57   ██████████████
06-12: 65   ████████████████
06-13: 10   ██
06-14:  3   ▌
06-15: 12   ███
06-16: 43   ██████████
06-17: 66   ████████████████
06-18: 53   █████████████
06-19: 10   ██
06-22: 36   █████████
06-23: 13   ███
06-24:  1
06-25:  1
06-26:  3
06-27:  4
06-29:  7
07-03:  2
```

Lectura rápida: **3 sprints de fuego** (09–12 jun, 16–18 jun, 22–23 jun) y una cola de refinamiento/estrategia (24 jun → hoy). El pico fue el 10 de junio con 81 commits: el día en que se cablearon 5 secciones seguidas (Data, Styling Inventory, Modes, Variable Formatting, Variables).

---

## 2. Cronología detallada (con timestamps)

### Fase 1 — Cimientos y todas las secciones núcleo · 09–12 jun

- **06-09 14:54** — Primer commit: *"Diseño: Cimientos + Anatomy (Rebanada 0 + 1)"*. Arranca con un **documento de diseño**, no con código. La primera decisión fue metodológica: rebanadas ("slices") pequeñas, cada una con su doc de diseño → su plan → su PR.
- **06-09 15:04** — Plan de implementación de Cimientos. **15:13** scaffolding (manifest, package, tsconfig). **15:14** esbuild + UI embebida + stub end-to-end funcionando **en 20 minutos**.
- **06-09 15:19–16:08** — En una hora: modelo de tipos del dominio (`NodoLike`, `Atributo`, `ElementoAnatomy`), traversal de capas, lectura de atributos, extracción de Anatomy, posicionamiento de marcadores, generador de frames y orquestación en `main.ts`.
- **06-09 16:34** — **PR #1 mergeado** (Cimientos + Anatomy). El esqueleto entero + la primera sección real en **~1h40**.
- **06-09 16:35 → 19:47** — PR #2 (Properties/Variant) y PR #3 (Layout & Spacing) el mismo día.
- **06-10** — Día récord (81 commits): PRs #4–#13. Data/JSON, Styling Inventory, Modes, motor de formateo de variables, Variables en el inventario, overlays de layout, pills en Properties, artwork por mode, Properties boolean + highlight, Two-Way.
- **06-11 → 06-12** — PRs #14–#34. Complete (Anatomy y Layout), componentes anidados, **dark mode del output**, multi-columna, tabular anatomy, formatos custom (color, spacing px/rem, tipografía, line-height, letter-spacing, rem), marcadores de layout, dark mode de 3 niveles con variables, ocultar anotaciones externas.

**Observación:** en 4 días (09–12) ya estaban las **8 secciones + formatos custom + dark mode**. La velocidad no vino de tirar código rápido, vino del **par diseño-doc + plan** que dejaba cada rebanada perfectamente acotada antes de tocar el editor.

### Fase 2 — QA, rediseño de UI y refinamiento visual · 13–18 jun

- **06-13 / 06-14** — Bajón de ritmo (10 y 3 commits): variables de spacing y de width/height resueltas. Trabajo más fino, menos volumen.
- **06-15 10:02–12:04** — **PRs #38–#42: la tanda de QA**. Checklists maestros (`qa-checklist`, `qa-prep-detalle`, `fix-qa-hallazgos`). Punto de inflexión: se pasa de "agregar features" a "endurecer lo que hay". Aparece un **rediseño de UI** (PR #39).
- **06-16** (43 commits) — DesignDoc enriquecido: exhibit de Layout más rico, recorrer dentro de instancias, detección de grids, cotas de dimensión, medidas por hijo, chips de medida. Acá empieza el trabajo fino de **legibilidad del output** (que un dev lo lea sin explicación).
- **06-17** (66 commits) — Iconos en el panel, fix de clipping de chips, refinamiento de overlays por los 4 lados, toggles/CTA en la UI, jerarquía de chips en Layout, iconos a 24px y recoloreo, split del artwork, leyenda "cómo leer".
- **06-18 17:29–20:22** — **PR #67 (rediseño de Anatomy)**, **PR #70 (rename del plugin)** y **PR #69 (rediseño de tarjetas de specs)**. Cierra la primera era del producto con una identidad más definida.

### Fase 3 — El pivote estructural · 22–23 jun

- **06-22** (36 commits) — Callouts de marcadores, tag de Layout, línea guía vertical recta, marcadores distribuidos por lados, cotas en su lugar, pesos de fuente medium, párrafos explicativos. Todo apunta a que **el output se lea como un documento**, no como un dump de datos.
- **06-23 15:05** — *"Diseño: nueva estructura de Specifications (frame por sección)"*. **El pivote más importante de arquitectura de salida**: en vez de un bloque monolítico, cada sección pasa a ser un `Specifications` propio dentro de un contenedor `Specs`, con Hero (tag + párrafo), header y footer de página. Nace `pagina.ts`; se borra `encabezado.ts`. 
- **06-23 16:38 → 18:51** — Iteración rápida sobre feedback (`Specs-2`, `Specs-3`, `Specs-4`): estilos de texto, hero en inglés, min-width de cards, pageHeader/pageFooter.

### Fase 4 — Rediseño visual, traducción y profesionalización · 24 jun → hoy

- **06-25 15:54** — *"rediseña Properties al estilo Spectral (preview + tabla)"*. Segundo rediseño de una sección concreta, buscando referencia estética (Spectral).
- **06-26 14:36** — Rediseño del panel + styling tipo **catálogo**. **16:48** — Reorganización de las specs por feature en `specs/` y limpieza de docs viejos. La documentación interna se vuelve *living docs*.
- **06-27 11:36** — **Traducción de TODO el proyecto a inglés** (código de UI, docs y specs). Decisión de cara a hacerlo público/compartible. **12:01** — Se agrega **licencia MIT + créditos de terceros** (iconos UI3, fuentes por nombre, tooling). El proyecto se prepara para ser open source de verdad.
- **06-29 10:00** — Árbol de capas en Layout (documentar todas las capas, no solo las Auto Layout). **12:21** — **typecheck gate** (CI de tipos) + fix de errores. **13:03** — Atribución del creador (Leandro Henflen) + links. **17:20** — Icono Blueprint en About y README.
- **07-03 18:17** — README más profesional (hero centrado, badges, TOC).
- **07-04** — Este documento + tags/topics en el About del repo de GitHub.

---

## 3. El mindset y el método (lo más "vendible")

Esto es lo diferencial y lo que mejor rinde en un hilo o post:

1. **Diseño antes que código, siempre.** Cada rebanada empezó con un *doc de diseño* (qué muestra, qué estructura, qué opciones) y luego un *plan de implementación*. El código fue la última milla, no la primera.
2. **Rebanadas ("Rebanadas 0…36" + "DesignDoc A/B").** Nunca "el plugin completo": siempre la siguiente unidad de valor cerrada, mergeada, y a la próxima. 75 PRs = 75 unidades de valor.
3. **Separación puro/impuro como decisión de testabilidad.** La *extracción* (nodos Figma → datos planos) es lógica pura testeable contra una interfaz mínima `NodoLike`; la *generación* (datos → frames) toca `figma.*` y se valida a ojo. Ese corte es lo que permitió **~220 tests sin mockear la API de Figma**.
4. **Cero dependencias de UI.** TypeScript + esbuild y nada más. Menos superficie, menos deuda, build instantáneo.
5. **Living docs.** Cuando una feature cambia, su spec cambia en el mismo commit. La doc no envejece porque es parte del cambio.
6. **QA como fase explícita, no como afterthought.** Hubo PRs dedicados solo a checklists de QA (#38–#42).
7. **El output tiene que leerse solo.** Buena parte del esfuerzo (jun 16–23) no fue "más datos" sino "que un dev entienda el spec sin que el diseñador esté al lado": callouts, leyendas "cómo leer", cotas en su lugar, jerarquía visual.

Frase-semilla: *"Escribí 508 commits pero la velocidad no vino de escribir rápido. Vino de no escribir hasta tener el diseño y el plan de cada rebanada."*

---

## 4. Decisiones técnicas clave (y por qué)

- **Puro/impuro para testear sin Figma.** → Tests rápidos y determinísticos; la parte visual, a ojo (es lo correcto: lo visual se valida mirando).
- **`postMessage` entre sandbox y UI** porque Figma lo obliga; se asumió el costo en vez de pelearlo.
- **Frame-por-sección (pivote del 23 jun)** → el output escala a documento navegable en vez de un bloque gigante.
- **Formatos custom (px/rem, formatos de color, tipografía en rem)** → el spec habla el idioma del dev que lo va a consumir, no solo el del diseñador.
- **Traducción a inglés (27 jun)** → apuntar a comunidad global / publicación.
- **Typecheck gate (29 jun)** → poner una compuerta de calidad ahora que el proyecto es público.

---

## 5. Pivoteos (dónde cambió el rumbo)

1. **De "bloque monolítico" a "frame por sección"** (23 jun). El más caro y el más valioso: reescribió cómo se ensambla toda la salida.
2. **Rediseños puntuales con referencia externa**: Properties "estilo Spectral" (25 jun), panel tipo catálogo (26 jun).
3. **De proyecto personal a open source** (27 jun): traducción total + MIT + créditos. Cambió la audiencia mental del proyecto.
4. **De "documentar solo Auto Layout" a "documentar todas las capas"** en Layout (29 jun).

---

## 6. Problemas y desafíos técnicos (los que dejaron cicatriz en el log)

- **Marcadores que no se veían** → había que desactivar `clipsContent` del artwork clonado (06-09, primer día).
- **Superposición de marcadores** (3+ juntos) y chips que se cortaban → distribución por lados, rieles horizontales/verticales, ordenar por centroX.
- **Cotas de dimensión desalineadas** → separación constante, ocultar cotas de los hijos, medición "en su lugar".
- **Detección de grids** (H3) → varios PRs hasta que grid + Auto Layout convivieron.
- **Clipping de chips de medida** → agrandar el artwork para no cortar contenido.
- **Variables sin resolver** (spacing, width/height) → resolver el valor real detrás del token, no solo el nombre.
- **Legibilidad del dark mode** de 3 niveles con variables.

Patrón: **casi todos los desafíos fueron de representación visual**, no de extracción de datos. Sacar el dato de Figma fue lo fácil; **dibujarlo de forma que un humano lo entienda** fue el trabajo real.

---

## 7. Aprendizajes (transferibles)

- **La lógica pura testeable es un multiplicador de velocidad**, no un lujo. Permitió cambiar la extracción sin miedo.
- **El cuello de botella del handoff no es el dato, es la comunicación.** El 60% del esfuerzo fue diseño de la lectura, no ingeniería.
- **Rebanar + mergear seguido** mantiene el proyecto siempre "vivo" y desbloquea feedback temprano.
- **Documentar en el mismo commit** es la única forma en que la doc no miente.
- **Traducir e ir a inglés tarde** funcionó, pero tuvo costo (ver §11): hubiera sido más barato temprano.

---

## 8. Handoff de UX → Dev: contexto, problemas y best practices

Este es el corazón temático para LinkedIn (audiencia de diseño de producto / design systems).

### El problema real del handoff
El handoff diseño→dev es donde se pierde información: el dev recibe un archivo de Figma y tiene que *inferir* padding, jerarquía, qué es token y qué es valor suelto, qué cambia entre variantes, cómo se comporta en dark mode. Esa inferencia es cara y propensa a error. **El plugin convierte inferencia en documentación explícita.**

### Challenges clásicos del handoff que ataca
- **"¿Esto es un token o un valor mágico?"** → los tokens salen como *ChipVar* con nombre de variable + valor resuelto.
- **"¿Cuánto padding / gap?"** → cotas y bands de layout dibujadas sobre el artwork.
- **"¿Qué cambia entre variantes?"** → Two-Way y Complete muestran el diff contra el default.
- **"¿Cómo se ve en Light/Dark?"** → sección Modes por colección de variables.
- **"¿Qué estilos usa y dónde?"** → Styling Inventory tipo catálogo.

### Best practices que el plugin encarna (y que sirven de contenido)
- Documentar **anatomía numerada** en vez de describir con palabras.
- Mostrar **valor resuelto + nombre de token** juntos (no uno u otro).
- Especificar **por qué cambia** una variante, no solo que cambia.
- Handoff como **artefacto legible por sí solo**, sin reunión obligatoria.

### Dónde está alineado
Alineado con la práctica moderna de **design systems documentados** (piezas tipo EightShapes/Spectral: anatomía, do/don't, tokens). Encaja en equipos que ya piensan en componentes + variables.

### Qué le falta (honesto)
- No documenta **interacción/estados de comportamiento** (hover, focus, transiciones) más allá de variantes.
- No genera **código** ni tokens exportables (JSON de anatomía sí, pero no un theme listo para consumir).
- No cubre **accesibilidad** (contraste, roles, targets táctiles).
- No hay **versionado del spec** ni diff entre versiones del componente en el tiempo.
- Depende de que el archivo esté **bien construido** (Auto Layout, variables): garbage in, garbage out.

### Qué le sobra (riesgo de scope)
- La cantidad de **formatos custom** (px/rem, múltiples formatos de color, rem en tipografía, dark mode de 3 niveles) puede ser más de lo que el 80% de los equipos necesita. Es potencia que puede volverse ruido en la UI.
- Secciones como **Two-Way** y **Complete** son valiosas para sistemas complejos, pero para un botón simple son sobredocumentación.

### ¿Para quién es útil?
- **Design systems teams** que producen documentación de componentes a escala. ← sweet spot.
- **Diseñadores solos / equipos chicos** que hacen handoff a devs sin un sistema formal.
- **Agencias/consultoras** que entregan a clientes y necesitan specs presentables.
- **Poco útil para:** proyectos de UI desechable, prototipos, equipos donde diseño y dev son la misma persona.

---

## 9. Las preguntas incómodas (material de opinión, alto engagement)

### ¿Fue demasiado trabajo?
Depende del lente:
- **Como producto:** no. 25 días calendario / ~19 activos para 8 secciones + formatos + open source es eficiente, y el método (diseño→plan→slice) evitó retrabajo grande.
- **Como decisión de negocio:** discutible. Se construyó *mucha* superficie (formatos custom, 3 niveles de dark mode) antes de validar con usuarios reales cuáles se usan. Riesgo de **sobre-ingeniería sin señal de mercado**.
- Honesto: **la parte del 80% del valor** (Anatomy + Properties + Layout + tokens legibles) estuvo lista el **12 de junio**. Todo lo posterior fue refinamiento y potencia marginal. Un MVP publicable existía en día 4.

### ¿Está bien reemplazar el análisis y la estrategia humana por un plugin?
Matiz importante para no sonar naíf:
- **El plugin no reemplaza estrategia; reemplaza transcripción.** Documentar la anatomía de un componente no es trabajo estratégico: es trabajo mecánico y propenso a error que hoy consume horas de gente cara. Automatizar *eso* libera a esa gente para lo que sí es estratégico (decidir *qué* componente, *qué* API, *qué* sistema).
- **El riesgo real** no es reemplazar al humano, es **generar documentación sin criterio**: si el archivo está mal construido, el plugin documenta el error con confianza y lo hace parecer oficial. La responsabilidad se desplaza de "documentar" a "curar lo que el plugin documentó".
- Postura defendible: *"Automatizá la transcripción, no el juicio. El plugin dibuja el spec; el diseñador decide si el componente merecía existir así."*

Frase-semilla: *"El handoff no se pierde por falta de datos. Se pierde porque documentar a mano es tan aburrido que nadie lo hace bien. Automatizá el aburrimiento, no la decisión."*

---

## 10. Config 2026 y los "generative plugins" — la pregunta estratégica (con datos reales)

> Fuentes: [Figma Blog — Config 2026 recap](https://www.figma.com/blog/config-2026-recap/) y [Help Center — What's new from Config 2026](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026). Datos verificados el 2026-07-04.

### El dato que cambia el marco: pasó DURANTE el proyecto
**Config 2026 fue el 23–24 de junio de 2026.** Es decir, ocurrió **en medio del desarrollo de Blueprint** (que va del 9-jun al 4-jul). Más aún: los "generative plugins" y el Figma agent empezaron a rolar el **24-jun-2026**, prácticamente el mismo día en que el proyecto hacía su pivote de arquitectura de salida ("frame por sección", 23-jun). El timing es material narrativo de primera: *construí un plugin de Figma a mano justo la semana en que Figma anunció que ya no hace falta escribir plugins a mano.*

### Qué anunció Figma (lo relevante para este proyecto)
- **Generative plugins** (open beta, roll-out 24-jun-2026, planes pagos en Figma Design/Draw/Motion). *"Prompt the Figma agent to build reusable plugins right in your file that feel native to Figma... No local dev environment or plugin API knowledge required."* Describís el comportamiento, los controles y los parámetros, y el agente arma la herramienta con la UI nativa de Figma. Al lanzamiento viven en tu archivo; publicar a Community/organización llega "en los próximos meses".
- **Los ejemplos que da Figma son utilitarios simples:** reordenar/ordenar capas por criterio, aplicar spacing/padding consistente en una selección, find-and-replace de texto o color. **No** documentación de handoff compleja.
- **Los plugins "clásicos" (dev) NO se deprecan.** Textual de Figma: *"Classic plugins aren't going anywhere and we're continuing to invest in resources for developer plugins... new plugin APIs and new plugin UI; these investments will be available to both generative plugins and classic plugins."*
- **Figma agent** (open beta, para todos desde 23-jun): custom **skills**, **web search**, **MCP connectors** (Notion, Slack, GitHub, Atlassian, Hex, Granola…), adjuntar archivos. Llega a FigJam y Slides.
- **MCP se vuelve el conector transversal:** Figma Motion es *MCP-compatible* (exportás animación a CSS/JSON/React o la pasás a un coding agent), los shaders exportan vía MCP, el agente se conecta a herramientas externas por MCP.
- Otros: **Code layers** (closed beta; subís/clonás tu repo de GitHub al canvas), **Figma Motion** (timeline en el canvas), **shader fills/effects** parametrizados por el agente, **Weave tools**.

### El eje de la decisión: build-from-scratch vs. generative plugin on-the-fly

**Lo que los generative plugins comoditizan (y conviene NO construir a mano):**
- Utilidades simples y personales: ordenar capas, normalizar padding, find-and-replace. Exactamente los ejemplos de Figma. Si Blueprint fuera *eso*, hoy no valdría la pena codearlo.

**Lo que un generative plugin (todavía) NO hace, y donde Blueprint tiene foso:**
- **Determinismo y consistencia.** Un handoff spec no puede alucinar: el padding es el padding, y el mismo componente debe dar el mismo spec siempre. Un plugin generado por prompt no garantiza reproducibilidad.
- **Representación visual opinada y compleja.** El 60% del trabajo real de Blueprint fue *cómo se dibuja* (callouts, cotas en su lugar, leyendas "cómo leer", frame-por-sección, dark mode de 3 niveles). Un "describí la herramienta" no clava ese criterio de diseño de información.
- **Lógica de dominio testeable** (~220 tests, corte puro/impuro). Un plugin prompteado no se versiona ni se testea así.
- **Escala/publicación.** Los generative plugins hoy viven *en tu archivo*; publicar a la comunidad llega después. Un plugin clásico ya se distribuye.

### Postura recomendada (para el post)
El futuro es **híbrido, y Figma lo está cableando con MCP:**
- **Extracción + ensamblado del spec** = **código determinístico** (lo que Blueprint hace bien).
- **La capa de lenguaje/decisión** ("¿qué documentar?", "explicá esta variante en palabras", "resumí el sistema") = donde el **Figma agent** suma.
- El puente natural es **MCP**: exponer el motor determinístico de Blueprint como algo que el Figma agent pueda invocar, en vez de plugin **o** agente. Dado que Figma ya volcó agent + Motion + shaders + connectors sobre MCP, ese es el carril con viento a favor.
- Y ojo: Figma dice explícitamente que sigue invirtiendo en **plugin APIs y UI nuevas para plugins clásicos también.** O sea, construir un plugin dev "de verdad" **no es un callejón sin salida** — es la mitad determinística de un mundo híbrido.

### El riesgo honesto
Si Figma sacara **handoff-docs nativo** (un "genera el spec de este componente" de fábrica), gran parte de Blueprint se vuelve commodity. El foso defensible **no es "extraer datos de Figma"** (eso lo comoditiza el agente + MCP), es **la opinión sobre qué es un buen spec y cómo se dibuja para que un dev lo lea sin reunión.** Ahí hay que doblar la apuesta.

Frase-semilla: *"Figma anunció los 'generative plugins' el 24 de junio — justo mientras yo codeaba uno a mano. La lección no es 'perdí': es que lo que se genera por prompt son utilidades (ordená capas, normalizá padding). El criterio de qué es un buen handoff todavía no se prompt-ea."*

Frase-semilla: *"La pregunta ya no es '¿construyo un plugin?'. Es '¿qué parte es código determinístico y qué parte delego al agente de Figma vía MCP?'. El que confunde las dos, pierde."*

---

## 11. Qué habría hecho distinto (y cuándo, y por qué)

Autocrítica útil para credibilidad:

1. **Validar con 3 devs reales antes del 12 de junio.** El MVP del 80% estuvo listo el día 4; en vez de seguir agregando formatos, ahí convenía **poner el spec frente a devs** y dejar que el feedback dirigiera qué construir. *Por qué:* se construyó potencia (formatos custom, dark mode de 3 niveles) sin señal de que se usara.
2. **Ir a inglés desde el día 1, no el 27 de junio.** Se tradujo todo tarde (código de UI, docs, specs). *Por qué:* traducir 18 días de trabajo de golpe es más caro y arriesgado que escribir en inglés desde el arranque, si el objetivo siempre fue open source.
3. **Decidir la estructura "frame por sección" antes, no el 23 de junio.** El pivote de output llegó tras 2 semanas de construir sobre el modelo monolítico. *Por qué:* un prototipo de la estructura de salida en día 2 habría evitado reensamblar.
4. **Poner el typecheck gate el día 1, no el 29.** *Por qué:* una compuerta de tipos desde el inicio es casi gratis y evita arrastrar errores.
5. **Definir el scope mínimo publicable y congelarlo.** Faltó un "esto es v1, todo lo demás es v2". *Por qué:* sin esa línea, el proyecto tiende a agregar features buenas pero no esenciales.

Meta-aprendizaje: **el método fue excelente para ejecutar; faltó el mismo rigor para decidir *qué no hacer*.** Ponytail puro: la mitad del refinamiento fue oro, la otra mitad fue potencia sin usuario que la pidiera.

---

## 12. Banco de frases-semilla (para tweets)

- "508 commits, 75 PRs, 25 días. Pero la velocidad no vino de escribir rápido — vino de no escribir hasta tener el diseño y el plan de cada rebanada."
- "El handoff diseño→dev no se pierde por falta de datos. Se pierde porque documentar a mano es tan aburrido que nadie lo hace bien."
- "Sacar el dato de Figma fue lo fácil. Dibujarlo para que un humano lo entienda fue el 60% del trabajo."
- "Automatizá la transcripción, no el juicio. El plugin dibuja el spec; el diseñador decide si el componente merecía existir así."
- "Mi MVP publicable existió el día 4. Los otros 21 días fueron refinamiento — la mitad oro, la mitad potencia que nadie me pidió."
- "La pregunta ya no es '¿construyo un plugin?'. Es '¿qué parte debería ser código determinístico y qué parte delegar a un agente de Figma?'"
- "~220 tests sin mockear la API de Figma. El truco: separar el dato (puro, testeable) del dibujo (impuro, se valida a ojo)."
- "Si Figma lanza handoff nativo con agentes, extraer datos se vuelve commodity. El foso no es el dato — es la opinión sobre qué es un buen spec."
- "Figma anunció los generative plugins el 24-jun, justo mientras yo codeaba uno a mano. Lo que se prompt-ea son utilidades (ordená capas). El criterio de un buen handoff, todavía no."
- "Figma dice que los plugins clásicos no se van a ningún lado y que sigue invirtiendo en sus APIs. Construir un plugin dev de verdad no es un callejón sin salida: es la mitad determinística de un mundo híbrido con MCP."

## 13. Esqueleto de post LinkedIn (para desarrollar)

**Hook:** "Construí un plugin de Figma en 25 días que automatiza el handoff a desarrollo. Esto es lo que aprendí sobre por qué el handoff se rompe — y sobre cuándo NO deberías construir un plugin."

**Cuerpo (3-4 párrafos):**
1. El problema del handoff (inferencia cara y propensa a error) → el plugin convierte inferencia en documentación explícita.
2. El método que funcionó (diseño→plan→rebanada, puro/impuro, living docs) y el número (508 commits / 220 tests).
3. La lección incómoda (el MVP estuvo el día 4; construí de más sin validar) + la ética (automatizá la transcripción, no el juicio).
4. La pregunta abierta a la comunidad: con los agentes de Figma en 2026, ¿tiene sentido construir plugins deterministas o delegar en agentes? (invitar debate).

**CTA:** open source, MIT, link al repo.

---

## Apéndice — Fuentes de verdad
- Historial git: `git log` (508 commits, PRs #1–#75).
- Specs vivas: `specs/` (una página por feature).
- Arquitectura: `README.md` §Architecture + `specs/README.md`.
- Config 2026 (verificado 2026-07-04): [blog recap](https://www.figma.com/blog/config-2026-recap/) y [help center](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026).
