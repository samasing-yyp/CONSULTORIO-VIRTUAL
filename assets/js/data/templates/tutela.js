/**
 * Acción de tutela guiada (petición, salud, pensión, laboral).
 * Estructura estudiada en: Wonder Legal (tutela por derecho de petición),
 * ICBF formato F5.P11.GJ (procedencia contra particulares), Lexivox (tutela
 * genérica) y Personería de Girón (salud de menor con agente oficioso y medida
 * provisional). Redacción propia; citas normativas de dominio público.
 */
import {
  personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha, TIPOS_DOC,
  ART_23, ELEMENTOS_PETICION, PLAZOS_PETICION, JURAMENTO_TUTELA,
} from '../legal-clauses.js';
import { fechaLarga, sumarDiasHabiles, diasHabilesEntre } from '../../tools/legal-utils.js';

const PLAZO = { particular: 15, documentos: 10, consulta: 30 };

const TIPOS = {
  peticion: { label: 'Derecho de petición', sing: true, derechos: 'de petición' },
  salud: { label: 'Salud', derechos: 'a la salud, a la vida en condiciones dignas y a la integridad personal' },
  pension: { label: 'Pensión', derechos: 'a la seguridad social, al mínimo vital y a la vida digna' },
  laboral: { label: 'Estabilidad laboral', derechos: 'a la estabilidad laboral reforzada, al trabajo, al mínimo vital y a la igualdad' },
};

const RELACION_PARTICULAR = {
  servicio: 'presta un servicio público',
  subordinacion: 'frente a quien me encuentro en situación de subordinación',
  indefension: 'frente a quien me encuentro en estado de indefensión',
};

const CONDICION_LABORAL = {
  embarazo: 'me encontraba en estado de embarazo',
  salud: 'tenía una afectación de salud que me limitaba para desempeñar mis funciones',
  prepension: 'me faltaban menos de tres años para cumplir los requisitos de pensión',
  sindical: 'gozaba de fuero sindical',
};

const esPet = (v) => v.tipo === 'peticion';
const esSal = (v) => v.tipo === 'salud';
const esPen = (v) => v.tipo === 'pension';
const esLab = (v) => v.tipo === 'laboral';
const agente = (v) => v.actuacion === 'agente';

