# AstroCV — dirección visual y prompt para CLI

## Dirección recomendada

**Editorial japonés retro sobre negro tinta**, inspirado en carteles tipográficos, impresión de pocas tintas, carátulas de casete y composición manga. El tema claro será una edición limpia sobre blanco; el oscuro será una edición gráfica, con personalidad de póster. Ambos presentan el mismo CV y los mismos componentes interactivos.

La referencia de Framer aporta escala tipográfica, bloques de color, separación por líneas e ilustración protagonista. Conviene adaptar esos recursos a la lectura de un CV, manteniendo navegación y desplazamiento convencionales.

### Lectura de las ocho referencias

| Referencia                       | Qué extraer                                                             | Dónde aplicarlo                                                 |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| Carteles geométricos japoneses   | Letras compactas, formas circulares, ritmo vertical y dos o tres tintas | Hero, encabezados y numeración de secciones                     |
| Espirales violetas               | Curvas repetidas y textura de tinta                                     | Un motivo abstracto del hero o detalle del Lab                  |
| Ilustración iridiscente de Luffy | Energía y destello multicolor sobre negro                               | Un borde o detalle de hover del Lab                             |
| Paleta naranja y violeta         | Contraste cálido/frío                                                   | Naranja principal y lavanda secundaria                          |
| Paleta crema, azul y naranja     | Base cromática más coherente para el CV                                 | Sistema general del tema oscuro                                 |
| Gyarados con olas                | Línea de grabado, composición enmarcada y color limitado                | Ilustración abstracta original; no usarlo como fondo de lectura |
| Póster de Mob                    | Retícula de viñetas, negro/crema y acento cálido                        | Composición de secciones y tarjetas del Lab                     |
| Casete con flores                | Microtipografía, etiquetas, líneas de registro y naranja                | Metadatos, badges y controles                                   |

Las imágenes son un moodboard. Evitar convertir la página en un collage de todas ellas o colocar ilustraciones detalladas detrás del texto profesional.

### Paleta propuesta

| Rol                   | Claro                 | Oscuro                             |
| --------------------- | --------------------- | ---------------------------------- |
| Fondo principal       | `#FFFFFF`             | `#111110`                          |
| Superficie secundaria | `#F7F7F5`             | `#1C1C1A`                          |
| Texto                 | `#172033`             | `#E8D8C9`                          |
| Texto secundario      | `#586174`             | `#BCB4AA`                          |
| Acento                | Conservar azul actual | `#F3701E`                          |
| Secundario gráfico    | Uso mínimo            | Azul `#4B607F` o lavanda `#A99ACB` |

Sobre naranja usar texto negro tinta: la combinación crema/naranja tiene poco contraste. El azul es un bloque gráfico secundario, no texto pequeño sobre negro. La paleta debe comprobarse también en estados hover, foco, selección y error.

## Hallazgos del repositorio

Revisión de `main`, commit `e9192cd7ac005e02a8b5fe065bb664b5cfd0b2e3`.

- `src/layouts/BaseLayout.astro` ya resuelve el tema antes del primer pintado mediante un script inline, `data-theme`, `data-theme-mode`, `localStorage` y `matchMedia`.
- `src/components/layout/Header.astro` ya contiene el botón claro/oscuro y Auto. El botón está deshabilitado mientras sigue el sistema. Hay que mejorar esta interacción, no crear un segundo sistema.
- `src/styles/global.css` ya tiene variables semánticas, pero también un bloque neumórfico para About, Experience, Projects, Skills y Education. Sus superficies grises y sombras dominan esas secciones. Cambiar solo `--color-surface` no basta.
- El selector de idioma define sombras y estados propios en `src/components/LanguageSelect/styles.css`; su panel tiene posicionamiento fijo y debe revisarse también fuera del contenedor del header.
- Conway y el reloj usan variables globales en buena parte de su CSS. Kanban usa variables `--mk-*` con dependencias en `--blog-*`, además de sombras internas y colores de estado propios.
- Hero y SectionHeading son componentes adecuados para añadir una composición editorial sin duplicar páginas.
- El contenido ya está separado en `src/data/en.json`, `src/data/es.json`, `src/data/portfolio.data.json` y su capa de lectura. El rediseño debe respetarlo.
- En la vista de escritorio inspeccionada se veía una barra de desplazamiento horizontal. Conviene localizar su causa durante la implementación, especialmente al introducir tipografía grande y revisar el ancho del header.

