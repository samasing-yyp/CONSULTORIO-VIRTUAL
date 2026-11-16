# Consultoría Digital — draft funcional

Directorio de herramientas legales colombianas para personas que no pueden pagar un abogado.
**No es un canal oficial de trámites:** el sitio lo recuerda en cada página y siempre enlaza a la entidad correspondiente.

Sitio **estático generado con [Astro](https://astro.build)**. Node.js solo se usa para compilar: `npm run build` produce la carpeta `dist/` con HTML, CSS y JavaScript planos, que GitHub Pages sirve tal cual. En producción no corre ningún servidor Node.

## Cómo trabajar en el sitio

Requisito: Node.js 22.23 o superior (solo en tu equipo, para compilar).

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:4321/CONSULTORIO-VIRTUAL/>. La página se recarga sola al guardar.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vista previa con recarga automática mientras editas |
| `npm run build` | Genera `dist/`: antes actualiza los íconos y después verifica todos los enlaces |
| `npm run preview` | Sirve `dist/` igual que GitHub Pages, para revisar antes de publicar |
| `npm run check` | Revisa las plantillas `.astro` |
| `npm run minutas` | Vuelve a importar las minutas `.docx` (ver más abajo) |

### Publicar en GitHub Pages

1. Una sola vez: en el repositorio, **Settings → Pages → Source: GitHub Actions**.
2. Cada push a `main` ejecuta `.github/workflows/deploy.yml`, que compila con Node en GitHub y publica `dist/` en <https://samasing-yyp.github.io/CONSULTORIO-VIRTUAL/>.

El `base` del sitio (`/CONSULTORIO-VIRTUAL/`) lo toma el flujo de la configuración de Pages. Si algún día usas un dominio propio, el sitio pasa a la raíz sin cambiar código.

## Rutas

Cada página es una carpeta con su `index.html` dentro de `dist/`. Las 93 minutas y las 8 plantillas generales tienen URL propia.

| Ruta | Página | Acceso |
|---|---|---|
| `/` · `/precios/` · `/terminos/` · `/ingresar/` | Páginas públicas (Ingresar acepta `?plan=` y `?next=`) | Público |
| `/app/` | Directorio | Con sesión |
| `/app/documentos/` | Galería de los 101 documentos; acepta `?q=` y `?area=` | Con sesión |
| `/app/documentos/<id>/` | Editor de una plantilla general (p. ej. `/app/documentos/tutela/`) | Con sesión |
| `/app/salud/` · `/app/servicios-publicos/` · `/app/transito/` | Sección de cada área | Con sesión |
| `/app/<área>/<slug>/` | Editor de una minuta (p. ej. `/app/salud/tratamiento-integral/`) | Con sesión |
| `/app/canales/` | Buscador de canales oficiales; acepta `?q=` y `?cat=` | Con sesión |
| `/app/plantillas/?t=<id>` | Ruta antigua: redirige a la URL nueva del documento | — |

- **Una sola fuente de rutas:** `ROUTES`, `url()`, `templateUrl()` y `asset()` en `src/js/core/config.js` (usan `import.meta.env.BASE_URL`). Las URLs de las minutas salen de su `slug` (`src/js/data/minutas/registry.js`) y el catálogo completo está en `src/js/data/catalog.js`.
- **Contenido en el HTML:** las secciones de área, la galería, el directorio y los canales se generan al compilar; en el navegador solo corren la búsqueda, los filtros y lo que depende de la persona (nombre, plan, borradores).
- **Guardián de sesión:** `public/assets/js/boot.js` (síncrono, en el `<head>`). Las páginas de `/app/` redirigen a `/ingresar/?next=…` antes de cargar nada más; al ingresar se vuelve a la página exacta. Todas llevan `noindex`.
- **Precarga y transiciones:** `boot.js` agrega Speculation Rules (o `<link rel="prefetch">`) y las páginas usan View Transitions solo con CSS.
- **Direcciones antiguas:** `404.html` redirige `precios.html`, `app/plantillas.html?t=…`, etc. a la ruta nueva.

### Usuarios de demostración

| Plan | Correo | Contraseña |
|---|---|---|
| Básico | `basico@demo.co` | `demo1234` |
| Premium | `premium@demo.co` | `demo1234` |

En la página **Ingresar** también hay botones de acceso directo. La sesión es simulada (almacenamiento local, 8 horas). `src/js/core/auth.js` expone la interfaz (`login`, `logout`, `currentUser`, `requireAuth`, `hasFeature`) que se mantendrá al conectar un backend real.

## Qué incluye

**Páginas públicas:** Home (hero con campo de partículas en canvas), Precios (Básico y Premium, con textos de relleno), Términos (habeas data, uso de datos, alojamiento de archivos, con textos de relleno) e Ingresar.

**Directorio (requiere sesión):**

1. **Plantillas con vista previa en vivo y PDF.** Asistente por pasos, vacíos resaltados, campo activo iluminado en el documento, validación, descarga con nombre `tipo_nombre_AAAA-MM-DD.pdf` y pantalla de «despacho» (anexos y canal oficial donde radicar).
   - Básico: derecho de petición, prescripción de comparendo, pérdida de documentos y denuncia penal.
   - Premium: acción de tutela (petición, salud, pensión y laboral; agente oficioso y medida provisional), conciliación de cuota alimentaria, acta de accionista único SAS y constitución de SAS.
   - Funciones propias: calculadora de días hábiles con festivos colombianos, «Convertir en tutela» desde una petición vencida, montos en letras, validador de capital de la SAS y borradores automáticos (Premium).
2. **Buscador de canales oficiales.** 41 canales verificados, búsqueda sin tildes y con sinónimos («pasado judicial», «abogado gratis»), filtros por tema y logos institucionales.

## Minutas por área (salud, servicios públicos y tránsito)

Las 93 minutas de `.assets to learn/` (37 de salud, 23 de servicios públicos y 33 de tránsito) están integradas al generador. Cada una se llena en el navegador con vista previa en vivo y se descarga en PDF, como las demás plantillas.

- **Secciones dedicadas:** cada área tiene una página con «¿Qué te pasó?» (situaciones en lenguaje cotidiano que abren su minuta), ruta recomendada, plazos clave, normas y advertencias, entidades relacionadas y casos que requieren abogado. El contenido sale de las guías internas de cada área y está en `src/js/data/areas.js`.
- **Importador:** `tools/import_minutas.py` lee los `.docx` y genera `src/js/data/minutas/<área>/<código>.js` más un índice liviano por área (con el `slug` de su URL). Reconoce las convenciones de las minutas:

  | En la minuta | En el formulario |
  |---|---|
  | `XXX` | Campo, con etiqueta deducida del texto y el fragmento del documento como ayuda |
  | `(a / b / c)` | Selector de opciones |
  | `XXX (pista / pista)` | Campo con ejemplo |
  | `(Si aplica)` | Interruptor «Incluir» |
  | `(Escoja…)` con a), b), c) | Elección de uno o varios supuestos |
  | `(o: alternativa)` | Elección entre dos redacciones |
  | `[VERIFICAR …]` | Aviso «Antes de radicar, verifica» (no sale en el PDF) |
  | Fecha, «Yo, XXX, mayor de edad…», notificaciones y firma | Datos de la persona (se escriben una sola vez) |

  Los títulos, la situación, la entidad, la etapa, el plan y los canales de cada minuta se curan en `tools/minutas_meta.json`. Si cambias o agregas minutas:

  ```bash
  python tools/import_minutas.py
  ```

  Con `--report` imprime la lista de campos de cada minuta para revisar las etiquetas. Cuando hay dos versiones del mismo archivo (`… (1).docx`), se toma la marcada con número, que es la corregida.

