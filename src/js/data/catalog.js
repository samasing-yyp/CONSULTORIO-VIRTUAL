/**
 * Catálogo único de documentos: las plantillas generales y las minutas por área,
 * cada una con su URL. Lo usan las páginas al compilar (rutas y tarjetas) y los
 * scripts del navegador (galería, directorio, redirecciones).
 */
import { TEMPLATES, CATEGORIES, featureFor } from './templates/index.js';
import { MINUTAS } from './minutas/registry.js';
import { templateUrl } from '../core/config.js';

/** Datos de una plantilla general que se pueden mostrar en una tarjeta. */
const cardOf = (t) => ({
  id: t.id,
  title: t.title,
  summary: t.summary,
  icon: t.icon,
  tone: t.tone,
  plan: t.plan,
  category: t.category,
  situation: '',
  entity: '',
  que: t.guide?.que || '',
  href: templateUrl(t.id),
});

export const GENERAL = TEMPLATES.map(cardOf);
export const DOCS = [...GENERAL, ...MINUTAS.map((m) => ({ ...m, que: m.summary }))];

export const docById = (id) => DOCS.find((d) => d.id === id);
export const hrefOf = (id) => docById(id)?.href;
export { CATEGORIES, featureFor };
