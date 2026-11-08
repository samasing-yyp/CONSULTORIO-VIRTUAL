/**
 * Denuncia penal en nombre propio.
 * Referencias: Ley 906 de 2004 (arts. 67 y 69); modelo público de la Personería
 * de Girón, adaptado para que lo presente la víctima o testigo sin apoderado.
 */
import { personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha } from '../legal-clauses.js';
import { fechaLarga } from '../../tools/legal-utils.js';

const DELITOS = [
  'hurto', 'estafa', 'abuso de confianza', 'lesiones personales', 'amenazas', 'violencia intrafamiliar',
  'injuria', 'calumnia', 'daño en bien ajeno', 'acceso abusivo a sistema informático', 'otro',
];
// Delitos querellables más comunes (requieren conciliación previa, art. 74 Ley 906 de 2004)
const QUERELLABLES = new Set(['injuria', 'calumnia', 'daño en bien ajeno', 'abuso de confianza']);

export default {
  id: 'denuncia-penal',
  title: 'Denuncia penal',
  summary: 'Organiza los hechos, las personas involucradas y las pruebas para denunciar un delito ante la Fiscalía.',
  icon: 'policy',
  tone: 'lilac',
  category: 'justicia',
  plan: 'basico',
  filePrefix: 'denuncia-penal',
  nameField: 'nombre',
  channels: ['fiscalia-denuncia', 'policia', 'defensoria'],

  guide: {
    que: 'Es el escrito con el que pones en conocimiento de la Fiscalía un hecho que puede ser delito, para que lo investigue. Se presenta bajo juramento.',
    cuando: ['Fuiste víctima o testigo de un delito (hurto, estafa, amenazas, lesiones…).', 'Necesitas un soporte escrito de lo ocurrido para otros trámites.'],
    anexos: ['Copia de tu documento de identidad.', 'Pruebas: fotos, videos, chats, facturas, dictámenes médicos.', 'Datos de testigos.'],
    tips: ['Si hay riesgo para tu vida o integridad, llama a la línea 123 de inmediato.', 'Algunos delitos (como injuria, calumnia o daño en bien ajeno) requieren intentar una conciliación antes.', 'Cuenta los hechos en orden: cuándo, dónde, quién y qué pasó.'],
  },

  despacho: {
    donde: 'Preséntala en la denuncia virtual de la Fiscalía, en una sala de atención al usuario (SAU) o en una URI.',
    pasos: ['Firma el documento.', 'Radícalo en el canal oficial de la Fiscalía y guarda el número de noticia criminal (NUNC).', 'Con ese número puedes consultar el avance del caso.'],
  },

  steps: [
    { id: 'tus-datos', title: 'Tus datos', intro: 'Quien denuncia (víctima o testigo).', fields: [
      ...personaFields('', { who: 'tu' }),
      { id: 'calidad', type: 'radio', label: '¿En qué calidad denuncias?', default: 'victima', options: [
        { value: 'victima', label: 'Soy la víctima' },
        { value: 'testigo', label: 'Soy testigo de los hechos' },
      ] },
    ] },
    {
      id: 'delito',
      title: 'Delito y denunciado',
      fields: [
        { id: 'delito', type: 'select', label: '¿Qué delito crees que ocurrió?', short: 'delito', default: 'hurto', options: DELITOS.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) })), help: 'Si no estás seguro, elige el más cercano. La Fiscalía lo califica.' },
        { id: 'delitoOtro', type: 'text', label: '¿Cuál?', short: 'delito', required: true, when: (v) => v.delito === 'otro' },
        { id: 'conoceDenunciado', type: 'radio', label: '¿Sabes quién lo hizo?', default: 'no', options: [
          { value: 'si', label: 'Sí, sé quién es' },
          { value: 'no', label: 'No, es una persona desconocida' },
        ] },
        { id: 'den_nombre', type: 'text', label: 'Nombre de la persona denunciada', short: 'nombre del denunciado', required: true, when: (v) => v.conoceDenunciado === 'si' },
        { id: 'den_datos', type: 'textarea', label: 'Otros datos que conozcas (opcional)', short: 'datos del denunciado', rows: 2, when: (v) => v.conoceDenunciado === 'si', placeholder: 'Documento, dirección, teléfono, descripción física…' },
      ],
    },
    {
      id: 'hechos',
      title: 'Los hechos',
      fields: [
        { id: 'fechaHechos', type: 'date', label: 'Fecha de los hechos', short: 'fecha de los hechos', required: true, half: true },
        { id: 'lugarHechos', type: 'text', label: 'Lugar de los hechos', short: 'lugar de los hechos', required: true, half: true },
        { id: 'hechos', type: 'repeat', label: 'Relato de los hechos', itemLabel: 'Hecho', addLabel: 'Agregar otro hecho', min: 1, max: 15,
          help: 'Qué pasó, paso a paso. Incluye horas, objetos y valores si los conoces.',
          fields: [{ id: 'texto', type: 'textarea', label: 'Hecho', short: 'hecho', required: true, rows: 3 }] },
        { id: 'proteccion', type: 'checkbox', label: 'Necesito medidas de protección', help: 'Márcalo si temes por tu seguridad o la de tu familia.' },
      ],
    },
    {
      id: 'pruebas',
      title: 'Pruebas y firma',
      fields: [
        { id: 'documentales', type: 'repeat', label: 'Pruebas documentales (opcional)', itemLabel: 'Prueba', addLabel: 'Agregar prueba', min: 0, max: 12,
          fields: [{ id: 'texto', type: 'text', label: 'Prueba', short: 'prueba', placeholder: 'Ej.: Capturas de pantalla de la conversación de WhatsApp' }] },
        { id: 'testigos', type: 'repeat', label: 'Testigos (opcional)', itemLabel: 'Testigo', addLabel: 'Agregar testigo', min: 0, max: 8,
          fields: [
            { id: 'nombre', type: 'text', label: 'Nombre del testigo', short: 'nombre del testigo', half: true },
            { id: 'contacto', type: 'text', label: 'Teléfono o dirección', short: 'contacto', half: true },
          ] },
        ...lugarFechaFields(),
      ],
    },
  ],

  computed(v) {
    const delito = v.delito === 'otro' ? v.delitoOtro || '' : v.delito;
    return { ...computedFecha(v), delitoTxt: delito, fechaHechosLarga: fechaLarga(v.fechaHechos) };
  },

  deadline(v) {
    if (QUERELLABLES.has(v.delito)) {
      return { tone: 'info', title: 'Puede requerir conciliación', text: 'Este delito suele ser querellable: antes de la investigación se intenta una conciliación entre las partes (art. 522 de la Ley 906 de 2004).' };
    }
    if (v.proteccion || ['amenazas', 'violencia intrafamiliar'].includes(v.delito)) {
      return { tone: 'danger', title: 'Si estás en riesgo, llama al 123', text: 'Para violencia intrafamiliar también puedes acudir a la Comisaría de Familia, que puede dictar medidas de protección de inmediato.' };
    }
    return null;
  },

  annexes(v) {
    return ['Copia de mi documento de identidad.', ...(v.documentales || []).map((d) => d.texto).filter(Boolean)];
  },

  document(v) {
    const hechos = (v.hechos || []).map((_, i) => `{{hechos.${i}.texto}}`);
    const docs = (v.documentales || []).map((d, i) => (d.texto ? `{{documentales.${i}.texto}}` : null)).filter(Boolean);
    const tests = (v.testigos || []).map((t, i) => (t.nombre ? `{{testigos.${i}.nombre}}${t.contacto ? ', quien puede ser ubicado(a) en {{testigos.' + i + '.contacto}}' : ''}.` : null)).filter(Boolean);
    const denunciado = v.conoceDenunciado === 'si' ? '{{den_nombre|upper}}' : 'PERSONA(S) POR DETERMINAR';
    const pretensiones = [
      'Que se inicie la investigación correspondiente por los hechos narrados y se identifique y judicialice a los responsables.',
      'Que se me reconozca la calidad de víctima y se me informe sobre el avance de la actuación.',
    ];
    if (v.calidad === 'testigo') pretensiones[1] = 'Que se me tenga en cuenta como testigo y se me informe sobre el avance de la actuación.';
    if (v.proteccion) pretensiones.push('Que se adopten medidas de protección a mi favor y de mi núcleo familiar, dado el riesgo que enfrento.');

    return [
      encabezadoFecha(),
      { t: 'space' },
      { t: 'lines', lines: ['Señores', '**FISCALÍA GENERAL DE LA NACIÓN**', 'Sala de Atención al Usuario (Reparto)', '{{ciudadFirma}}'] },
      { t: 'lines', lines: ['**Referencia:** Denuncia penal', '**Delito:** {{delitoTxt|upper}}', '**Denunciante:** {{nombre|upper}}', `**Denunciado:** ${denunciado}`] },
      {
        t: 'p',
        text: `${identificacion(v)}, actuando en nombre propio y en calidad de ${v.calidad === 'testigo' ? 'testigo' : 'víctima'}, presento denuncia penal por el presunto delito de {{delitoTxt}} en contra de ${v.conoceDenunciado === 'si' ? '{{den_nombre}}' : 'persona(s) por determinar'}, con fundamento en los artículos 67 y 69 de la Ley 906 de 2004, y con base en los siguientes:`,
      },
      { t: 'h', text: 'HECHOS' },
      { t: 'p', text: 'Los hechos ocurrieron el {{fechaHechosLarga}}, en {{lugarHechos}}.' },
      { t: 'list', style: 'ordinal', items: hechos },
      v.conoceDenunciado === 'si' && v.den_datos ? { t: 'p', text: '**Datos del denunciado:** {{den_datos}}' } : null,
      { t: 'h', text: 'PETICIONES' },
      { t: 'list', style: 'ordinal', items: pretensiones },
      { t: 'h', text: 'FUNDAMENTOS DE DERECHO' },
      { t: 'p', text: 'Fundamento esta denuncia en el artículo 250 de la Constitución Política y en los artículos 67 (deber de denunciar) y 69 (requisitos de la denuncia) de la Ley 906 de 2004, Código de Procedimiento Penal, y demás normas concordantes.' },
      docs.length || tests.length ? { t: 'h', text: 'PRUEBAS' } : null,
      docs.length ? { t: 'p', text: '**Documentales:**', align: 'left' } : null,
      docs.length ? { t: 'list', style: 'num', items: docs } : null,
      tests.length ? { t: 'p', text: '**Testimoniales:** solicito escuchar en declaración a:', align: 'left' } : null,
      tests.length ? { t: 'list', style: 'num', items: tests } : null,
      { t: 'h', text: 'JURAMENTO' },
      { t: 'p', text: 'Manifiesto bajo la gravedad del juramento que los hechos aquí narrados son ciertos, de conformidad con el artículo 69 de la Ley 906 de 2004, y que conozco las consecuencias legales de presentar una denuncia falsa.' },
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },
};
