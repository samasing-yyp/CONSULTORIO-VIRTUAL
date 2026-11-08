/**
 * Configuración central del sitio.
 * Todo lo que dependa de rutas, planes o del catálogo de herramientas vive aquí,
 * para que agregar páginas o herramientas nuevas no obligue a tocar componentes.
 */

export const APP = {
  name: 'Consultoría Digital',
  tagline: 'Herramientas legales claras para Colombia',
  version: '0.1.0-draft',
  contactEmail: 'contacto@consultoriadigital.co', // placeholder
};

/** Raíz del sitio, calculada desde este archivo (assets/js/core/config.js). */
export const ROOT = new URL('../../../', import.meta.url);

/** Devuelve la URL absoluta de una ruta relativa a la raíz del sitio. */
export const url = (path = '') => new URL(path, ROOT).href;

/**
 * Rutas limpias por carpeta: cada página es <ruta>/index.html, así cualquier
 * servidor estático (GitHub Pages, Netlify, python -m http.server) las sirve
 * sin configuración. Las direcciones antiguas *.html se redirigen en 404.html.
 */
export const ROUTES = {
  home: './',
  precios: 'precios/',
  terminos: 'terminos/',
  ingresar: 'ingresar/',
  app: 'app/',
  plantillas: 'app/plantillas/',
  canales: 'app/canales/',
};

/** Enlace a una plantilla concreta del generador. */
export const templateUrl = (id) => `${url(ROUTES.plantillas)}?t=${encodeURIComponent(id)}`;

/** URL absoluta de un recurso dentro de assets/. */
export const asset = (path) => url(`assets/${path}`);

/**
 * Planes y las funciones (features) que habilita cada uno.
 * auth.hasFeature('x') consulta esta tabla.
 */
export const PLANS = {
  basico: {
    id: 'basico',
    label: 'Básico',
    price: '$0',
    period: 'para siempre',
    features: ['channels', 'templates.basic'],
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    price: '$00.000',
    period: 'COP / mes',
    features: ['channels', 'templates.basic', 'templates.premium', 'drafts'],
  },
};

/** Registro de herramientas del directorio. status: 'activo' | 'pronto'. */
export const TOOLS = [
  {
    id: 'plantillas',
    title: 'Documentos con plantilla',
    desc: 'Llena un formulario guiado, mira el documento en vivo y descárgalo en PDF listo para radicar.',
    icon: 'edit_document',
    tone: '',
    route: ROUTES.plantillas,
    status: 'activo',
  },
  {
    id: 'canales',
    title: 'Canales oficiales',
    desc: 'Encuentra la página oficial correcta para cada trámite: antecedentes, denuncias, tutelas y más.',
    icon: 'travel_explore',
    tone: 'sun',
    route: ROUTES.canales,
    status: 'activo',
  },
  {
    id: 'plazos',
    title: 'Calculadora de plazos',
    desc: 'Cuenta días hábiles para saber si una entidad ya debió responderte.',
    icon: 'event_available',
    tone: 'mint',
    status: 'pronto',
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento de trámites',
    desc: 'Guarda radicados y recibe recordatorios de vencimiento.',
    icon: 'timeline',
    tone: 'rose',
    status: 'pronto',
  },
  {
    id: 'guias',
    title: 'Guías paso a paso',
    desc: 'Explicaciones en lenguaje sencillo sobre tus derechos y cómo ejercerlos.',
    icon: 'menu_book',
    tone: 'lilac',
    status: 'pronto',
  },
];