## Mejoras del llenado

- **Concordancia de género:** cada persona elige cómo nombrarla: femenino («identificada»), masculino («identificado»), no binario con lenguaje neutro («identificade») o sin indicar (forma doble «identificado(a)»). En las plantillas se escribe `{{g:identificado(a)}}`, `{{g:el|la|le}}` o, para otra persona, `{{g@af_:afiliado(a)}}`.
- **«Mis datos»:** el interruptor «Recordar mis datos en este dispositivo» guarda nombre, documento, género y contacto para llenar automáticamente los siguientes documentos. Se borra al desactivarlo.
- **Condiciones en el texto:** `[[campo|texto]]`, `[[campo=valor|texto]]`, `[[lista~valor|texto]]` y combinaciones con `&`, también anidadas; `if` en bloques, renglones y elementos de lista.
- **Ayuda con contexto:** cada campo de minuta muestra el fragmento del documento donde va, y al enfocarlo se resalta en la vista previa.
- **Documentos confidenciales** (interrupción voluntaria del embarazo): no se guardan como borrador ni usan «Mis datos».
- **Tablas** en la vista previa y en el PDF.

## Estructura

```
astro.config.mjs          base, site y salida estática
package.json              Astro 7.4.4 y scripts (dev, build, preview, check, minutas)
.github/workflows/        deploy.yml: compila y publica en GitHub Pages
public/                   se copia tal cual: assets/js/boot.js, assets/img (favicon, logos), assets/vendor (jsPDF 2.5.2), .nojekyll
src/pages/                una página por ruta (index, precios, terminos, ingresar, 404, app/…)
src/layouts/              BaseLayout (head común), PublicLayout, AppLayout (sesión + noindex)
src/components/           Header, AppHeader, Footer, AppNotice, DocCard, ChannelCard, EditorShell, Icon, BrandMark
src/styles/               tokens.css, base.css, components.css, pages/*.css
src/scripts/chrome.js     menú, tamaño de texto, cerrar sesión, nombre y plan, candados Premium
src/js/core/              config (rutas), storage, auth, drafts, profile, ui
src/js/data/              users, channels, areas, catalog, legal-clauses, templates/*, minutas/<área>/*, icon-names.json
src/js/tools/             template-engine, minuta-adapter, legal-utils, editor, canales
src/js/pages/             scripts de página: home, ingresar, terminos, app-home, gallery, area
src/js/fx/                hero-field (canvas)
tools/icons.mjs           genera el subconjunto de Material Symbols (antes de cada build)
tools/check-links.mjs     verifica dist/: enlaces, mayúsculas exactas, sin .docx, noindex en /app/ (después de cada build)
tools/import_minutas.py   convierte las minutas .docx en plantillas del generador
tools/minutas_meta.json   títulos, situaciones, entidades, plan, canales y slug de cada minuta
```

