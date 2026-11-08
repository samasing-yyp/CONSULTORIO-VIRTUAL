/**
 * Piezas reutilizables entre plantillas: campos de identificación,
 * cláusulas frecuentes, notificaciones y firma.
 * Redacción propia; las citas normativas son de dominio público.
 */
import { fechaLarga, today, isoDate } from '../tools/legal-utils.js';

export const TIPOS_DOC = [
  { value: 'cédula de ciudadanía', label: 'Cédula de ciudadanía', abbr: 'C.C.' },
  { value: 'cédula de extranjería', label: 'Cédula de extranjería', abbr: 'C.E.' },
  { value: 'Permiso por Protección Temporal', label: 'Permiso por Protección Temporal (PPT)', abbr: 'PPT' },
  { value: 'pasaporte', label: 'Pasaporte', abbr: 'Pasaporte' },
  { value: 'tarjeta de identidad', label: 'Tarjeta de identidad', abbr: 'T.I.' },
  { value: 'registro civil de nacimiento', label: 'Registro civil de nacimiento', abbr: 'R.C.' },
];
export const docAbbr = (tipo) => TIPOS_DOC.find((t) => t.value === tipo)?.abbr || 'C.C.';

/**
 * Campos de una persona. `p` es el prefijo de los ids ('' para quien firma).
 * opts: { who: 'tu' | 'la persona', expedicion, contacto, ciudad }
 */
export function personaFields(p = '', opts = {}) {
  const tu = opts.who !== 'tercero';
  const list = [
    { id: `${p}nombre`, type: 'text', label: tu ? 'Tu nombre completo' : 'Nombre completo', short: 'nombre completo', required: opts.required !== false, autocomplete: tu ? 'name' : 'off', placeholder: 'Como aparece en el documento' },
    { id: `${p}tipoDoc`, type: 'select', label: 'Tipo de documento', options: (opts.docs || TIPOS_DOC.slice(0, 4)).map(({ value, label }) => ({ value, label })), default: 'cédula de ciudadanía', half: true },
    { id: `${p}numDoc`, type: 'text', label: 'Número de documento', short: 'número de documento', required: opts.required !== false, inputmode: 'numeric', half: true },
  ];
  if (opts.expedicion !== false) {
    list.push({ id: `${p}expedicion`, type: 'text', label: 'Lugar de expedición del documento', short: 'lugar de expedición', placeholder: 'Ej.: Bogotá D.C.', help: 'Aparece en tu cédula. Si no lo sabes, puedes dejarlo vacío.' });
  }
  if (opts.ciudad !== false) {
    list.push({ id: `${p}ciudad`, type: 'text', label: tu ? 'Ciudad donde vives' : 'Ciudad', short: 'ciudad', required: opts.required !== false, placeholder: 'Ej.: Medellín', half: true });
  }
  if (opts.contacto !== false) {
    list.push(
      { id: `${p}direccion`, type: 'text', label: 'Dirección', short: 'dirección', required: opts.required !== false && opts.direccionRequired !== false, placeholder: 'Calle, número, barrio', half: true },
      { id: `${p}telefono`, type: 'tel', label: 'Teléfono o celular', short: 'teléfono', inputmode: 'tel', half: true },
      { id: `${p}email`, type: 'email', label: 'Correo electrónico', short: 'correo electrónico', inputmode: 'email', half: true, help: tu ? 'Las entidades pueden responderte por este medio.' : undefined },
    );
  }
  return list;
}

/** "Laura Gómez, mayor de edad, identificada con cédula de ciudadanía No. 123 expedida en Bogotá" */
export function identificacion(v, p = '', { mayor = true, vecino = true } = {}) {
  const exp = v[`${p}expedicion`] ? ` expedida en {{${p}expedicion}}` : '';
  const vec = vecino ? `, domiciliado(a) en {{${p}ciudad}}` : '';
  return `**{{${p}nombre}}**${mayor ? ', mayor de edad' : ''}, identificado(a) con {{${p}tipoDoc}} No. {{${p}numDoc}}${exp}${vec}`;
}

/** Bloque de notificaciones de una persona (solo incluye lo diligenciado). */
export function datosContacto(v, p = '') {
  return [
    `Dirección: {{${p}direccion}}${v[`${p}ciudad`] ? ', {{' + p + 'ciudad}}' : ''}`,
    v[`${p}telefono`] ? `Teléfono: {{${p}telefono}}` : null,
    v[`${p}email`] ? `Correo electrónico: {{${p}email}}` : null,
  ].filter(Boolean);
}

/** Firma estándar. */
export function firma(v, p = '', extra = []) {
  return {
    t: 'sign',
    lines: [`**{{${p}nombre|upper}}**`, `${docAbbr(v[`${p}tipoDoc`])} {{${p}numDoc}}${v[`${p}expedicion`] ? ' de {{' + p + 'expedicion}}' : ''}`, ...extra],
  };
}

/** Campos comunes de lugar y fecha de firma. */
export const lugarFechaFields = () => [
  { id: 'ciudadFirma', type: 'text', label: 'Ciudad donde firmas', short: 'ciudad', required: true, half: true, placeholder: 'Ej.: Cali' },
  { id: 'fechaFirma', type: 'date', label: 'Fecha del documento', short: 'fecha', required: true, half: true, default: () => isoDate(today()) },
];

export const encabezadoFecha = () => ({ t: 'p', text: '{{ciudadFirma}}, {{fechaFirmaLarga}}', align: 'left' });

export const computedFecha = (v) => ({ fechaFirmaLarga: fechaLarga(v.fechaFirma) });

/* ---------- Cláusulas frecuentes ---------- */

export const ART_23 =
  'El artículo 23 de la Constitución Política reconoce a toda persona el derecho a presentar peticiones respetuosas a las autoridades, por motivos de interés general o particular, y a obtener pronta resolución.';

export const ELEMENTOS_PETICION =
  'La Corte Constitucional ha precisado que el núcleo esencial del derecho de petición comprende: (i) la posibilidad de presentar solicitudes sin que la autoridad se niegue a recibirlas; (ii) una respuesta oportuna, dentro de los términos legales; (iii) una respuesta de fondo, es decir, clara, precisa y congruente con lo pedido; y (iv) que la decisión sea efectivamente notificada a quien la solicitó (sentencias T-377 de 2000 y C-951 de 2014, entre otras).';

export const PLAZOS_PETICION =
  'Según el artículo 14 de la Ley 1437 de 2011, sustituido por la Ley Estatutaria 1755 de 2015, las peticiones deben resolverse dentro de los quince (15) días hábiles siguientes a su recepción; las de documentos e información, dentro de los diez (10) días hábiles, y las consultas a las autoridades sobre materias a su cargo, dentro de los treinta (30) días hábiles. Estos términos rigen plenamente desde la expedición de la Ley 2207 de 2022.';

export const JURAMENTO_TUTELA =
  'Bajo la gravedad del juramento, de conformidad con el artículo 37 del Decreto 2591 de 1991, manifiesto que no he presentado otra acción de tutela por los mismos hechos y derechos aquí expuestos.';

export const NOTA_DESPACHO_FIRMA = 'Firma el documento antes de enviarlo. Guarda una copia con la constancia de recibido o el número de radicado.';