## Cómo usar el prompt

1. Descarga este archivo y colócalo en `docs/design/astrocv-theme-brief-and-cli-prompt.md` dentro de tu copia local del repositorio.
2. Copia las ocho imágenes a `docs/design/references/`. Pon nombres reconocibles, por ejemplo `01-japanese-posters.jpg`, `02-purple-spirals.jpg`, `03-iridescent.jpg`, `04-orange-purple.jpg`, `05-retro-palette.jpg`, `06-wave-print.jpg`, `07-manga-grid.jpg` y `08-cassette.jpg`.
3. Añade capturas de la referencia de Framer: hero, una sección interior y una vista móvil. Una URL por sí sola puede no permitirle a tu CLI inspeccionar el diseño.
4. Inicia tu CLI desde la raíz del repositorio y pega el prompt siguiente. Si permite adjuntar imágenes, adjunta también las referencias: leer nombres de archivos no equivale a verlas.
5. Pide una primera entrega con switch, tokens y hero para comprobar la dirección, seguida de las demás secciones. Si prefieres revisar por etapas, utiliza la instrucción alternativa al final.

## Prompt completo para pegar en la CLI

Actúa como frontend senior especializado en Astro, TypeScript, CSS, accesibilidad y dirección de arte editorial.

Trabaja sobre este proyecto existente: https://github.com/YoZaiKK/astroCV
Página publicada de referencia: https://my-cv-red-nine.vercel.app/
Referencia visual complementaria: https://unifiersofjapan.framer.website/

Quiero implementar dos temas completos para mi CV/portafolio. El tema claro debe tener fondo blanco y una presentación profesional limpia. Al activar el oscuro, toda la interfaz debe adoptar una estética editorial japonesa retro: negro tinta, crema, naranja, tipografía de póster, retícula visible y motivos geométricos originales.

El oscuro debe sentirse como una edición gráfica del mismo sitio. Cambia colores, tratamiento de superficies, bordes, sombras, tipografía de títulos y decoración; conserva el contenido, el orden de lectura, los destinos de navegación y el funcionamiento de los widgets.

### 1. Inspección inicial

Lee `AGENTS.md`, `package.json`, la configuración y el código actual antes de editar. Revisa el estado de Git y conserva los cambios locales del usuario. No cambies de framework ni actualices dependencias para hacer este rediseño.

Inspecciona especialmente:

- `src/layouts/BaseLayout.astro`.
- `src/styles/global.css`.
- `src/components/layout/Header.astro`.
- `src/components/sections/Hero.astro`, `Projects.astro` y las demás secciones.
- `src/components/ui/SectionHeading.astro`.
- `src/components/LanguageSelect/styles.css` y su controlador.
- `src/components/ConwaysLife/`.
- `src/components/ui/WorldClockCard.astro` y `world-clock.css`.
- `src/components/lab/mini-kanban/`.
- `src/data/en.json`, `es.json`, `portfolio.data.json` y la capa i18n.
- Las referencias visuales en `docs/design/references/` y este brief.

Estas rutas describen una revisión previa: comprueba su estado actual. Si no puedes visualizar las imágenes o acceder a la referencia externa, indícalo y usa la descripción y paleta del brief; no afirmes haber visto contenido inaccesible.

Resume los puntos de cambio y después implementa. No te quedes únicamente en un plan. Trabaja localmente, sin publicar, hacer push ni modificar servicios externos.

### 2. Dirección de arte

Tema claro:

- Fondo principal `#FFFFFF`, incluidas las áreas actualmente dominadas por gris azulado. Se permiten superficies secundarias casi blancas para organizar componentes.
- Mantén la legibilidad, la identidad profesional y el azul de interacción actual.
- Reduce el neumorfismo a detalles muy suaves donde resulte útil. El fondo general debe percibirse blanco.
- Evita convertirlo en una copia del tema oscuro con colores invertidos.

Tema oscuro:

