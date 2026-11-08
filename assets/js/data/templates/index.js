/**
 * Registro de plantillas. Para agregar una nueva: crea su archivo en esta
 * carpeta e impórtala aquí. El directorio, el generador y los planes la toman
 * automáticamente.
 */
import peticion from './derecho-peticion.js';
import comparendo from './prescripcion-comparendo.js';
import perdida from './perdida-documentos.js';
import denuncia from './denuncia-penal.js';
import tutela from './tutela.js';
import conciliacion from './conciliacion-alimentos.js';
import acta from './acta-accionista-unico.js';
import sas from './constitucion-sas.js';

export const TEMPLATES = [peticion, tutela, denuncia, perdida, comparendo, conciliacion, acta, sas];

export const CATEGORIES = {
  todas: 'Todas',
  peticiones: 'Peticiones',
  justicia: 'Justicia',
  documentos: 'Documentos',
  familia: 'Familia',
  empresa: 'Empresa',
};

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id);

/** Feature necesaria para usar una plantilla según su plan. */
export const featureFor = (t) => (t.plan === 'premium' ? 'templates.premium' : 'templates.basic');
