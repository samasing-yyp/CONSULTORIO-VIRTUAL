/**
 * Registro de minutas importadas (salud, servicios públicos y tránsito).
 * El índice es liviano; el contenido de cada minuta se carga solo en su página
 * (import.meta.glob crea un archivo aparte por minuta al compilar).
 */
import salud from './salud/index.js';
import servicios from './servicios/index.js';
import transito from './transito/index.js';
import { getArea } from '../areas.js';
import { adaptMinuta } from '../../tools/minuta-adapter.js';
import { url } from '../../core/config.js';

const LOADERS = import.meta.glob(['./*/*.js', '!./*/index.js']);

export const MINUTAS = [...salud, ...servicios, ...transito].map((m) => {
  const area = getArea(m.area);
  return {
    ...m,
    plan: m.plan || 'basico',
    category: m.area,
    icon: area?.icon || 'description',
    tone: area?.tone || '',
    summary: m.summary || '',
    href: url(`${area.route}${m.slug}/`),
    minuta: true,
  };
});

export const minutasOf = (areaId) => MINUTAS.filter((m) => m.area === areaId);
export const getMinutaMeta = (id) => MINUTAS.find((m) => m.id === id);

const cache = new Map();
/** Carga el contenido de una minuta y lo convierte en plantilla del generador. */
export async function loadMinuta(id) {
  const meta = getMinutaMeta(id);
  if (!meta) return null;
  if (!cache.has(id)) {
    const load = LOADERS[`./${meta.area}/${meta.code.toLowerCase()}.js`];
    const mod = await load();
    cache.set(id, adaptMinuta(meta, mod.default));
  }
  return cache.get(id);
}