- Fondo `#111110`, superficies `#1C1C1A`, texto `#E8D8C9`, secundario `#BCB4AA`, acento `#F3701E`.
- Azul `#4B607F` y lavanda `#A99ACB` solo en zonas gráficas pequeñas o detalles del Lab. No uses todos los acentos simultáneamente en cada tarjeta.
- Predominio de negro y crema. El naranja marca acciones, índices y algunos bloques de énfasis.
- Títulos grandes y compactos, sans serif pesada o condensada; párrafos con una sans legible. Usa como máximo dos familias, con fallbacks y sin bloquear la lectura mientras cargan. Comprueba las opciones que ya existan antes de añadir fuentes.
- Bordes de 1–2 px, esquinas de 0–8 px en paneles y sombras planas discretas si son necesarias. Los círculos del reloj y los controles que lo requieran conservan su forma.
- Elimina el relieve neumórfico y las sombras claras difusas en oscuro, también en inputs, dropdowns, columnas de Kanban y tableros.
- Añade numeración de secciones, pequeños metadatos y separadores como recursos editoriales.
- Usa textura de impresión muy sutil en áreas decorativas. Evita ruido detrás de párrafos y filtros costosos de pantalla completa.
- Extrae del moodboard la composición de póster, las curvas, las viñetas y el color limitado. La iridiscencia queda restringida a un detalle pequeño de hover/foco del Lab, con alternativa estática.
- No copies personajes, ilustraciones ni assets de Framer. Diseña un motivo propio con SVG/CSS: círculos, arcos, ondas o un monograma GC. No añadas caracteres japoneses de relleno.
- Mantén scroll nativo, navegación directa y lectura inmediata del CV.

### 3. Switch y estado del tema

Reutiliza el sistema actual basado en `html[data-theme='light'|'dark']`. No añadas estados de tema independientes en cada widget.

- Haz visible un switch compacto con sol/luna, accesible con teclado y con etiqueta traducida. Puedes usar `button role="switch"` con nombre estable y `aria-checked`; si usas otra semántica nativa equivalente, conserva una implementación consistente.
- El switch siempre debe poder accionarse. Si Auto está activo, un clic elige el tema contrario al resuelto y sale de Auto automáticamente.
- Conserva Auto como opción secundaria para seguir el sistema. Mientras esté activo, escucha cambios de `prefers-color-scheme`; una elección manual tiene prioridad.
- En la primera visita sin preferencia guardada, usa claro. Respeta valores existentes válidos `light`, `dark` y `system` en la clave `theme`; ignora valores inválidos.
- Mantén sincronizados el atributo raíz, el modo elegido, el switch, su estado accesible y Auto.
- Resuelve el tema mediante el script inline del head antes del primer pintado. Evita destellos del tema incorrecto y maneja errores de `localStorage`.
- Al cambiar entre `/` y `/es/`, conservar el tema y su modo. Mantener también la navegación con hash.
- Cambiar tema no debe recargar la página, reconstruir widgets ni borrar partidas, tareas, selección de ciudad o estado del menú.
- Si el proyecto usa navegación de cliente Astro, adapta la inicialización a su ciclo de vida sin duplicar listeners. No introduzcas ClientRouter solo para este cambio.
- Con JavaScript desactivado, entrega un tema claro legible y controles que no aparenten funcionar si no pueden hacerlo.

### 4. Organización de CSS

Define tokens semánticos para fondo, superficies, texto, bordes, acento, texto sobre acento, foco y estados. Añade tokens para radios, sombras y tipografía cuando resuelvan diferencias reales entre los temas.

Puedes separar tokens y estilos editoriales en archivos dentro de `src/styles/` si simplifica el proyecto. Migra o elimina las reglas antiguas que entren en conflicto: no acumules una cadena de overrides al final de `global.css` ni recurras a `!important` como solución general.

Revisa el bloque `--blog-*`, porque afecta a múltiples secciones, y enlázalo coherentemente a los tokens o sustitúyelo. Revisa `--mk-*`, las sombras del selector y los colores literales en tags, mensajes vacíos y estados.

Los estilos específicos de componente deben seguir viviendo junto al componente cuando corresponda. Respeta las reglas de estilos scoped/globales de Astro. No uses `filter: invert()`.

### 5. Cambios por componente

