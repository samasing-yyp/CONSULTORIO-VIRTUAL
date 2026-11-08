# Consultoría Digital — draft funcional

Directorio de herramientas legales colombianas para personas que no pueden pagar un abogado.
**No es un canal oficial de trámites:** el sitio lo recuerda en cada página y siempre enlaza a la entidad correspondiente.

Sitio 100 % estático: HTML, CSS y JavaScript nativo con módulos ES. No necesita servidor de aplicación ni compilación.

## Cómo abrirlo

Los módulos ES no funcionan con doble clic (`file://`), así que se sirve con cualquier servidor estático:

```bash
python -m http.server 5173
```

Luego abre <http://localhost:5173>. También sirve la extensión Live Server de VS Code.

### Publicar en GitHub Pages

Sube la carpeta a un repositorio y activa **Settings → Pages → Deploy from a branch** (`main`, carpeta `/ (root)`). No requiere configuración: las rutas se calculan desde la ubicación de los archivos, así que funciona en `https://usuario.github.io/repositorio/`. El archivo `.nojekyll` evita el procesamiento de Jekyll y `404.html` se usa automáticamente para direcciones inexistentes.

## Rutas

Cada página es una carpeta con su `index.html`, lo que da URLs limpias en cualquier servidor estático:

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/precios/` | Precios |
| `/terminos/` | Términos y condiciones |
| `/ingresar/` | Ingresar (acepta `?plan=` y `?next=`) |
| `/app/` | Directorio (requiere sesión) |
| `/app/plantillas/` | Galería; `?t=tutela` abre una plantilla |
| `/app/canales/` | Buscador; acepta `?q=` y `?cat=` |

- **Una sola fuente de rutas:** `ROUTES`, `url()`, `templateUrl()` y `asset()` en `assets/js/core/config.js`.
- **Guardián de sesión:** `assets/js/boot.js` (síncrono, en el `<head>`). Las páginas con `<html data-auth="required">` redirigen a `/ingresar/?next=…` antes de cargar nada más; al iniciar sesión se vuelve a la página exacta, con su consulta. Si ya hay sesión, Ingresar redirige solo.
- **Precarga:** `boot.js` agrega Speculation Rules (Chrome/Edge precargan la página al pasar el cursor) y, en otros navegadores, `<link rel="prefetch">` al pasar el cursor o tocar. Se desactiva con ahorro de datos.
- **Transiciones:** View Transitions entre páginas (fundido, encabezado fijo), solo con CSS; se desactivan con «reducir movimiento».
- **Direcciones antiguas:** `404.html` redirige `precios.html`, `app/plantillas.html?t=…`, etc. a la ruta limpia equivalente.

### Usuarios de demostración

| Plan | Correo | Contraseña |
|---|---|---|
| Básico | `basico@demo.co` | `demo1234` |
| Premium | `premium@demo.co` | `demo1234` |

En la página **Ingresar** también hay botones de acceso directo. La sesión es simulada (almacenamiento local, 8 horas); `assets/js/core/auth.js` expone la interfaz (`login`, `logout`, `currentUser`, `requireAuth`, `hasFeature`) que se mantendrá al conectar un backend real.

## Qué incluye

**Páginas públicas:** Home (hero con campo de partículas en canvas), Precios (Básico y Premium, con textos de relleno), Términos (habeas data, uso de datos, alojamiento de archivos, con textos de relleno) e Ingresar.

**Directorio (requiere sesión):**

1. **Plantillas con vista previa en vivo y PDF.** Asistente por pasos, vacíos resaltados, campo activo iluminado en el documento, validación, descarga con nombre `tipo_nombre_AAAA-MM-DD.pdf` y pantalla de «despacho» (anexos y canal oficial donde radicar).
   - Básico: derecho de petición, prescripción de comparendo, pérdida de documentos y denuncia penal.
   - Premium: acción de tutela (petición, salud, pensión y laboral; agente oficioso y medida provisional), conciliación de cuota alimentaria, acta de accionista único SAS y constitución de SAS.
   - Funciones propias: calculadora de días hábiles con festivos colombianos, «Convertir en tutela» desde una petición vencida, montos en letras, validador de capital de la SAS y borradores automáticos (Premium).
2. **Buscador de canales oficiales.** 27 canales verificados, búsqueda sin tildes y con sinónimos («pasado judicial», «abogado gratis»), filtros por tema y logos institucionales.

## Estructura

```
index.html, 404.html, .nojekyll
precios/ terminos/ ingresar/   index.html de cada página pública
app/                      index.html (directorio), plantillas/, canales/
assets/css/               tokens.css, base.css, components.css, pages/*.css
assets/js/boot.js         arranque: preferencias, guardián de sesión, precarga
assets/js/core/           config (rutas), storage, auth, drafts, ui
assets/js/components/     <site-header>, <app-header>, <site-footer>, <app-notice>
assets/js/data/           users, channels, legal-clauses, templates/*
assets/js/tools/          template-engine, legal-utils, plantillas, canales
assets/js/fx/             hero-field (canvas)
assets/vendor/            jsPDF 2.5.2 (local)
assets/img/logos/         logos de entidades
tools/icons.mjs           genera el subconjunto de Material Symbols
tools/check-links.mjs     verifica rutas, imports y logos (mayúsculas exactas)
```

## Cómo ampliarlo

- **Nueva plantilla:** crea `assets/js/data/templates/mi-plantilla.js` (copia una existente) y regístrala en `templates/index.js`. Declara `steps` (campos), `computed`, `document` (bloques con `**negrita**` y `{{campo}}`), `guide`, `despacho` y `channels`. La vista previa y el PDF salen del mismo modelo.
- **Nuevo canal oficial:** agrega un objeto en `assets/js/data/channels.js`. Si no hay logo, se muestra una insignia con la sigla.
- **Nueva página:** crea `carpeta/index.html` (copia una existente y ajusta los `../`), agrega su ruta a `ROUTES` y pon `data-auth="required"` en `<html>` si exige sesión.
- **Nueva herramienta del directorio:** agrégala a `TOOLS` en `assets/js/core/config.js`.
- **Antes de publicar:** ejecuta `node tools/check-links.mjs`; falla si alguna ruta no existe o no coincide en mayúsculas.
- **Íconos:** después de usar un ícono nuevo de Material Symbols, ejecuta `node tools/icons.mjs` para actualizar el subconjunto que se descarga de Google Fonts.

## Fuentes estudiadas para las plantillas

Las plantillas se redactaron de nuevo a partir de la estructura de:
Wonder Legal (tutela por derecho de petición), Cámara de Comercio de Bucaramanga / Cámara Directa (acta de accionista único, constitución SAS), Personería de Girón (petición, denuncia, tutela de salud, conciliación de alimentos, prescripción de comparendo), ICBF formato F5.P11.GJ (procedencia de la tutela contra particulares) y Lexivox (formato de tutela 2026).

**Nota:** desde 2022 la Policía Nacional ya no expide la «constancia de pérdida de documentos» en línea; según el artículo 30 del Decreto Ley 019 de 2012 basta la declaración bajo juramento. La plantilla de pérdida de documentos se ajustó a eso.

## Pendiente para la siguiente fase

- Sistema real de cuentas, sesión y almacenamiento (hoy todo vive en el navegador).
- Textos definitivos de Home, Precios y Términos.
- Revisión jurídica de las plantillas por un abogado.
- Logos faltantes (Policía, Registraduría, RUNT, DIAN y otros usan insignia con sigla).
