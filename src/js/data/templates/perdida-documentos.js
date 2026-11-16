/**
 * Declaración de pérdida de documentos y solicitud de duplicado o bloqueo.
 * Desde 2022 la Policía Nacional ya no expide la "constancia de pérdida":
 * según el artículo 30 del Decreto Ley 019 de 2012, basta la afirmación del
 * peticionario bajo juramento. Esta carta es esa afirmación, por escrito.
 */
import { personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha } from '../legal-clauses.js';
import { fechaLarga } from '../../tools/legal-utils.js';

const SOLICITUDES = {
  duplicado: 'Que se expida un duplicado de los documentos relacionados.',
  bloqueo: 'Que se bloqueen o anulen los documentos relacionados para evitar su uso indebido.',
  registro: 'Que se deje constancia de la pérdida en sus registros, para los fines legales pertinentes.',
};

export default {
  id: 'perdida-documentos',
  title: 'Reporte por pérdida de documentos',
  summary: 'Declaración bajo juramento para pedir el duplicado o el bloqueo de documentos perdidos, sin constancia policial.',
  icon: 'badge',
  tone: 'sun',
  category: 'documentos',
  plan: 'basico',
  filePrefix: 'reporte-perdida-documentos',
  nameField: 'nombre',
  channels: ['policia-perdida', 'registraduria', 'cancilleria', 'runt'],

  guide: {
    que: 'Una carta en la que declaras, bajo juramento, que perdiste uno o varios documentos y pides a la entidad que los expidió un duplicado, su bloqueo o que deje registro. Ya no necesitas constancia de la Policía: ninguna entidad pública puede exigirla para expedir un duplicado (art. 30, Decreto Ley 019 de 2012).',
    cuando: ['Perdiste la cédula, la licencia, el carné o documentos de una empresa.', 'Un banco, universidad o empleador te pide un soporte escrito de la pérdida.'],
    anexos: ['Copia de cualquier documento de identidad que conserves (opcional).'],
    tips: ['Cada documento se repone ante quien lo expidió: cédula en la Registraduría, pasaporte en Cancillería, licencia en el organismo de tránsito, tarjetas en el banco.', 'Si te robaron los documentos, no es pérdida: presenta una denuncia por hurto.', 'Para identificarte mientras tanto sirve cualquier otro documento con foto (art. 35, Ley 1801 de 2016).'],
  },

  despacho: {
    donde: 'Entrégala a la entidad que expidió el documento (Registraduría, Cancillería, tránsito, banco, universidad…).',
    pasos: ['Firma la carta.', 'Envíala por el canal de atención de la entidad o preséntala al pedir el duplicado.', 'Si una entidad pública te exige constancia policial, recuérdale el artículo 30 del Decreto Ley 019 de 2012.'],
  },

  steps: [
    { id: 'tus-datos', title: 'Tus datos', fields: [...personaFields('', { who: 'tu' })] },
    {
      id: 'perdida',
      title: 'La pérdida',
      fields: [
        { id: 'fechaPerdida', type: 'date', label: 'Fecha aproximada de la pérdida', short: 'fecha de la pérdida', required: true, half: true },
        { id: 'lugarPerdida', type: 'text', label: 'Lugar aproximado', short: 'lugar', required: true, half: true, placeholder: 'Ej.: Transmilenio, estación Calle 72' },
        { id: 'circunstancias', type: 'textarea', label: '¿Cómo ocurrió? (opcional)', short: 'circunstancias', rows: 3, placeholder: 'Ej.: Se me cayó la billetera al bajar del bus.' },
        { id: 'documentos', type: 'repeat', label: 'Documentos perdidos', itemLabel: 'Documento', addLabel: 'Agregar otro documento', min: 1, max: 12,
          fields: [
            { id: 'tipo', type: 'text', label: 'Documento', short: 'documento', required: true, placeholder: 'Ej.: Licencia de conducción', half: true },
            { id: 'numero', type: 'text', label: 'Número (si lo sabes)', short: 'número', half: true },
          ] },
      ],
    },
    {
      id: 'destinatario',
      title: 'Destinatario y solicitud',
      fields: [
        { id: 'destinatario', type: 'text', label: 'Entidad o empresa a la que escribes', short: 'destinatario', placeholder: 'Ej.: Banco de Ejemplo S.A. (déjalo vacío para «A quien interese»)' },
        { id: 'destinoCiudad', type: 'text', label: 'Ciudad', short: 'ciudad', half: true },
        { id: 'solicitudes', type: 'checks', label: '¿Qué pides?', default: ['registro'], options: [
          { value: 'duplicado', label: 'Que me expidan un duplicado' },
          { value: 'bloqueo', label: 'Que bloqueen o anulen el documento' },
          { value: 'registro', label: 'Que dejen constancia de la pérdida' },
        ] },
        ...lugarFechaFields(),
      ],
    },
  ],

  computed(v) {
    return { ...computedFecha(v), fechaPerdidaLarga: fechaLarga(v.fechaPerdida) };
  },

  annexes() {
    return [];
  },

  document(v) {
    const docs = (v.documentos || []).map((d, i) => `{{documentos.${i}.tipo}}${d.numero ? ' No. {{documentos.' + i + '.numero}}' : ''}`);
    const sols = (v.solicitudes || []).map((s) => SOLICITUDES[s]).filter(Boolean);
    return [
      encabezadoFecha(),
      { t: 'space' },
      v.destinatario
        ? { t: 'lines', lines: ['Señores', '**{{destinatario|upper}}**', v.destinoCiudad ? '{{destinoCiudad}}' : null] }
        : { t: 'lines', lines: ['**A QUIEN INTERESE**'] },
      { t: 'p', text: '**Referencia: Reporte y declaración de pérdida de documentos**', align: 'left' },
      {
        t: 'p',
        text: `${identificacion(v)}, declaro bajo la gravedad del juramento que el {{fechaPerdidaLarga}}, en {{lugarPerdida}}, extravié los siguientes documentos:`,
      },
      { t: 'list', style: 'num', items: docs },
      v.circunstancias ? { t: 'p', text: 'La pérdida ocurrió en las siguientes circunstancias: {{circunstancias}}' } : null,
      {
        t: 'p',
        text: 'Presento esta declaración con fundamento en el artículo 30 del Decreto Ley 019 de 2012, según el cual ninguna autoridad administrativa puede exigir denuncia por pérdida de documentos para expedir el duplicado o reemplazo, pues basta la afirmación del peticionario, que se entiende hecha bajo la gravedad del juramento.',
      },
      sols.length ? { t: 'p', text: 'En consecuencia, solicito respetuosamente:' } : null,
      sols.length ? { t: 'list', style: 'ordinal', items: sols } : null,
      { t: 'p', text: 'Declaro que la información aquí consignada es verdadera y que, en caso de recuperar los documentos, informaré oportunamente.' },
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },
};