- **Header:** identidad compacta, navegación legible y controles de idioma, tema y descarga con el mismo tratamiento. Revisa el ancho disponible y adapta el breakpoint según el contenido real para evitar desbordamiento.
- **Hero:** en claro, portada limpia sobre blanco. En oscuro, nombre dominante en crema y composición de póster con un motivo geométrico propio en una zona lateral. En escritorio puede ser una retícula de texto y arte; en móvil apílala y reduce la decoración. El rol profesional, la propuesta de valor y ambos CTA deben seguir siendo visibles.
- **SectionHeading:** permite índice editorial decorativo y separador sin romper jerarquía de headings ni traducciones.
- **About:** lectura tranquila con principios separados por líneas o pequeños paneles gráficos.
- **Experience:** fecha y empresa como columna de metadatos; cargo y contribuciones en la columna principal. Usa espacio y líneas para organizar. Mantén todo el contenido profesional y una anchura cómoda de lectura.
- **Lab:** conserva los tres widgets operativos, presentados como pequeñas piezas de una exposición. Aplica patrones en marcos o cabeceras, nunca encima de controles o texto.
- **Conway:** tablero oscuro, celdas activas naranjas y estados de foco claramente diferenciados. Conserva edición, play, reset, random y tamaños.
- **Reloj:** esfera legible, marcas crema, segundero naranja y controles planos. No alteres la lógica horaria.
- **Kanban:** columnas delimitadas, tareas legibles y estado de arrastre, foco, error y completado distinguibles. Conserva persistencia, undo, reset, altas, borrado y movimiento mediante teclado/touch.
- **Skills:** clasificación editorial y etiquetas legibles; sin barras de progreso inventadas.
- **Education, Contact y Footer:** mismo sistema cromático; enlaces, correo y descarga comprobables.
- **Idioma:** adapta tanto el trigger como el panel flotante y los estados seleccionado/activo/foco. No cambies su comportamiento accesible ni su posicionamiento sin necesidad.

### 6. Movimiento y adaptación

Transiciones discretas de color/opacidad de unos 180–250 ms. Evita `transition: all`, reflow animado, animaciones infinitas, scroll secuestrado y efectos que tapen la lectura. Desactiva movimiento no esencial con `prefers-reduced-motion`.

Usa tipografía fluida con `clamp()` y tamaños mínimos legibles. Comprueba el nombre completo y los títulos largos en inglés y español. Los títulos no pueden recortarse para encajar en la estética. Conserva un único h1 y el orden semántico del documento.

Revisa 360, 390, 768, 1024 y 1440 px, además de zoom al 200 %. Localiza la causa de cualquier overflow; no lo escondas con `overflow-x: hidden` global.

El contraste debe alcanzar WCAG AA en texto y controles. Usa tinta oscura sobre naranja; no crema sobre naranja para texto normal. Los estados deben comunicarse con algo más que color. Los elementos decorativos tendrán `aria-hidden`, `pointer-events: none` y no provocarán saltos de layout. Mantén impresión legible sobre blanco.

### 7. Validación y entrega

Ejecuta los scripts existentes `npm test` y `npm run build` con la versión de Node requerida por el proyecto. Comprueba tipos si existe una herramienta configurada; no asumas que build equivale a un chequeo completo de TypeScript.

Añade comprobaciones útiles para la lógica modificada del tema: preferencia inexistente, valor guardado válido/inválido, storage bloqueado, salir de Auto con el switch y respetar una elección manual ante cambios del sistema. Usa la infraestructura existente cuando sea viable.

Si tienes navegador disponible, valida ambos idiomas en ambos temas, teclado/foco, recarga, cambio de idioma y estado de los widgets después de alternar tema. Comprueba especialmente dropdowns, tooltips, disabled, hover y arrastre. Captura claro y oscuro en escritorio y móvil para revisión. No afirmes comprobaciones visuales que no hayas podido realizar.

Entrega los cambios implementados, un resumen de archivos y decisiones, los comandos de validación con sus resultados y cualquier limitación real. Incluye capturas si pudiste producirlas. No inventes logros, experiencia, proyectos ni nuevas secciones de contenido.

## Alternativa para trabajar con revisión por etapas

Si quieres revisar la primera dirección antes de extenderla, añade al prompt:

> En esta primera entrega implementa únicamente los tokens, el comportamiento del switch y el hero de ambos temas. Deja una vista verificable y ejecuta las validaciones aplicables. Detente después para mi revisión; las otras secciones se implementarán en una segunda entrega.

## Fuentes consultadas

- Repositorio y código de `YoZaiKK/astroCV` en la revisión indicada.
- Página publicada del CV, inspeccionada visualmente.
- Unifiers of Japan, inspeccionado visualmente: https://unifiersofjapan.framer.website/
- Estilos en Astro: https://docs.astro.build/en/guides/styling/
- Ciclo de vida de navegación y transiciones en Astro: https://docs.astro.build/en/guides/view-transitions/
