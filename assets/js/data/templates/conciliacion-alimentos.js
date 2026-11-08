/**
 * Solicitud de conciliación: cuota alimentaria, visitas y custodia.
 * Referencias: Arts. 42 y 44 C.P.; Arts. 411 y ss. del Código Civil;
 * Ley 1098 de 2006; Ley 2220 de 2022 (conciliación); modelo público de la
 * Personería de Girón. Redacción propia.
 */
import { personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha, TIPOS_DOC } from '../legal-clauses.js';
import { fechaLarga, pesosEnLetras } from '../../tools/legal-utils.js';

const ENTIDADES = [
  { value: 'Instituto Colombiano de Bienestar Familiar (ICBF) - Centro Zonal', label: 'ICBF - Centro zonal' },
  { value: 'Comisaría de Familia', label: 'Comisaría de Familia' },
  { value: 'Centro de Conciliación', label: 'Centro de conciliación (consultorio jurídico, cámara de comercio…)' },
  { value: 'Personería Municipal', label: 'Personería municipal' },
];

export default {
  id: 'conciliacion-alimentos',
  title: 'Conciliación de cuota alimentaria',
  summary: 'Solicita audiencia de conciliación para fijar alimentos, visitas y custodia de tus hijos.',
  icon: 'family_restroom',
  tone: 'mint',
  category: 'familia',
  plan: 'premium',
  filePrefix: 'solicitud-conciliacion-alimentos',
  nameField: 'nombre',
  channels: ['icbf', 'conciliacion', 'defensoria'],

  guide: {
    que: 'Es la solicitud para que una autoridad cite al otro padre o madre a una audiencia en la que se acuerde cuánto aportará para los hijos, cómo serán las visitas y quién tendrá la custodia. Es gratuita en el ICBF y las comisarías.',
    cuando: ['El otro progenitor no aporta o aporta de forma irregular.', 'Quieres dejar por escrito visitas y custodia.'],
    anexos: ['Registro civil de nacimiento de cada hijo.', 'Copia de tu cédula.', 'Soportes de gastos (colegio, salud, arriendo, alimentación).'],
    tips: ['Lleva una lista de gastos mensuales de los niños: ayuda a fijar una cuota justa.', 'Si no sabes dónde vive la otra persona, indícalo: la entidad puede citarla por otros medios.', 'El acta de conciliación presta mérito ejecutivo: si no cumplen, se puede cobrar.'],
  },

  despacho: {
    donde: 'Entrégala en el centro zonal del ICBF, la comisaría de familia o un centro de conciliación de tu municipio.',
    pasos: ['Firma la solicitud.', 'Adjunta los registros civiles y soportes de gastos.', 'Radícala y pide la fecha de la audiencia.', 'Asiste a la audiencia con tus documentos originales.'],
  },

  steps: [
    { id: 'tus-datos', title: 'Tus datos', intro: 'Quien solicita la conciliación (convocante).', fields: [...personaFields('', { who: 'tu' })] },
    {
      id: 'convocado',
      title: 'Otro progenitor',
      intro: 'La persona a quien se cita (convocado).',
      fields: [
        { id: 'cv_nombre', type: 'text', label: 'Nombre completo', short: 'nombre del convocado', required: true },
        { id: 'cv_parentesco', type: 'select', label: 'Es el/la', half: true, default: 'padre', options: [
          { value: 'padre', label: 'Padre' }, { value: 'madre', label: 'Madre' },
        ] },
        { id: 'cv_numDoc', type: 'text', label: 'Cédula (si la sabes)', short: 'cédula del convocado', half: true },
        { id: 'cv_telefono', type: 'tel', label: 'Celular', short: 'celular del convocado', half: true },
        { id: 'cv_email', type: 'email', label: 'Correo (opcional)', short: 'correo del convocado', half: true },
        { id: 'cv_sinDireccion', type: 'checkbox', label: 'No conozco su dirección' },
        { id: 'cv_direccion', type: 'text', label: 'Dirección', short: 'dirección del convocado', when: (v) => !v.cv_sinDireccion },
        { id: 'cv_ingresos', type: 'textarea', label: '¿A qué se dedica o cuánto gana? (opcional)', short: 'actividad', rows: 2, help: 'Ayuda a la autoridad a fijar una cuota proporcional.' },
      ],
    },
    {
      id: 'hijos',
      title: 'Hijos y situación',
      fields: [
        { id: 'hijos', type: 'repeat', label: 'Hijos', itemLabel: 'Hijo(a)', addLabel: 'Agregar hijo(a)', min: 1, max: 8,
          fields: [
            { id: 'nombre', type: 'text', label: 'Nombre', short: 'nombre del hijo', required: true },
            { id: 'tipoDoc', type: 'select', label: 'Documento', half: true, default: 'registro civil de nacimiento', options: TIPOS_DOC.filter((t) => ['registro civil de nacimiento', 'tarjeta de identidad'].includes(t.value)).map(({ value, label }) => ({ value, label })) },
            { id: 'numDoc', type: 'text', label: 'Número', short: 'número', half: true },
            { id: 'edad', type: 'number', label: 'Edad', short: 'edad', half: true },
          ] },
        { id: 'convivencia', type: 'radio', label: '¿Convivieron?', default: 'si', options: [
          { value: 'si', label: 'Sí, convivimos un tiempo' }, { value: 'no', label: 'No convivimos' },
        ] },
        { id: 'convDesde', type: 'date', label: 'Desde', short: 'fecha de inicio', half: true, when: (v) => v.convivencia === 'si' },
        { id: 'convHasta', type: 'date', label: 'Hasta', short: 'fecha de separación', half: true, when: (v) => v.convivencia === 'si' },
        { id: 'incumpleDesde', type: 'text', label: '¿Desde cuándo no aporta lo suficiente?', short: 'desde cuándo', placeholder: 'Ej.: enero de 2026' },
        { id: 'gastos', type: 'money', label: 'Gastos mensuales aproximados de los hijos (opcional)', short: 'gastos mensuales' },
      ],
    },
    {
      id: 'peticiones',
      title: 'Qué pides',
      fields: [
        { id: 'cuota', type: 'money', label: 'Cuota alimentaria mensual que solicitas', short: 'valor de la cuota', required: true },
        { id: 'diaPago', type: 'text', label: 'Días de pago', short: 'días de pago', default: 'los primeros cinco (5) días de cada mes', half: true },
        { id: 'formaPago', type: 'text', label: 'Forma de pago', short: 'forma de pago', placeholder: 'Ej.: consignación a la cuenta de ahorros No. …', half: true },
        { id: 'extras', type: 'checks', label: 'Además, solicitar', default: ['vestuario', 'salud', 'educacion'], options: [
          { value: 'vestuario', label: 'Mudas de ropa al año' },
          { value: 'salud', label: 'Gastos de salud no cubiertos, por mitades' },
          { value: 'educacion', label: 'Gastos educativos (matrícula, útiles, uniformes), por mitades' },
          { value: 'visitas', label: 'Fijar régimen de visitas' },
          { value: 'custodia', label: 'Custodia y cuidado personal a mi favor' },
        ] },
        { id: 'mudas', type: 'number', label: 'Número de mudas de ropa al año', short: 'mudas', default: '3', half: true, when: (v) => (v.extras || []).includes('vestuario') },
        { id: 'visitas', type: 'textarea', label: 'Propuesta de visitas', short: 'régimen de visitas', rows: 2, when: (v) => (v.extras || []).includes('visitas'), placeholder: 'Ej.: Fines de semana cada quince días, de sábado 9 a.m. a domingo 6 p.m.' },
        { id: 'entidadTipo', type: 'select', label: 'Entidad ante la que la presentas', default: ENTIDADES[0].value, options: ENTIDADES },
        { id: 'entidadNombre', type: 'text', label: 'Nombre o sede (opcional)', short: 'sede', placeholder: 'Ej.: Centro Zonal Kennedy' },
        ...lugarFechaFields(),
      ],
    },
  ],

  computed(v) {
    return {
      ...computedFecha(v),
      cuotaLetras: v.cuota ? pesosEnLetras(v.cuota) : '',
      gastosLetras: v.gastos ? pesosEnLetras(v.gastos) : '',
      convDesdeLarga: fechaLarga(v.convDesde),
      convHastaLarga: fechaLarga(v.convHasta),
      nHijos: (v.hijos || []).length,
    };
  },

  check(v) {
    if (v.cuota && Number(v.cuota) <= 0) return [{ id: 'cuota', msg: 'La cuota debe ser mayor que cero.', step: 3 }];
    return [];
  },

  annexes(v) {
    return [
      ...(v.hijos || []).map((h) => `Registro civil de nacimiento de ${h.nombre || 'mi hijo(a)'}.`),
      'Copia de mi cédula de ciudadanía.',
      'Soportes de los gastos de los menores.',
    ];
  },

  document(v) {
    const hijos = (v.hijos || []).map((h, i) => `**{{hijos.${i}.nombre}}**, identificado(a) con {{hijos.${i}.tipoDoc}} No. {{hijos.${i}.numDoc}}${h.edad ? ', de {{hijos.' + i + '.edad}} años de edad' : ''}.`);
    const plural = (v.hijos || []).length > 1;
    const hijosTxt = plural ? 'nuestros hijos' : 'nuestro(a) hijo(a)';
    const extras = v.extras || [];
    const hechos = [];
    if (v.convivencia === 'si') hechos.push(`Conviví con {{cv_nombre}}${v.convDesde ? ' desde el {{convDesdeLarga}}' : ''}${v.convHasta ? ' hasta el {{convHastaLarga}}' : ''}.`);
    hechos.push(`De esa relación ${plural ? 'nacieron' : 'nació'} ${hijosTxt}:`);
    const hechos2 = [
      `${v.incumpleDesde ? 'Desde {{incumpleDesde}}, ' : ''}{{cv_nombre}} no ha cumplido de manera adecuada con su obligación alimentaria frente a ${hijosTxt}.`,
      `Con mis propios recursos no alcanzo a cubrir todas las necesidades básicas de ${hijosTxt}${v.gastos ? ', cuyos gastos mensuales ascienden aproximadamente a {{gastosLetras}}' : ''}.`,
    ];
    if (v.cv_ingresos) hechos2.push('Según mi conocimiento, el convocado(a) se dedica a: {{cv_ingresos}}');

    const pets = [
      'Que se fije fecha y hora para la celebración de la audiencia de conciliación.',
      `Que se fije a cargo de {{cv_nombre}} una cuota alimentaria mensual de **{{cuotaLetras}}** a favor de ${hijosTxt}, pagadera {{diaPago}}${v.formaPago ? ', mediante {{formaPago}}' : ''}, la cual se reajustará anualmente conforme al artículo 129 de la Ley 1098 de 2006.`,
    ];
    if (extras.includes('vestuario')) pets.push('Que se fije la obligación de suministrar {{mudas}} mudas de ropa completas al año para cada hijo(a).');
    if (extras.includes('salud')) pets.push('Que los gastos de salud no cubiertos por el sistema se asuman en partes iguales.');
    if (extras.includes('educacion')) pets.push('Que los gastos educativos (matrícula, pensión, útiles y uniformes) se asuman en partes iguales.');
    if (extras.includes('visitas')) pets.push(`Que se regule el régimen de visitas así: ${v.visitas ? '{{visitas}}' : 'según lo acuerden las partes en la audiencia'}.`);
    if (extras.includes('custodia')) pets.push(`Que se me otorgue la custodia y cuidado personal de ${hijosTxt}.`);

    return [
      encabezadoFecha(),
      { t: 'space' },
      { t: 'lines', lines: ['Señores', '**{{entidadTipo|upper}}**', v.entidadNombre ? '{{entidadNombre}}' : null, '{{ciudadFirma}}'] },
      { t: 'p', text: '**Referencia: Solicitud de conciliación - Alimentos, custodia y visitas**', align: 'left' },
      { t: 'p', text: `${identificacion(v)}, actuando en representación de ${hijosTxt} menor${plural ? 'es' : ''} de edad, solicito respetuosamente que se cite a audiencia de conciliación a **{{cv_nombre|upper}}**, en su calidad de {{cv_parentesco}}, con fundamento en los siguientes:` },
      { t: 'h', text: 'HECHOS' },
      { t: 'list', style: 'ordinal', items: hechos },
      { t: 'list', style: 'num', items: hijos },
      { t: 'list', style: 'bullet', items: hechos2 },
      { t: 'h', text: 'PETICIONES' },
      { t: 'list', style: 'ordinal', items: pets },
      { t: 'h', text: 'FUNDAMENTOS DE DERECHO' },
      { t: 'p', text: 'Fundamento esta solicitud en los artículos 42 y 44 de la Constitución Política, que protegen a la familia y establecen la prevalencia de los derechos de los niños; en los artículos 411 y siguientes del Código Civil, sobre la obligación alimentaria; en los artículos 23, 24 y 111 de la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia), sobre custodia, alimentos y su fijación; y en la Ley 2220 de 2022, que regula la conciliación.' },
      { t: 'h', text: 'PRUEBAS Y ANEXOS' },
      { t: 'list', style: 'num', items: this.annexes(v) },
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'p', text: '**Convocante:**', align: 'left' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: '**Convocado(a):**', align: 'left' },
      { t: 'lines', lines: [
        '{{cv_nombre}}',
        v.cv_sinDireccion ? 'Manifiesto bajo juramento que desconozco su dirección de residencia.' : 'Dirección: {{cv_direccion}}',
        v.cv_telefono ? 'Celular: {{cv_telefono}}' : null,
        v.cv_email ? 'Correo electrónico: {{cv_email}}' : null,
      ] },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },
};