export default {
  id: 'tutela',
  title: 'Acción de tutela',
  summary: 'Protege un derecho fundamental: petición sin respuesta, salud, pensión o estabilidad laboral.',
  icon: 'gavel',
  tone: 'rose',
  category: 'justicia',
  plan: 'premium',
  filePrefix: 'accion-de-tutela',
  nameField: 'nombre',
  channels: ['tutela-en-linea', 'rama-judicial', 'defensoria', 'supersalud'],

  guide: {
    que: 'Es un mecanismo para pedirle a un juez que proteja de inmediato un derecho fundamental vulnerado o amenazado. No necesitas abogado y el juez debe decidir en máximo 10 días.',
    cuando: ['Una entidad o empresa no respondió tu derecho de petición dentro del plazo.', 'Tu EPS niega o demora un medicamento, examen o procedimiento ordenado.', 'Te despidieron estando en embarazo o con una condición de salud.', 'Te niegan o no responden una solicitud de pensión y eso afecta tu sustento.'],
    anexos: ['Copia de tu documento de identidad.', 'Prueba de la petición radicada (con sello, correo o número de radicado).', 'Para salud: historia clínica, orden médica y la negación de la EPS.'],
    tips: ['No necesitas saber qué juzgado: escribe «Juez (Reparto)» y el sistema lo asigna.', 'Puedes presentarla cualquier día, incluso festivos.', 'Si es urgente, pide medida provisional y explica por qué no puede esperar.'],
  },

  despacho: {
    donde: 'Preséntala en «Tutela en Línea» de la Rama Judicial o en la oficina de reparto de tu ciudad.',
    pasos: ['Firma el documento.', 'Adjunta las pruebas en PDF.', 'Radícala en Tutela en Línea o en la oficina judicial de reparto; guarda el número de radicación.', 'El juez tiene 10 días para fallar. Si no estás de acuerdo con la decisión, puedes impugnarla dentro de los 3 días siguientes a la notificación.'],
  },

  steps: [
    {
      id: 'tipo',
      title: 'Tu caso',
      intro: 'Elige la situación que más se parece a la tuya. El documento se ajusta solo.',
      fields: [
        { id: 'tipo', type: 'radio', label: '¿Qué derecho te están vulnerando?', default: 'peticion', options: [
          { value: 'peticion', label: 'No respondieron mi derecho de petición', desc: 'O respondieron sin resolver lo que pedí.' },
          { value: 'salud', label: 'Salud', desc: 'La EPS niega o demora un servicio ordenado por el médico.' },
          { value: 'pension', label: 'Pensión', desc: 'Niegan o no responden una solicitud pensional y afecta tu sustento.' },
          { value: 'laboral', label: 'Despido de una persona protegida', desc: 'Embarazo, salud, prepensión o fuero sindical.' },
        ] },
        { id: 'actuacion', type: 'radio', label: '¿Para quién es la tutela?', default: 'propio', options: [
          { value: 'propio', label: 'Para mí', desc: 'Actúo en nombre propio.' },
          { value: 'agente', label: 'Para otra persona que no puede hacerlo', desc: 'Por ejemplo, mi hijo menor de edad o un familiar enfermo (agencia oficiosa).' },
        ] },
      ],
    },
    {
      id: 'accionante',
      title: 'Tus datos',
      intro: 'Quien presenta la tutela.',
      fields: [
        ...personaFields('', { who: 'tu' }),
        { id: 'af_nombre', type: 'text', label: 'Nombre de la persona afectada', short: 'nombre de la persona afectada', required: true, when: agente },
        { id: 'af_tipoDoc', type: 'select', label: 'Documento de la persona afectada', options: TIPOS_DOC.map(({ value, label }) => ({ value, label })), default: 'registro civil de nacimiento', half: true, when: agente },
        { id: 'af_numDoc', type: 'text', label: 'Número', short: 'número de documento', required: true, half: true, when: agente },
        { id: 'af_relacion', type: 'text', label: '¿Qué relación tienes con ella?', short: 'relación', placeholder: 'Ej.: es mi hijo', half: true, when: agente },
        { id: 'af_razon', type: 'select', label: '¿Por qué no puede presentarla?', short: 'razón', half: true, when: agente, default: 'menor', options: [
          { value: 'menor', label: 'Es menor de edad' },
          { value: 'salud', label: 'Su estado de salud se lo impide' },
          { value: 'discapacidad', label: 'Tiene una discapacidad que se lo impide' },
        ] },
      ],
    },
    {
      id: 'accionado',
      title: 'Contra quién',
      fields: [
        { id: 'acc_nombre', type: 'text', label: 'Entidad, empresa o persona contra la que va la tutela', short: 'accionado', required: true, placeholder: 'Ej.: Nueva EPS, Colpensiones, Alcaldía de Pasto' },
        { id: 'acc_tipo', type: 'radio', label: '¿Es pública o privada?', default: 'publica', options: [
          { value: 'publica', label: 'Entidad pública' },
          { value: 'particular', label: 'Empresa o persona particular' },
        ] },
        { id: 'acc_relacion', type: 'radio', label: '¿Por qué procede contra ese particular?', default: 'servicio', when: (v) => v.acc_tipo === 'particular', options: [
          { value: 'servicio', label: 'Presta un servicio público', desc: 'EPS, empresa de energía, agua, transporte, educación…' },
          { value: 'subordinacion', label: 'Dependo de ella', desc: 'Por ejemplo, es mi empleador.' },
          { value: 'indefension', label: 'Estoy indefenso(a) frente a ella', desc: 'No tengo cómo defenderme por otro medio.' },
        ] },
        { id: 'acc_direccion', type: 'text', label: 'Dirección o correo de notificaciones', short: 'dirección del accionado', half: true, help: 'Suele estar en la página web, en «notificaciones judiciales».' },
        { id: 'acc_ciudad', type: 'text', label: 'Ciudad', short: 'ciudad del accionado', half: true },
      ],
    },
    {
      id: 'hechos',
      title: 'Qué pasó',
      fields: [
        // Petición
        { id: 'pet_fecha', type: 'date', label: 'Fecha en que radicaste la petición', short: 'fecha de la petición', required: true, half: true, when: esPet },
        { id: 'pet_medio', type: 'select', label: '¿Cómo la radicaste?', half: true, when: esPet, default: 'de manera presencial', options: [
          { value: 'de manera presencial', label: 'En persona' },
          { value: 'por correo electrónico', label: 'Por correo electrónico' },
          { value: 'a través de la plataforma web de la entidad', label: 'En la página web de la entidad' },
          { value: 'por correo certificado', label: 'Por correo certificado' },
        ] },
        { id: 'pet_radicado', type: 'text', label: 'Número de radicado (opcional)', short: 'número de radicado', half: true, when: esPet },
        { id: 'pet_modalidad', type: 'select', label: 'Tipo de petición', half: true, when: esPet, default: 'particular', options: [
          { value: 'particular', label: 'General / interés particular (15 días)' },
          { value: 'documentos', label: 'Documentos o información (10 días)' },
          { value: 'consulta', label: 'Consulta (30 días)' },
        ] },
        { id: 'pet_contenido', type: 'textarea', label: '¿Qué pediste?', short: 'contenido de la petición', required: true, rows: 3, when: esPet, placeholder: 'Ej.: Copia de mi historia laboral y corrección de semanas cotizadas.' },
        { id: 'pet_situacion', type: 'radio', label: '¿Qué pasó después?', default: 'sin', when: esPet, options: [
          { value: 'sin', label: 'No me han respondido' },
          { value: 'incompleta', label: 'Respondieron, pero no resolvieron lo que pedí' },
        ] },
        { id: 'pet_respuesta', type: 'textarea', label: '¿Qué respondieron?', short: 'respuesta recibida', required: true, rows: 2, when: (v) => esPet(v) && v.pet_situacion === 'incompleta' },
        { id: 'pet_reiteracion', type: 'checkbox', label: 'Insistí con una segunda solicitud (reiteración)', when: esPet },
        { id: 'pet_fechaReit', type: 'date', label: 'Fecha de la reiteración', short: 'fecha de la reiteración', half: true, when: (v) => esPet(v) && v.pet_reiteracion },

        // Salud
        { id: 'sal_diagnostico', type: 'textarea', label: 'Diagnóstico o enfermedad', short: 'diagnóstico', required: true, rows: 2, when: esSal, help: 'Como aparece en la historia clínica.' },
        { id: 'sal_fechaOrden', type: 'date', label: 'Fecha de la orden médica', short: 'fecha de la orden', half: true, when: esSal },
        { id: 'sal_ordenado', type: 'textarea', label: '¿Qué ordenó el médico tratante?', short: 'servicio ordenado', required: true, rows: 2, when: esSal, placeholder: 'Medicamento, examen, cirugía, cita con especialista…' },
        { id: 'sal_negacion', type: 'textarea', label: '¿Qué hizo la EPS?', short: 'actuación de la EPS', required: true, rows: 3, when: esSal, placeholder: 'Ej.: Negó la autorización el 2 de octubre argumentando que no está en el plan de beneficios.' },
        { id: 'sal_medida', type: 'checkbox', label: 'Es urgente: pedir medida provisional', when: esSal, help: 'El juez puede ordenarla desde el primer día si hay riesgo grave.' },
        { id: 'sal_urgencia', type: 'textarea', label: '¿Por qué no puede esperar?', short: 'urgencia', required: true, rows: 2, when: (v) => esSal(v) && v.sal_medida },
        { id: 'sal_integral', type: 'checkbox', label: 'Pedir tratamiento integral', when: esSal, default: true, help: 'Para que la EPS cubra todo lo relacionado con el diagnóstico sin nuevas tutelas.' },
        { id: 'sal_copagos', type: 'checkbox', label: 'Pedir exoneración de copagos y cuotas moderadoras', when: esSal, help: 'Si no tienes capacidad económica para pagarlos.' },

        // Pensión
        { id: 'pen_solicitud', type: 'textarea', label: '¿Qué solicitaste?', short: 'solicitud pensional', required: true, rows: 2, when: esPen, placeholder: 'Ej.: Reconocimiento de la pensión de vejez.' },
        { id: 'pen_fecha', type: 'date', label: 'Fecha de la solicitud', short: 'fecha de la solicitud', required: true, half: true, when: esPen },
        { id: 'pen_estado', type: 'select', label: '¿Qué respondieron?', half: true, when: esPen, default: 'sin', options: [
          { value: 'sin', label: 'No han respondido' },
          { value: 'negada', label: 'La negaron' },
        ] },
        { id: 'pen_respuesta', type: 'textarea', label: 'Motivo de la negación', short: 'motivo', rows: 2, when: (v) => esPen(v) && v.pen_estado === 'negada' },
        { id: 'pen_minimo', type: 'textarea', label: '¿Cómo afecta esto tu sustento?', short: 'afectación del mínimo vital', required: true, rows: 3, when: esPen, placeholder: 'Ej.: Tengo 64 años, no tengo otros ingresos y vivo de la ayuda de mis hijos.' },

        // Laboral
        { id: 'lab_cargo', type: 'text', label: 'Cargo que desempeñabas', short: 'cargo', required: true, half: true, when: esLab },
        { id: 'lab_inicio', type: 'date', label: 'Fecha de ingreso', short: 'fecha de ingreso', half: true, when: esLab },
        { id: 'lab_despido', type: 'date', label: 'Fecha de terminación', short: 'fecha de terminación', required: true, half: true, when: esLab },
        { id: 'lab_condicion', type: 'select', label: 'Tu condición de protección', half: true, when: esLab, default: 'embarazo', options: [
          { value: 'embarazo', label: 'Embarazo o lactancia' },
          { value: 'salud', label: 'Enfermedad o limitación de salud' },
          { value: 'prepension', label: 'Prepensionado(a)' },
          { value: 'sindical', label: 'Fuero sindical' },
        ] },
        { id: 'lab_conocimiento', type: 'checkbox', label: 'El empleador conocía mi condición', when: esLab, default: true },
        { id: 'lab_detalle', type: 'textarea', label: 'Cuenta cómo fue la terminación', short: 'detalle de la terminación', required: true, rows: 3, when: esLab },

        { id: 'hechosExtra', type: 'repeat', label: 'Otros hechos (opcional)', itemLabel: 'Hecho', addLabel: 'Agregar hecho', min: 0, max: 10,
          fields: [{ id: 'texto', type: 'textarea', label: 'Hecho', short: 'hecho', rows: 2 }] },
      ],
    },
    {
      id: 'cierre',
      title: 'Pruebas y firma',
      fields: [
        { id: 'juez', type: 'select', label: 'Juez al que va dirigida', default: 'JUEZ MUNICIPAL (REPARTO)', options: [
          { value: 'JUEZ MUNICIPAL (REPARTO)', label: 'Juez municipal (reparto)' },
          { value: 'JUEZ DEL CIRCUITO (REPARTO)', label: 'Juez del circuito (reparto)' },
        ], help: 'Contra entidades del orden nacional (Colpensiones, Nueva EPS, ministerios) suele ser el juez del circuito. Ante la duda, deja «municipal»: el reparto lo corrige.' },
        { id: 'pruebasExtra', type: 'repeat', label: 'Otras pruebas (opcional)', itemLabel: 'Prueba', addLabel: 'Agregar prueba', min: 0, max: 12,
          fields: [{ id: 'texto', type: 'text', label: 'Prueba', short: 'prueba' }] },
        ...lugarFechaFields(),
      ],
    },
  ],

  computed(v) {
    const c = { ...computedFecha(v) };
    c.pet_fechaLarga = fechaLarga(v.pet_fecha);
    c.pet_fechaReitLarga = fechaLarga(v.pet_fechaReit);
    c.sal_fechaOrdenLarga = fechaLarga(v.sal_fechaOrden);
    c.pen_fechaLarga = fechaLarga(v.pen_fecha);
    c.lab_inicioLarga = fechaLarga(v.lab_inicio);
    c.lab_despidoLarga = fechaLarga(v.lab_despido);
    c.pet_plazo = String(PLAZO[v.pet_modalidad] || 15);
    return c;
  },

  deadline(v) {
    if (!esPet(v) || !v.pet_fecha) return null;
    const plazo = PLAZO[v.pet_modalidad] || 15;
    const usados = diasHabilesEntre(v.pet_fecha);
    const vence = sumarDiasHabiles(v.pet_fecha, plazo);
    if (usados > plazo) return { tone: 'ok', title: 'El plazo de respuesta ya venció', text: `Vencía el ${fechaLarga(vence)} (${plazo} días hábiles). Puedes presentar la tutela.` };
    return { tone: 'danger', title: 'El plazo aún no vence', text: `La entidad tiene hasta el ${fechaLarga(vence)}. Si presentas la tutela antes, el juez podría negarla.` };
  },

  annexes(v) {
    const a = ['Copia de mi documento de identidad.'];
    if (agente(v)) a.push('Copia del documento de identidad de la persona afectada.');
    if (esPet(v)) {
      a.push('Copia de la petición radicada con la constancia de recibido o de envío.');
      if (v.pet_situacion === 'incompleta') a.push('Copia de la respuesta recibida.');
      if (v.pet_reiteracion) a.push('Copia de la solicitud de reiteración.');
    }
    if (esSal(v)) a.push('Historia clínica.', 'Orden médica del servicio requerido.', 'Negación o constancia de la demora de la EPS (si la tengo).');
    if (esPen(v)) a.push('Copia de la solicitud pensional radicada.', v.pen_estado === 'negada' ? 'Copia de la resolución que niega la solicitud.' : null, 'Historia laboral (si la tengo).');
    if (esLab(v)) a.push('Contrato de trabajo o certificación laboral.', 'Carta de terminación del contrato.', 'Soportes de mi condición de protección (prueba de embarazo, incapacidades, historia clínica, etc.).');
    (v.pruebasExtra || []).forEach((p) => p.texto && a.push(p.texto));
    return a.filter(Boolean);
  },

  /** Precarga desde un derecho de petición guardado ("Convertir en tutela"). */
  fromPeticion(p) {
    return {
      tipo: 'peticion',
      nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc, expedicion: p.expedicion,
      ciudad: p.ciudad, direccion: p.direccion, telefono: p.telefono, email: p.email,
      acc_nombre: p.entidad, acc_tipo: p.entidadTipo === 'privada' ? 'particular' : 'publica',
      acc_ciudad: p.entidadCiudad, acc_direccion: p.entidadDireccion,
      pet_fecha: p.fechaRadicacion,
      pet_modalidad: ['documentos', 'consulta'].includes(p.modalidad) ? p.modalidad : 'particular',
      pet_contenido: (p.peticiones || []).map((x) => x.texto).filter(Boolean).join(' '),
      ciudadFirma: p.ciudadFirma,
    };
  },

  document(v) {
    const tipo = TIPOS[v.tipo] || TIPOS.peticion;
    const der = `${tipo.sing ? 'el derecho fundamental' : 'los derechos fundamentales'} ${tipo.derechos}`;
    const n = tipo.sing ? '' : 'n';
    const particular = v.acc_tipo === 'particular';
    const afectadoRef = agente(v) ? '{{af_nombre}}' : 'mí';

    // ----- Introducción
    const intro = agente(v)
      ? `${identificacion(v)}, actuando como agente oficioso de **{{af_nombre}}**, identificado(a) con {{af_tipoDoc}} No. {{af_numDoc}}${v.af_relacion ? ', quien {{af_relacion}}' : ''}, conforme al artículo 10 del Decreto 2591 de 1991, por cuanto ${{ menor: 'es menor de edad', salud: 'su estado de salud le impide promover su propia defensa', discapacidad: 'su condición de discapacidad le impide promover su propia defensa' }[v.af_razon] || 'no puede promover su propia defensa'}, presento ACCIÓN DE TUTELA en contra de **{{acc_nombre|upper}}**, con fundamento en el artículo 86 de la Constitución Política y el Decreto 2591 de 1991, para que se proteja${n} **${der}** de la persona agenciada, con base en los siguientes:`
      : `${identificacion(v)}, actuando en nombre propio, presento ACCIÓN DE TUTELA en contra de **{{acc_nombre|upper}}**, con fundamento en el artículo 86 de la Constitución Política y el Decreto 2591 de 1991, para que se proteja${n} **${der}**, con base en los siguientes:`;

    // ----- Hechos
    const hechos = [];
    if (esPet(v)) {
      hechos.push(`El {{pet_fechaLarga}} radiqué ${v.pet_medio || 'de manera presencial'} ante {{acc_nombre}} un derecho de petición${v.pet_radicado ? ', con número de radicado {{pet_radicado}},' : ''} en el que solicité: {{pet_contenido}}`);
      if (v.pet_situacion === 'incompleta') {
        hechos.push('La entidad emitió una respuesta que no resuelve de fondo lo solicitado, pues se limitó a indicar: {{pet_respuesta}}');
      } else {
        hechos.push('A la fecha de presentación de esta acción, {{acc_nombre}} no ha dado respuesta a mi petición, pese a que el término legal de {{pet_plazo}} días hábiles ya venció.');
      }
      if (v.pet_reiteracion) hechos.push(`El {{pet_fechaReitLarga}} reiteré la solicitud, sin obtener una respuesta de fondo.`);
    }
    if (esSal(v)) {
      hechos.push(`${agente(v) ? '{{af_nombre}}' : 'Me encuentro'} ${agente(v) ? 'se encuentra afiliado(a)' : 'afiliado(a)'} a {{acc_nombre}} y ${agente(v) ? 'fue' : 'fui'} diagnosticado(a) con: {{sal_diagnostico}}`);
      hechos.push(`${v.sal_fechaOrden ? 'El {{sal_fechaOrdenLarga}}, el' : 'El'} médico tratante ordenó: {{sal_ordenado}}`);
      hechos.push('{{sal_negacion}}');
      hechos.push(`La falta de prestación oportuna del servicio pone en riesgo la salud y la vida en condiciones dignas de ${afectadoRef === 'mí' ? 'quien suscribe' : '{{af_nombre}}'}.`);
      if (v.sal_copagos) hechos.push('No cuento con capacidad económica para asumir copagos, cuotas moderadoras ni otros costos asociados al tratamiento.');
    }
    if (esPen(v)) {
      hechos.push('El {{pen_fechaLarga}} solicité a {{acc_nombre}}: {{pen_solicitud}}');
      hechos.push(v.pen_estado === 'negada' ? `La entidad negó la solicitud${v.pen_respuesta ? ' con el argumento de que {{pen_respuesta}}' : ''}.` : 'A la fecha, la entidad no ha resuelto la solicitud.');
      hechos.push('Esta situación afecta gravemente mi mínimo vital: {{pen_minimo}}');
    }
    if (esLab(v)) {
      hechos.push(`${v.lab_inicio ? 'Desde el {{lab_inicioLarga}} trabajé' : 'Trabajé'} para {{acc_nombre}} en el cargo de {{lab_cargo}}.`);
      hechos.push(`Para el momento de la terminación ${CONDICION_LABORAL[v.lab_condicion] || ''}${v.lab_conocimiento ? ', situación que era conocida por el empleador' : ''}.`);
      hechos.push('El {{lab_despidoLarga}} se dio por terminado mi contrato de trabajo, así: {{lab_detalle}}');
      hechos.push('La terminación se produjo sin autorización de la autoridad del trabajo competente y me deja sin ingresos para atender mis necesidades básicas.');
    }
    (v.hechosExtra || []).forEach((h, i) => h.texto && hechos.push(`{{hechosExtra.${i}.texto}}`));

    // ----- Pretensiones
    const pret = [`Que se TUTELE${n.toUpperCase()} ${der} de ${agente(v) ? '{{af_nombre}}' : 'quien suscribe'}.`];
    if (esPet(v)) pret.push('Que se ORDENE a {{acc_nombre}} que, dentro de las cuarenta y ocho (48) horas siguientes a la notificación del fallo, dé respuesta clara, precisa, congruente y de fondo a la petición presentada, y la notifique en debida forma.');
    if (esSal(v)) {
      pret.push('Que se ORDENE a {{acc_nombre}} que, dentro de las cuarenta y ocho (48) horas siguientes a la notificación del fallo, autorice y garantice efectivamente: {{sal_ordenado}}');
      if (v.sal_integral) pret.push('Que se ORDENE a {{acc_nombre}} brindar tratamiento integral para el diagnóstico descrito, incluyendo medicamentos, procedimientos, citas y demás servicios que ordene el médico tratante.');
      if (v.sal_copagos) pret.push('Que se ORDENE la exoneración de copagos y cuotas moderadoras asociados al tratamiento, por falta de capacidad económica.');
    }
    if (esPen(v)) pret.push(v.pen_estado === 'negada'
      ? 'Que se ORDENE a {{acc_nombre}} que, dentro de las cuarenta y ocho (48) horas siguientes a la notificación del fallo, estudie nuevamente la solicitud y reconozca la prestación a la que tengo derecho, o, en subsidio, adopte las medidas transitorias necesarias para proteger mi mínimo vital.'
      : 'Que se ORDENE a {{acc_nombre}} que, dentro de las cuarenta y ocho (48) horas siguientes a la notificación del fallo, resuelva de fondo la solicitud pensional presentada.');
    if (esLab(v)) pret.push('Que se ORDENE a {{acc_nombre}} mi reintegro a un cargo igual o de superior jerarquía, junto con el pago de los salarios y prestaciones dejados de percibir y las cotizaciones a seguridad social, desde la terminación hasta el reintegro efectivo.');

    // ----- Fundamentos
    const fund = [
      'El artículo 86 de la Constitución Política establece que toda persona puede reclamar ante los jueces, mediante un procedimiento preferente y sumario, la protección inmediata de sus derechos fundamentales cuando resulten vulnerados o amenazados por la acción u omisión de cualquier autoridad pública o de los particulares en los casos que señala la ley.',
    ];
    if (esPet(v)) {
      fund.push(ART_23, PLAZOS_PETICION, ELEMENTOS_PETICION,
        'La ausencia de respuesta oportuna y de fondo vulnera el núcleo esencial del derecho de petición, y la acción de tutela es el mecanismo idóneo para su protección, pues no existe otro medio judicial eficaz para obtener la respuesta.');
    }
    if (esSal(v)) {
      fund.push('Los artículos 48 y 49 de la Constitución Política garantizan la seguridad social y el acceso a los servicios de salud. La Ley Estatutaria 1751 de 2015 reconoce la salud como un derecho fundamental autónomo (artículo 2) y establece que los servicios deben suministrarse de manera completa e integral (artículo 8), sin que barreras administrativas puedan imponerse al acceso.');
      if (agente(v) && v.af_razon === 'menor') fund.push('El artículo 44 de la Constitución Política dispone que los derechos de los niños prevalecen sobre los de los demás, y el artículo 27 de la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia) reconoce su derecho a la salud integral.');
      if (v.sal_medida) fund.push('El artículo 7 del Decreto 2591 de 1991 faculta al juez para ordenar, desde la presentación de la solicitud, las medidas provisionales necesarias para proteger el derecho cuando sea urgente.');
    }
    if (esPen(v)) fund.push('El artículo 48 de la Constitución Política consagra la seguridad social como un derecho irrenunciable, y el artículo 53 protege el mínimo vital. La jurisprudencia constitucional admite la procedencia de la tutela en materia pensional cuando la falta de reconocimiento o de respuesta afecta el mínimo vital de una persona en situación de vulnerabilidad y los medios ordinarios no resultan eficaces.');
    if (esLab(v)) {
      const norma = {
        embarazo: 'el artículo 43 de la Constitución Política y el artículo 239 del Código Sustantivo del Trabajo, que prohíben el despido por motivo de embarazo o lactancia sin autorización del inspector del trabajo',
        salud: 'el artículo 13 de la Constitución Política y el artículo 26 de la Ley 361 de 1997, que exigen autorización de la autoridad del trabajo para despedir a una persona en situación de debilidad manifiesta por razones de salud',
        prepension: 'los artículos 13, 48 y 53 de la Constitución Política y la jurisprudencia constitucional sobre la protección a las personas próximas a pensionarse',
        sindical: 'el artículo 39 de la Constitución Política y el artículo 405 del Código Sustantivo del Trabajo, sobre el fuero sindical',
      }[v.lab_condicion];
      fund.push(`La estabilidad laboral reforzada se deriva de ${norma}. Los artículos 25 y 53 de la Constitución protegen el trabajo en condiciones dignas y justas.`);
    }
    if (particular) fund.push(`La tutela procede contra particulares en los casos del inciso final del artículo 86 de la Constitución y del artículo 42 del Decreto 2591 de 1991. En este caso, {{acc_nombre}} ${RELACION_PARTICULAR[v.acc_relacion] || RELACION_PARTICULAR.servicio}.${esPet(v) ? ' Además, los artículos 32 y 33 de la Ley 1755 de 2015 extienden el derecho de petición a organizaciones privadas.' : ''}`);

    const anexos = this.annexes(v).map((t) => t.replace(/\{\{/g, '{ {'));

    return [
      encabezadoFecha(),
      { t: 'space' },
      { t: 'lines', lines: ['Señor(a)', `**{{juez}}**`, 'E. S. D.'] },
      { t: 'lines', lines: [
        '**Referencia:** Acción de tutela' + (esSal(v) && v.sal_medida ? ' con solicitud de medida provisional' : ''),
        `**Accionante:** {{nombre|upper}}${agente(v) ? ' como agente oficioso de {{af_nombre|upper}}' : ''}`,
        '**Accionado:** {{acc_nombre|upper}}',
      ] },
      { t: 'p', text: intro },
      { t: 'h', text: 'HECHOS' },
      { t: 'list', style: 'ordinal', items: hechos },
      { t: 'h', text: 'DERECHOS FUNDAMENTALES VULNERADOS' },
      { t: 'p', text: `Con los hechos descritos, {{acc_nombre}} vulnera **${der}** de ${agente(v) ? '{{af_nombre}}' : 'quien suscribe'}.` },
      { t: 'h', text: 'PRETENSIONES' },
      { t: 'p', text: 'Con fundamento en lo anterior, solicito respetuosamente al señor(a) juez:' },
      { t: 'list', style: 'ordinal', items: pret },
      esSal(v) && v.sal_medida ? { t: 'h', text: 'MEDIDA PROVISIONAL' } : null,
      esSal(v) && v.sal_medida ? { t: 'p', text: 'Con fundamento en el artículo 7 del Decreto 2591 de 1991, solicito que, mientras se decide esta acción, se ordene a {{acc_nombre}} autorizar y suministrar de manera inmediata: {{sal_ordenado}}. La medida es urgente porque: {{sal_urgencia}}' } : null,
      { t: 'h', text: 'FUNDAMENTOS DE DERECHO' },
      ...fund.map((text) => ({ t: 'p', text })),
      { t: 'h', text: 'PRUEBAS Y ANEXOS' },
      { t: 'list', style: 'num', items: anexos },
      { t: 'h', text: 'JURAMENTO' },
      { t: 'p', text: JURAMENTO_TUTELA },
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'p', text: '**Accionante:**', align: 'left' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: '**Accionado:**', align: 'left' },
      { t: 'lines', lines: [`Dirección o correo electrónico: {{acc_direccion}}${v.acc_ciudad ? ', {{acc_ciudad}}' : ''}`] },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },
};
