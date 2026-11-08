/**
 * Solicitud de prescripción de comparendos de tránsito (derecho de petición).
 * Referencias: Art. 23 C.P.; Art. 159 de la Ley 769 de 2002, modificado por el
 * Art. 206 del Decreto Ley 019 de 2012; modelo público de la Personería de Girón.
 */
import {
  personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha, ART_23,
} from '../legal-clauses.js';
import { aniosEntre, sumarAnios, fechaLarga } from '../../tools/legal-utils.js';

export default {
  id: 'prescripcion-comparendo',
  title: 'Prescripción de comparendo de tránsito',
  summary: 'Pide que declaren prescrita una multa de tránsito de hace más de tres años y que actualicen el SIMIT y el RUNT.',
  icon: 'directions_car',
  tone: 'sun',
  category: 'peticiones',
  plan: 'basico',
  filePrefix: 'prescripcion-comparendo',
  nameField: 'nombre',
  channels: ['simit', 'runt', 'gov-co'],

  guide: {
    que: 'Es un derecho de petición para que el organismo de tránsito reconozca que ya no puede cobrarte una multa porque pasaron más de tres años desde la infracción sin que te notificaran el mandamiento de pago.',
    cuando: ['La multa tiene más de tres años desde la fecha del comparendo.', 'Sigues apareciendo como deudor en el SIMIT.'],
    anexos: ['Copia de tu documento de identidad.', 'Consulta o pantallazo del SIMIT donde aparece el comparendo.'],
    tips: ['Consulta primero tus comparendos en el SIMIT para tener número y fecha exactos.', 'Si te notificaron un mandamiento de pago antes de cumplirse los tres años, el plazo se interrumpe y la solicitud puede ser negada.'],
  },

  despacho: {
    donde: 'Radícalo ante la secretaría u organismo de tránsito que impuso el comparendo (aparece en el SIMIT).',
    pasos: ['Firma el documento.', 'Envíalo por la ventanilla o el correo de PQRSD del organismo de tránsito.', 'La entidad tiene 15 días hábiles para responder.'],
  },

  steps: [
    { id: 'tus-datos', title: 'Tus datos', fields: [...personaFields('', { who: 'tu' })] },
    {
      id: 'organismo',
      title: 'Organismo de tránsito',
      fields: [
        { id: 'organismo', type: 'text', label: 'Organismo de tránsito', short: 'organismo de tránsito', required: true, placeholder: 'Ej.: Secretaría de Movilidad de Bogotá', help: 'Lo encuentras en el SIMIT junto a cada comparendo.' },
        { id: 'organismoCiudad', type: 'text', label: 'Ciudad del organismo', short: 'ciudad', required: true, half: true },
        { id: 'organismoDireccion', type: 'text', label: 'Dirección o correo (opcional)', short: 'dirección', half: true },
      ],
    },
    {
      id: 'comparendos',
      title: 'Comparendos',
      intro: 'Agrega cada comparendo que quieres que declaren prescrito.',
      fields: [
        { id: 'comparendos', type: 'repeat', label: 'Comparendos', itemLabel: 'Comparendo', addLabel: 'Agregar otro comparendo', min: 1, max: 10,
          fields: [
            { id: 'numero', type: 'text', label: 'Número de comparendo', short: 'número de comparendo', required: true, half: true },
            { id: 'fecha', type: 'date', label: 'Fecha de la infracción', short: 'fecha', required: true, half: true },
            { id: 'lugar', type: 'text', label: 'Lugar o ciudad (opcional)', short: 'lugar' },
          ] },
        { id: 'placa', type: 'text', label: 'Placa del vehículo (opcional)', short: 'placa', half: true },
        { id: 'mandamiento', type: 'radio', label: '¿Te notificaron un mandamiento de pago?', default: 'no', options: [
          { value: 'no', label: 'No me notificaron' },
          { value: 'nose', label: 'No lo sé' },
        ], help: 'El mandamiento de pago es la orden formal de cobro coactivo.' },
      ],
    },
    { id: 'cierre', title: 'Firma', fields: [...lugarFechaFields()] },
  ],

  computed(v) {
    return { ...computedFecha(v) };
  },

  deadline(v) {
    const items = (v.comparendos || []).filter((c) => c.fecha);
    if (!items.length) return { tone: 'info', title: 'Prescripción: 3 años', text: 'Escribe la fecha de cada comparendo y te diremos si ya pasaron tres años.' };
    const pendientes = items.filter((c) => aniosEntre(c.fecha) < 3);
    if (!pendientes.length) return { tone: 'ok', title: 'Todos superan los 3 años', text: 'Según las fechas, los comparendos cumplen el tiempo para solicitar la prescripción.' };
    const c = pendientes[0];
    return { tone: 'danger', title: 'Aún no cumple 3 años', text: `El comparendo ${c.numero || 'sin número'} cumpliría tres años el ${fechaLarga(sumarAnios(c.fecha, 3))}. Antes de esa fecha la solicitud probablemente será negada.` };
  },

  annexes() {
    return ['Copia de mi documento de identidad.', 'Consulta del estado de cuenta en el SIMIT.'];
  },

  document(v) {
    const comps = (v.comparendos || []).map(
      (c, i) => `Comparendo No. **{{comparendos.${i}.numero}}** del {{comparendos.${i}.fechaLarga}}${c.lugar ? ', en {{comparendos.' + i + '.lugar}}' : ''}.`,
    );
    return [
      encabezadoFecha(),
      { t: 'space' },
      { t: 'lines', lines: ['Señores', '**{{organismo|upper}}**', v.organismoDireccion ? '{{organismoDireccion}}' : null, '{{organismoCiudad}}'] },
      { t: 'p', text: '**Referencia: Derecho de petición - Solicitud de declaratoria de prescripción de sanciones de tránsito**', align: 'left' },
      {
        t: 'p',
        text: `${identificacion(v)}, en ejercicio del derecho fundamental de petición (artículo 23 de la Constitución Política y Ley 1755 de 2015), solicito que se declare la prescripción de la sanción derivada de ${comps.length > 1 ? 'los siguientes comparendos' : 'el siguiente comparendo'}${v.placa ? ', asociados al vehículo de placa {{placa|upper}}' : ''}:`,
      },
      { t: 'list', style: 'num', items: comps },
      { t: 'h', text: 'HECHOS' },
      {
        t: 'list',
        style: 'ordinal',
        items: [
          'Desde la fecha de ocurrencia de los hechos que originaron la sanción han transcurrido más de tres (3) años.',
          v.mandamiento === 'no'
            ? 'Durante ese tiempo no me fue notificado mandamiento de pago alguno.'
            : 'No tengo conocimiento de que se me haya notificado mandamiento de pago dentro de ese término.',
          'A la fecha continúo reportado(a) como deudor(a) en el Sistema Integrado de Información sobre Multas y Sanciones por Infracciones de Tránsito (SIMIT).',
        ],
      },
      { t: 'h', text: 'PETICIONES' },
      {
        t: 'list',
        style: 'ordinal',
        items: [
          'Que se declare de oficio la prescripción de la sanción impuesta, conforme al artículo 159 de la Ley 769 de 2002.',
          'Que, en consecuencia, se ordene la terminación y el archivo de cualquier proceso de cobro coactivo relacionado.',
          'Que se actualicen las bases de datos del SIMIT, del RUNT y de cualquier otro registro en el que aparezca como deudor(a) por esta sanción.',
          'Que se me expida el correspondiente paz y salvo.',
        ],
      },
      { t: 'h', text: 'FUNDAMENTOS DE DERECHO' },
      { t: 'p', text: ART_23 },
      {
        t: 'p',
        text: 'El artículo 159 de la Ley 769 de 2002 (Código Nacional de Tránsito), modificado por el artículo 206 del Decreto Ley 019 de 2012, establece que la ejecución de las sanciones por infracciones de tránsito prescribe en tres (3) años contados a partir de la ocurrencia del hecho, que la prescripción debe ser declarada de oficio y que solo se interrumpe con la notificación del mandamiento de pago.',
      },
      { t: 'h', text: 'ANEXOS' },
      { t: 'list', style: 'num', items: ['Copia de mi documento de identidad.', 'Consulta del estado de cuenta en el SIMIT.'] },
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },

  /** Derivados por elemento de lista (fecha larga de cada comparendo). */
  itemComputed: { comparendos: (c) => ({ fechaLarga: fechaLarga(c.fecha) }) },
};
