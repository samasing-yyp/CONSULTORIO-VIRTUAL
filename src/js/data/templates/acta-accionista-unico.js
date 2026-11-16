/**
 * Acta de decisiones del accionista único de una SAS.
 * Estructura estudiada en el modelo público de la Cámara de Comercio de
 * Bucaramanga (Cámara Directa). Las instrucciones del modelo se convirtieron
 * en ayudas del formulario y cada decisión inserta su propia cláusula.
 */
import { TIPOS_DOC, docAbbr } from '../legal-clauses.js';
import { fechaEnLetras, pesosEnLetras, numeroALetras, today, isoDate } from '../../tools/legal-utils.js';

const DECISIONES = [
  { value: 'nombramiento', label: 'Nombrar representante legal, suplente, revisor fiscal o liquidador' },
  { value: 'razon', label: 'Cambiar la razón social o la sigla' },
  { value: 'reforma', label: 'Reformar artículos de los estatutos' },
  { value: 'capital', label: 'Aumentar el capital autorizado' },
  { value: 'disolucion', label: 'Disolver la sociedad' },
  { value: 'liquidacion', label: 'Aprobar la cuenta final de liquidación' },
];
const tiene = (v, d) => (v.decisiones || []).includes(d);

export default {
  id: 'acta-accionista-unico',
  title: 'Acta de accionista único (SAS)',
  summary: 'Registra nombramientos, reformas, aumento de capital o disolución de una SAS con un solo accionista.',
  icon: 'storefront',
  tone: '',
  category: 'empresa',
  plan: 'premium',
  filePrefix: 'acta-accionista-unico',
  nameField: 'acc_nombre',
  labels: {
    fechaLetras: 'fecha', accionesTxt: 'número de acciones', cap_total: 'nuevo capital autorizado',
    cap_nominal: 'valor nominal', cap_accionesTxt: 'número de acciones', liq_activosTxt: 'activos',
    liq_pasivosTxt: 'pasivos', liq_remanenteTxt: 'remanente',
  },
  channels: ['vue', 'rues', 'camara-comercio'],

  guide: {
    que: 'Es el documento donde el único accionista de una SAS deja constancia de sus decisiones. Se inscribe en la Cámara de Comercio cuando la decisión debe registrarse (nombramientos, reformas, disolución).',
    cuando: ['Cambias de representante legal o nombras revisor fiscal.', 'Cambias el nombre de la empresa o reformas los estatutos.', 'Vas a disolver y liquidar la sociedad.'],
    anexos: ['Carta de aceptación de cada persona nombrada, con su número de identificación.', 'Estados financieros de liquidación, si aplica.', 'Constancia de los avisos de liquidación publicados, si aplica.'],
    tips: ['Antes de cambiar la razón social, consulta la homonimia en el RUES.', 'La nueva razón social debe terminar en «S.A.S.» o «Sociedad por Acciones Simplificada».', 'Si hay disolución y liquidación en la misma acta, la sociedad no debe tener pasivo externo (art. 25 de la Ley 1429 de 2010).'],
  },

  despacho: {
    donde: 'Inscríbela en la Cámara de Comercio del domicilio de la sociedad (en línea o en sede).',
    pasos: ['Firma el acta (accionista y, si aplica, representante legal para la copia).', 'Reúne las cartas de aceptación y anexos.', 'Radica la solicitud de inscripción y paga los derechos de registro.'],
  },

  steps: [
    {
      id: 'sociedad',
      title: 'Sociedad y reunión',
      fields: [
        { id: 'soc_nombre', type: 'text', label: 'Razón social actual', short: 'razón social', required: true, placeholder: 'Ej.: Panadería La Esquina S.A.S.' },
        { id: 'soc_nit', type: 'text', label: 'NIT', short: 'NIT', required: true, half: true },
        { id: 'actaNum', type: 'text', label: 'Número de acta', short: 'número de acta', required: true, half: true, default: '1' },
        { id: 'reunion', type: 'select', label: 'Tipo de reunión', half: true, default: 'extraordinaria', options: [
          { value: 'extraordinaria', label: 'Extraordinaria' }, { value: 'ordinaria', label: 'Ordinaria' },
        ] },
        { id: 'hora', type: 'text', label: 'Hora', short: 'hora', half: true, default: '10:00 a. m.' },
        { id: 'ciudad', type: 'text', label: 'Ciudad', short: 'ciudad', required: true, half: true },
        { id: 'fecha', type: 'date', label: 'Fecha', short: 'fecha', required: true, half: true, default: () => isoDate(today()) },
        { id: 'lugar', type: 'text', label: 'Dirección donde se reúne', short: 'dirección', placeholder: 'Ej.: Oficinas de la sociedad, Calle 10 # 20-30' },
      ],
    },
    {
      id: 'accionista',
      title: 'Accionista único',
      fields: [
        { id: 'acc_nombre', type: 'text', label: 'Nombre del accionista único', short: 'nombre del accionista', required: true },
        { id: 'acc_tipoDoc', type: 'select', label: 'Documento', half: true, default: 'cédula de ciudadanía', options: TIPOS_DOC.slice(0, 4).map(({ value, label }) => ({ value, label })) },
        { id: 'acc_numDoc', type: 'text', label: 'Número', short: 'número de documento', required: true, half: true },
        { id: 'acciones', type: 'number', label: 'Acciones suscritas', short: 'número de acciones', required: true, half: true, help: 'Todas las acciones están en cabeza del accionista único.' },
      ],
    },
    {
      id: 'decisiones',
      title: 'Decisiones',
      intro: 'Elige una o varias. Cada una agrega su punto al orden del día.',
      fields: [
        { id: 'decisiones', type: 'checks', label: '¿Qué se decide?', default: ['nombramiento'], options: DECISIONES, required: true },

        { id: 'nom_cargo', type: 'select', label: 'Cargo', half: true, when: (v) => tiene(v, 'nombramiento'), default: 'Representante Legal', options: [
          { value: 'Representante Legal', label: 'Representante legal' },
          { value: 'Representante Legal Suplente', label: 'Representante legal suplente' },
          { value: 'Revisor Fiscal', label: 'Revisor fiscal' },
          { value: 'Liquidador', label: 'Liquidador' },
        ] },
        { id: 'nom_nombre', type: 'text', label: 'Nombre de la persona nombrada', short: 'nombre del nombrado', required: true, half: true, when: (v) => tiene(v, 'nombramiento') },
        { id: 'nom_tipoDoc', type: 'select', label: 'Documento', half: true, when: (v) => tiene(v, 'nombramiento'), default: 'cédula de ciudadanía', options: TIPOS_DOC.slice(0, 4).map(({ value, label }) => ({ value, label })) },
        { id: 'nom_numDoc', type: 'text', label: 'Número', short: 'número de documento', required: true, half: true, when: (v) => tiene(v, 'nombramiento') },
        { id: 'nom_tp', type: 'text', label: 'Tarjeta profesional', short: 'tarjeta profesional', half: true, when: (v) => tiene(v, 'nombramiento') && v.nom_cargo === 'Revisor Fiscal' },

        { id: 'razon_nueva', type: 'text', label: 'Nueva razón social', short: 'nueva razón social', required: true, when: (v) => tiene(v, 'razon'), validate: (x) => (/s\.?\s?a\.?\s?s\.?$|sociedad por acciones simplificada$/i.test(x.trim()) ? null : 'Debe terminar en «S.A.S.» o «Sociedad por Acciones Simplificada».') },
        { id: 'sigla_nueva', type: 'text', label: 'Nueva sigla (opcional)', short: 'sigla', when: (v) => tiene(v, 'razon') },

        { id: 'reformas', type: 'repeat', label: 'Artículos a reformar', itemLabel: 'Artículo', addLabel: 'Agregar artículo', min: 1, max: 10, when: (v) => tiene(v, 'reforma'),
          fields: [
            { id: 'articulo', type: 'text', label: 'Artículo', short: 'artículo', required: true, placeholder: 'Ej.: Artículo 2 - Objeto social' },
            { id: 'nuevo', type: 'textarea', label: 'Nuevo texto', short: 'nuevo texto', required: true, rows: 3 },
          ] },

        { id: 'cap_valorNominal', type: 'money', label: 'Valor nominal por acción', short: 'valor nominal', required: true, half: true, when: (v) => tiene(v, 'capital') },
        { id: 'cap_acciones', type: 'number', label: 'Nuevo número de acciones autorizadas', short: 'acciones autorizadas', required: true, half: true, when: (v) => tiene(v, 'capital') },

        { id: 'dis_motivo', type: 'textarea', label: 'Motivo de la disolución', short: 'motivo de la disolución', required: true, rows: 2, when: (v) => tiene(v, 'disolucion'), placeholder: 'Ej.: Por decisión del accionista único, dado que la sociedad no desarrolla actividad comercial.' },

        { id: 'liq_nombre', type: 'text', label: 'Liquidador (o representante legal que actúa como tal)', short: 'liquidador', required: true, when: (v) => tiene(v, 'liquidacion') },
        { id: 'liq_avisos', type: 'text', label: '¿Dónde se publicaron los avisos de liquidación?', short: 'medio de publicación', when: (v) => tiene(v, 'liquidacion'), placeholder: 'Ej.: Diario El Tiempo del 5 de octubre de 2026' },
        { id: 'liq_activos', type: 'money', label: 'Total de activos a la fecha', short: 'activos', half: true, when: (v) => tiene(v, 'liquidacion') },
        { id: 'liq_pasivos', type: 'money', label: 'Total de pasivos a la fecha', short: 'pasivos', half: true, when: (v) => tiene(v, 'liquidacion') },
        { id: 'liq_remanente', type: 'money', label: 'Remanente que recibe el accionista', short: 'remanente', half: true, when: (v) => tiene(v, 'liquidacion') },
        { id: 'liq_sinPasivo', type: 'checkbox', label: 'La sociedad no tiene pasivo externo', default: true, when: (v) => tiene(v, 'liquidacion') && tiene(v, 'disolucion'), help: 'Requisito para disolver y liquidar en la misma acta.' },
      ],
    },
    {
      id: 'firma',
      title: 'Firma',
      fields: [
        { id: 'copiaFiel', type: 'checkbox', label: 'Incluir certificación de copia fiel firmada por el representante legal' },
        { id: 'rl_nombre', type: 'text', label: 'Nombre del representante legal', short: 'representante legal', required: true, when: (v) => v.copiaFiel },
      ],
    },
  ],

  computed(v) {
    const c = { fechaLetras: fechaEnLetras(v.fecha) };
    if (v.cap_valorNominal && v.cap_acciones) {
      const total = Number(v.cap_valorNominal) * Number(v.cap_acciones);
      c.cap_total = pesosEnLetras(total);
      c.cap_nominal = pesosEnLetras(v.cap_valorNominal);
      c.cap_accionesTxt = `${numeroALetras(v.cap_acciones)} (${Number(v.cap_acciones).toLocaleString('es-CO')})`;
    }
    if (v.acciones) c.accionesTxt = `${numeroALetras(v.acciones)} (${Number(v.acciones).toLocaleString('es-CO')})`;
    ['liq_activos', 'liq_pasivos', 'liq_remanente'].forEach((k) => { if (v[k] !== '' && v[k] != null) c[k + 'Txt'] = pesosEnLetras(v[k]); });
    return c;
  },

  check(v) {
    const e = [];
    if (!(v.decisiones || []).length) e.push({ id: 'decisiones', msg: 'Elige al menos una decisión.', step: 2 });
    if (tiene(v, 'liquidacion') && tiene(v, 'disolucion') && !v.liq_sinPasivo) {
      e.push({ id: 'liq_sinPasivo', msg: 'Con pasivo externo no se pueden aprobar la disolución y la cuenta final en la misma acta.', step: 2 });
    }
    return e;
  },

  annexes(v) {
    const a = [];
    if (tiene(v, 'nombramiento')) a.push(`Carta de aceptación del cargo de ${v.nom_cargo || 'la persona nombrada'}, con número de identificación.`);
    if (tiene(v, 'liquidacion')) a.push('Inventario y estados financieros de liquidación.', 'Constancia de publicación de los avisos de liquidación.');
    return a;
  },

  document(v) {
    const orden = ['Verificación del quórum.'];
    const puntos = [];
    if (tiene(v, 'nombramiento')) {
      orden.push('Nombramiento de {{nom_cargo|lower}}.');
      puntos.push({ titulo: 'Nombramiento de {{nom_cargo|lower}}', texto: `El accionista único, con el 100 % de las acciones suscritas, aprueba nombrar como **{{nom_cargo}}** a **{{nom_nombre|upper}}**, identificado(a) con {{nom_tipoDoc}} No. {{nom_numDoc}}${v.nom_cargo === 'Revisor Fiscal' && v.nom_tp ? ' y tarjeta profesional No. {{nom_tp}}' : ''}, quien aceptó el cargo mediante comunicación escrita que se anexa.` });
    }
    if (tiene(v, 'razon')) {
      orden.push('Reforma de estatutos: cambio de razón social.');
      puntos.push({ titulo: 'Cambio de razón social', texto: `El accionista único, con el 100 % de las acciones suscritas, aprueba reformar los estatutos para que la sociedad en adelante se denomine **{{razon_nueva|upper}}**${v.sigla_nueva ? ', y podrá usar la sigla **{{sigla_nueva|upper}}**' : ''}, previa consulta de homonimia.` });
    }
    if (tiene(v, 'reforma')) {
      orden.push('Reforma de estatutos.');
      const arts = (v.reformas || []).map((_, i) => `**{{reformas.${i}.articulo}}.** {{reformas.${i}.nuevo}}`);
      puntos.push({ titulo: 'Reforma de estatutos', texto: 'El accionista único, con el 100 % de las acciones suscritas, aprueba reformar los siguientes artículos de los estatutos, que en adelante quedarán así:', lista: arts });
    }
    if (tiene(v, 'capital')) {
      orden.push('Aumento del capital autorizado.');
      puntos.push({ titulo: 'Aumento del capital autorizado', texto: 'El accionista único, con el 100 % de las acciones suscritas, aprueba aumentar el capital autorizado de la sociedad a la suma de **{{cap_total}}**, dividido en {{cap_accionesTxt}} acciones de valor nominal de {{cap_nominal}} cada una, y reformar en ese sentido el artículo correspondiente de los estatutos.' });
    }
    if (tiene(v, 'disolucion')) {
      orden.push('Disolución de la sociedad.');
      puntos.push({ titulo: 'Disolución', texto: 'El accionista único, con el 100 % de las acciones suscritas, aprueba disolver la sociedad por el siguiente motivo: {{dis_motivo}} En consecuencia, la sociedad entra en estado de liquidación y en adelante usará la expresión «en liquidación» junto a su nombre.' });
    }
    if (tiene(v, 'liquidacion')) {
      orden.push('Aprobación de la cuenta final de liquidación.');
      puntos.push({
        titulo: 'Cuenta final de liquidación',
        texto: `El liquidador, **{{liq_nombre}}**, informa que${v.liq_avisos ? ' dio publicidad al estado de liquidación mediante aviso publicado en {{liq_avisos}}, y que' : ''} presenta la cuenta final de liquidación con la siguiente información, que se anexa y hace parte integral de esta acta:`,
        lista: [
          'Activos: {{liq_activosTxt}}.',
          'Pasivos: {{liq_pasivosTxt}}, los cuales se encuentran totalmente pagados.',
          'Remanente que se adjudica al accionista único: {{liq_remanenteTxt}}.',
        ],
        cierre: `El accionista único aprueba la cuenta final de liquidación con el 100 % de las acciones suscritas.${tiene(v, 'disolucion') ? ' La disolución y la cuenta final se aprueban en la misma acta en los términos del artículo 25 de la Ley 1429 de 2010, por cuanto la sociedad carece de pasivo externo.' : ''}`,
      });
    }
    orden.push('Aprobación del texto integral del acta.');

    const cuerpo = [];
    cuerpo.push({ t: 'p', text: '**1. Verificación del quórum.** Se verifica la presencia de {{accionesTxt}} acciones suscritas, en cabeza del accionista único **{{acc_nombre}}**, con lo cual existe quórum para deliberar y decidir.' });
    puntos.forEach((p, i) => {
      cuerpo.push({ t: 'p', text: `**${i + 2}. ${p.titulo}.** ${p.texto}` });
      if (p.lista) cuerpo.push({ t: 'list', style: 'alpha', items: p.lista });
      if (p.cierre) cuerpo.push({ t: 'p', text: p.cierre });
    });
    cuerpo.push({ t: 'p', text: `**${puntos.length + 2}. Aprobación del texto integral del acta.** No habiendo más asuntos que tratar, el accionista único aprueba con el 100 % de las acciones suscritas el texto integral de la presente acta.` });

    return [
      { t: 'lines', align: 'center', lines: ['**ACTA No. {{actaNum}}**', '**DECISIONES DEL ACCIONISTA ÚNICO**', '**{{soc_nombre|upper}}**', 'NIT {{soc_nit}}'] },
      { t: 'p', text: 'En la ciudad de {{ciudad}}, {{fechaLetras}}, siendo las {{hora}}, se reunió en sesión {{reunion}} el accionista único de la sociedad **{{soc_nombre}}**' + (v.lugar ? ', en {{lugar}},' : ',') + ' sin necesidad de convocatoria previa por tratarse de un accionista único, con el fin de desarrollar el siguiente orden del día:' },
      { t: 'list', style: 'num', items: orden },
      { t: 'h', text: 'DESARROLLO' },
      ...cuerpo,
      { t: 'p', text: 'Para constancia se firma por el accionista único.', align: 'left' },
      { t: 'sign', lines: ['**{{acc_nombre|upper}}**', `Accionista único · ${docAbbr(v.acc_tipoDoc)} {{acc_numDoc}}`] },
      v.copiaFiel ? { t: 'p', text: 'Certifico que la presente es copia fiel tomada del original que reposa en el libro de actas de la sociedad.' } : null,
      v.copiaFiel ? { t: 'sign', lines: ['**{{rl_nombre|upper}}**', 'Representante legal'] } : null,
    ];
  },
};
