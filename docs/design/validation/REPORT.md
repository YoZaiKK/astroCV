# Validación del rediseño editorial de AstroCV

Rediseño completado localmente a partir de `../upgradeToJapaneseStyle/CHECKPOINT.md`. Se conservó la implementación existente y el material original de `docs/design/`; no se aplicó el parche de recuperación.

La edición clara usa blanco y azul. La oscura usa negro tinta `#111110`, paneles `#1C1C1A`, crema `#E8D8C9` y naranja `#F3701E`, con títulos condensados, superficies planas y un póster SVG original. Ambas comparten contenido, rutas y widgets.

[Abrir galería local](index.html). Las capturas finales corresponden al build estático de producción en Chrome **156.0.8078.75**. Las fechas UTC de ejecución están en los JSON de resultados.

## Ajustes de esta continuación

- Corregida la impresión con el menú móvil abierto: la regla de navegación expandida ya no prevalece sobre el ocultamiento de navegación para impresión. También se cubre el fallback sin JavaScript.
- El botón de copiar correo se entrega deshabilitado y se habilita al inicializar su script. Sin JavaScript comunica que la acción no está disponible. Se conserva el enlace de correo y el texto seleccionable.
- Mejorado el formato de `SectionHeading.astro` y actualizado el README con la dirección visual actual y enlaces a la evidencia.
- Añadidos los scripts reproducibles y las capturas finales, sin dependencias nuevas.

## Archivos y decisiones del rediseño completo

| Archivos | Resultado |
| --- | --- |
| `src/styles/tokens.css`, `src/styles/global.css` | Tokens semánticos para ambos temas, composición de todas las secciones, adaptación y fallbacks de impresión/sin JS. Sin ocultamiento global del overflow ni reglas `!important`. |
| `src/components/layout/theme.ts`, `theme.test.ts`, `Header.astro`, `src/layouts/BaseLayout.astro` | Resolución antes del pintado y controles sincronizados mediante `data-theme`, `data-theme-mode` y `localStorage.theme`. Switch siempre operable al inicializar JS; salir de Auto produce una preferencia manual. |
| `Hero.astro`, `HeroArtwork.astro`, `SectionHeading.astro` | Hero con geometría propia, jerarquía tipográfica y numeración decorativa sin alterar los headings ni su orden. |
| `LanguageSelect/LanguageSelect.astro`, `LanguageSelect/styles.css` | Trigger, panel flotante y estados en ambos temas; enlaces reales de fallback sin JS. |
| `ConwaysLife/styles.css`, `ui/world-clock.css`, `lab/mini-kanban/mini-kanban.css`, `ui/LabCardIcons.astro` | Controles, tableros, tareas, tooltips, foco y estados coherentes con cada edición. El reloj conserva su esfera circular. |
| `sections/Contact.astro` | Disponibilidad real del botón de copia sin JS. |
| `package.json`, `README.md`, esta carpeta | Tests de tema incluidos en el comando existente; documentación, resultados y evidencia local. |

No se modificaron `src/data/`, `src/i18n/`, el lockfile ni los controladores de Conway, reloj y Kanban. Se mantuvieron las cadenas y traducciones existentes de los widgets, incluidas sus cadenas en inglés. No se añadieron fuentes remotas, frameworks ni ClientRouter.

## Resultados finales

| Validación | Resultado y evidencia |
| --- | --- |
| `npm test` | **21/21** pruebas; [salida](npm-test.log). |
| `npm run build` | Correcto; genera `/` y `/es/`; [salida](npm-build.log). |
| `git diff --check` | Código de salida **0**, sin errores de whitespace. Git avisa de conversión LF/CRLF en dos archivos; [salida](git-diff-check.log). |
| Presentación y accesibilidad en navegador | **28/28** comprobaciones, sin errores de página; [JSON](browser-results.json). |
| Interacciones en navegador | **47/47** comprobaciones, sin errores de página; [JSON](interaction-results.json). |
| Matriz responsive | **20 combinaciones**: EN/ES × claro/oscuro × 360, 390, 768, 1024 y 1440 CSS px. Sin overflow horizontal, elementos fuera del viewport ni headings recortados; un h1 y reloj 1:1. |

### Tema, navegación y estado

Se verificaron primera visita e inválidos en sistemas claros y oscuros, preferencias guardadas `light`, `dark`, `system`, storage bloqueado, cambios del SO en Auto y prioridad manual. Clic, Espacio y Enter sincronizan atributos raíz, `aria-checked`, Auto y persistencia. El nombre accesible permanece estable y traducido.

Se comprobó recarga y navegación real entre idiomas con `#projects`, en modo manual y Auto. Las pruebas se ejecutaron en contextos aislados: no borran ni alteran las tareas guardadas del navegador personal.

Al cambiar repetidamente el tema, tanto con el switch como mediante cambios del SO en Auto, se conservaron referencias a los custom elements, las 400 celdas, las tareas, el input, la navegación y el mismo `Document`. También se compararon tablero, tamaño, generación pausada, patrón, ciudad, tareas, borrador, Undo y menú abierto. Una simulación en ejecución siguió avanzando después del cambio de tema.