La carpeta `.assets to learn/` (minutas `.docx` originales) está en `.gitignore`: queda solo en tu equipo y no llega a GitHub ni al sitio.

## Cómo ampliarlo

- **Nueva plantilla general:** crea `src/js/data/templates/mi-plantilla.js` (copia una existente) y regístrala en `templates/index.js`. Su página `/app/documentos/<id>/` se genera sola.
- **Nueva minuta:** pon el `.docx` en `.assets to learn/<área>/`, agrega su entrada en `tools/minutas_meta.json` y ejecuta `npm run minutas`. Su página `/app/<área>/<slug>/` se genera sola.
- **Nuevo canal oficial:** agrega un objeto en `src/js/data/channels.js`. Si no hay logo, se muestra una insignia con la sigla.
- **Nueva página:** crea `src/pages/<ruta>.astro` con `PublicLayout` o `AppLayout` (este último exige sesión) y agrega su ruta a `ROUTES`.
- **Nueva herramienta del directorio:** agrégala a `TOOLS` en `src/js/core/config.js`.
- **Íconos:** usa `<Icon name="…" />` en `.astro` o `ms('…')` en JS; `npm run build` actualiza solo el subconjunto que se descarga de Google Fonts.

## Fuentes estudiadas para las plantillas

Las plantillas se redactaron de nuevo a partir de la estructura de:
Wonder Legal (tutela por derecho de petición), Cámara de Comercio de Bucaramanga / Cámara Directa (acta de accionista único, constitución SAS), Personería de Girón (petición, denuncia, tutela de salud, conciliación de alimentos, prescripción de comparendo), ICBF formato F5.P11.GJ (procedencia de la tutela contra particulares) y Lexivox (formato de tutela 2026).

**Nota:** desde 2022 la Policía Nacional ya no expide la «constancia de pérdida de documentos» en línea; según el artículo 30 del Decreto Ley 019 de 2012 basta la declaración bajo juramento. La plantilla de pérdida de documentos se ajustó a eso.

## Pendiente para la siguiente fase

- Revisar con un abogado las etiquetas de campo de las minutas (`--report`) y las notas «Verificar» que traen las propias minutas.
- Las guías y algunas minutas mencionan prestadores de Cúcuta; las secciones del sitio se escribieron para todo el país.

- Sistema real de cuentas, sesión y almacenamiento (hoy todo vive en el navegador).
- Textos definitivos de Home, Precios y Términos.
- Revisión jurídica de las plantillas por un abogado.
- Logos faltantes (Policía, Registraduría, RUNT, DIAN y otros usan insignia con sigla).
