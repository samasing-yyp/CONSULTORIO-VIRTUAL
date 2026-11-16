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

/**
 * Ruta base del sitio (p. ej. «/CONSULTORIO-VIRTUAL/» en GitHub Pages).
 * Astro la fija al compilar, así que funciona igual en el servidor de
 * compilación y en el navegador.
 */
export const BASE = String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

/** Ruta absoluta (desde la raíz del dominio) de una página o recurso del sitio. */
export const url = (path = '') => BASE + String(path).replace(/^\.?\//, '');

/**
 * Rutas limpias por carpeta: cada página es <ruta>/index.html, así GitHub Pages
 * las sirve sin configuración. Las direcciones antiguas *.html se redirigen en
 * 404.html y las de /app/plantillas/?t=… en esa misma ruta.
 */
export const ROUTES = {
  home: '',
  precios: 'precios/',
  terminos: 'terminos/',
  ingresar: 'ingresar/',
  app: 'app/',
  plantillas: 'app/documentos/',
  documentos: 'app/documentos/',
  canales: 'app/canales/',
  salud: 'app/salud/',
  servicios: 'app/servicios-publicos/',
  transito: 'app/transito/',
};

/** URL del editor de una plantilla general (las minutas usan su área: ver data/catalog.js). */
export const templateUrl = (id) => url(`${ROUTES.documentos}${encodeURIComponent(id)}/`);

/** Ruta de un recurso dentro de public/assets/. */
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