### Widgets y acciones

- **Conway:** Clear, rechazo de Play en tablero vacío, edición con teclado, Play/Pause, generaciones, Random, Reset y tamaños 20/30.
- **Reloj:** Tokio, CDMX y ubicación local; salida horaria contrastada con `Intl.DateTimeFormat`, selección y esfera 1:1.
- **Kanban:** validación de título vacío tras recortar espacios, alta, movimientos mediante Enter/Espacio y botones, reordenación, borrado, Undo, reset, recuperación del estado anterior y persistencia tras recarga. Arrastre real con ratón a otra columna y limpieza de sus estados. Tap emulado en ambos temas e idiomas.
- **Navegación/contacto:** anclas internas existentes, respuesta 200 y cabecera `%PDF` del CV real, copia de correo y mensaje de fallback cuando el portapapeles falla.

### Contraste y presentación

Se midió texto renderizado sobre sus fondos compuestos, excluyendo decoración SVG y controles deshabilitados. Se usó el umbral AA de 4.5:1 para texto normal y 3:1 para texto grande. No se detectaron fallos en reposo, panel de idioma abierto/activo, hover de acciones primarias/secundarias/borrado y input inválido.

| Medición | Claro | Oscuro |
| --- | --- | --- |
| Contraste mínimo de texto en reposo | 6.22:1 | 5.81:1 |
| Texto sobre acción primaria | 6.70:1 | 6.43:1 |
| Texto sobre acción primaria en hover | 9.56:1 | 8.40:1 |
| Mínimo del token de foco sobre las superficies medidas | 5.83:1 | 5.71:1 |
| Mínimo de borde de control sobre las superficies medidas | 3.02:1 | 3.90:1 |

Las mediciones por idioma y tema están en `*-contrast.json`. Se comprobaron tooltips y outline con foco en los tres widgets, panel y menú abiertos en los cinco anchos y ausencia de sombras calculadas en oscuro, incluidos pseudoelementos. Se revisaron las capturas completas y detalles de secciones, Lab y controles.

`prefers-reduced-motion` deja la duración en cero y el scroll en `auto`. La impresión usa fondo blanco, tinta oscura y navegación oculta incluso con el menú abierto; se generaron cuatro PDF. Sin JavaScript se mantiene claro aunque el SO sea oscuro, hay navegación e idiomas mediante enlaces, tema/copia/widgets deshabilitados y formulario/acciones de Kanban ocultos.

## Capturas

La [galería](index.html) enlaza las ocho páginas completas y sus vistas de Lab, controles y cada sección a **390 y 1440 px**, en ambos idiomas y temas. Incluye también los PDF, las vistas sin JS y los JSON.

Los temas se establecieron mediante preferencias guardadas válidas; se esperaron al menos 300 ms tras cambios para terminar las transiciones. Las vistas completas conservan el header. Solo las capturas aisladas por sección vuelven el header estático y ocultan el enlace de salto fuera de pantalla para evitar artefactos de captura de elementos fijos en Chrome; esto no modifica el sitio. `references.png` es una hoja de contacto de las doce referencias originales.

## Reproducción

```powershell
npm test
npm run build
git diff --check

# Usa una instalación de Playwright ya disponible, sin instalar dependencias aquí.
$env:PLAYWRIGHT_PATH = 'C:/Users/memoc/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright'
node docs/design/validation/run.cjs
node docs/design/validation/evidence.cjs
```

`run.cjs` sirve `dist/` temporalmente en un puerto local, ejecuta los dos scripts y cierra su servidor. Puede ejecutarse un grupo por separado: `node docs/design/validation/run.cjs browser.cjs` o `node docs/design/validation/run.cjs interactions.cjs`. Los scripts aceptan `PLAYWRIGHT_PATH`; la ruta de caché usada en esta máquina puede desaparecer. Requieren Chrome instalado.

El servidor de desarrollo que ya estaba disponible en `http://localhost:4321` se conservó. Para iniciar uno nuevo, seguir `AGENTS.md`: `npm run dev -- --background`, y administrar con `npm run dev -- status`, `logs` y `stop`.

## Límites de las comprobaciones

- No hay herramienta de chequeo completo de tipos configurada ni binario `tsc` instalado. El build y su generación de tipos no equivalen a un typecheck completo.
- El 200% se comprobó mediante un viewport de **720 CSS px**, equivalente al reflow de una pantalla de 1440 px con ese zoom. No se automatizó el zoom de la interfaz de Chrome.
- Se usó Chrome de escritorio con emulación de touch; no se probaron dispositivos físicos, Safari, Firefox ni lectores de pantalla. Las comprobaciones de foco, semántica y contraste no constituyen una auditoría completa de accesibilidad.
- Se conservaron los destinos de los enlaces externos y se validaron las anclas internas y el PDF local. No se realizaron comprobaciones de disponibilidad de servicios externos.

Todo permanece local, sin commits, push ni publicación.
