/**
 * Áreas temáticas con sección propia (salud, servicios públicos y tránsito).
 * Basado en las guías internas de cada área (carpeta «.assets to learn»):
 * qué se presenta, ante quién, en qué orden y en qué plazos.
 * Las minutas de cada área se cargan desde assets/js/data/minutas/<area>/.
 *
 * Cada área define:
 *   stages   — grupos de minutas según la etapa del problema (minuta.stage)
 *   route    — ruta recomendada paso a paso (con códigos de minuta)
 *   deadlines, rules, warnings, lawyer — información de apoyo
 *   channels — entidades relacionadas (ids de channels.js)
 */
export const AREAS = [
  {
    id: 'salud',
    route: 'app/salud/',
    title: 'Salud',
    icon: 'health_and_safety',
    tone: 'mint',
    tagline: 'Citas, medicamentos, incapacidades, tutelas y reclamos ante la EPS',
    intro: 'Documentos para exigir a tu EPS, a la clínica o al hospital lo que necesitas, y para escalar ante la Supersalud o un juez si no te responden.',
    context: 'La reforma a la salud aún no es ley: las EPS, la afiliación y los reclamos siguen con el marco actual (Ley 100 de 1993, Ley Estatutaria 1751 de 2015 y Decreto 780 de 2016).',
    stages: [
      { id: 'eps', title: 'Reclamos ante la EPS o la clínica', desc: 'El primer paso: deja prueba escrita y activa los plazos de respuesta.' },
      { id: 'especiales', title: 'Situaciones especiales', desc: 'Migrantes, insumos, salud mental, cuidados paliativos, IVE y datos de afiliación.' },
      { id: 'control', title: 'Secretaría de Salud y Supersalud', desc: 'Si la EPS no resuelve: reclamo, queja o demanda sin abogado.' },
      { id: 'tutela', title: 'Ante un juez', desc: 'Tutelas, impugnaciones y desacatos cuando hay urgencia o no cumplen.' },
      { id: 'calificacion', title: 'Calificación de invalidez', desc: 'Pérdida de capacidad laboral (PCL): solicitud y desacuerdo con el dictamen.' },
      { id: 'soat', title: 'Accidentes de tránsito (SOAT)', desc: 'Atención sin cobro e indemnizaciones con SOAT o ADRES.' },
    ],
    route_steps: [
      { title: 'Reclamo escrito a la EPS', code: 'S01', text: 'Deja prueba y activa los plazos de 24, 48 o 72 horas según el riesgo.' },
      { title: 'Reclamo ante la Supersalud', code: 'S13', text: 'Si la EPS no resuelve. Sirve como prueba de la barrera.' },
      { title: 'Tutela', code: 'S15', text: 'Si hay riesgo para la vida, la integridad o la dignidad. No exige los pasos anteriores, pero tenerlos fortalece el caso.' },
      { title: 'Demanda ante la Supersalud', code: 'S14', text: 'Para reembolsos o casos sin urgencia vital. No requiere abogado.' },
      { title: 'Desacato', code: 'S18', text: 'Si no cumplen el fallo de tutela. Si el juez se demora, vigilancia judicial.' },
    ],
    deadlines: [
      ['Reclamo de riesgo vital', '24 horas'],
      ['Reclamo de riesgo priorizado', '48 horas'],
      ['Reclamo de riesgo simple', '72 horas'],
      ['Petición general / información / copias', '15 / 10 / 3 días hábiles'],
      ['Medicamentos pendientes', 'Máximo 48 horas, incluso a domicilio'],
      ['Fallo de tutela', '10 días'],
      ['Supersalud (función jurisdiccional)', '20 días (cobertura) · 60 días (reembolsos)'],
      ['Desacuerdo con dictamen de PCL', '10 días'],
    ],
    rules: [
      'Ley Estatutaria 1751 de 2015: la salud es un derecho fundamental; integralidad, continuidad y prohibición de barreras.',
      'Sentencia T-760 de 2008: derecho a los servicios que se requieren con necesidad.',
      'Sentencia SU-508 de 2020: lo que no está expresamente excluido está incluido (pañales, sillas de ruedas, transporte, enfermería).',
      'Incapacidades: días 1-2 el empleador; 3-180 la EPS; 181-540 el fondo de pensiones; más de 540 la EPS.',
    ],
    warnings: [
      'Adjunta siempre la orden del médico tratante: es la prueba central de cualquier reclamo o tutela.',
      'Para pañales, sillas de ruedas e insumos, pide que el médico registre la prescripción en MIPRES cuando aplique.',
      'La tutela por incapacidades exige demostrar que es tu único ingreso (mínimo vital).',
      'Verifica si tu EPS está intervenida o en liquidación: cambia a quién se dirige la acción.',
    ],
    lawyer: [
      'Responsabilidad médica (reparación directa contra una E.S.E. o demanda civil contra IPS privadas).',
      'Demandas laborales de seguridad social (incapacidades o pensiones de invalidez en disputa).',
      'Denuncias penales por lesiones u homicidio culposo en la atención.',
    ],
    channels: ['supersalud', 'adres', 'minsalud', 'invima', 'junta-calificacion', 'etica-medica', 'tutela-en-linea', 'defensoria'],
  },
  {
    id: 'servicios',
    route: 'app/servicios-publicos/',
    title: 'Servicios públicos',
    icon: 'water_drop',
    tone: 'sun',
    tagline: 'Agua, luz, gas y aseo: facturas altas, cortes, cobros y reconexiones',
    intro: 'Documentos para reclamar a la empresa de acueducto, energía, gas o aseo, recurrir su respuesta y acudir a la Superservicios.',
    context: 'Norma central: Ley 142 de 1994 (artículos 9 y 128 a 159). En energía y gas sigue vigente la Resolución CREG 108 de 1997; el nuevo régimen de usuarios aún es proyecto.',
    stages: [
      { id: 'reclamo', title: 'Reclamo ante la empresa', desc: 'Facturas, cortes, daños, calidad del servicio, estrato y conexiones.' },
      { id: 'cobros', title: 'Cobros indebidos y datos', desc: 'Recuperación de consumos, deudas ajenas, cobros de terceros, centrales de riesgo y prescripción.' },
      { id: 'recursos', title: 'Si la respuesta no te sirve', desc: 'Recursos, silencio administrativo positivo y Superservicios.' },
      { id: 'proteccion', title: 'Hogares que necesitan protección', desc: 'Acuerdos de pago y tutela por el mínimo vital de agua.' },
      { id: 'comunidad', title: 'Problemas del barrio', desc: 'Requerimiento previo y acción popular por servicios deficientes.' },
    ],
    route_steps: [
      { title: 'Reclamo ante la empresa', code: 'SP01', text: 'Dentro de los 5 meses siguientes a la factura. La empresa responde en 15 días hábiles.' },
      { title: 'Reposición y en subsidio apelación', code: 'SP02', text: 'En un solo escrito, 5 días hábiles desde la notificación. Es un plazo fatal.' },
      { title: 'Recurso de queja', code: 'SP03', text: 'Si la empresa niega la apelación: ante la Superservicios, 5 días.' },
      { title: 'Silencio administrativo positivo', code: 'SP04', text: 'Si la empresa no respondió a tiempo, debe reconocerlo en 72 horas.' },
      { title: 'Nulidad y restablecimiento del derecho', text: 'Agotada la vía, con abogado, dentro de 4 meses.' },
    ],
    deadlines: [
      ['Reclamar contra una factura', '5 meses desde su expedición'],
      ['Respuesta de la empresa', '15 días hábiles (si no, silencio positivo)'],
      ['Reposición y apelación', '5 días hábiles (plazo fatal)'],
      ['Recurso de queja', '5 días'],
      ['Reconocer el silencio positivo', '72 horas'],
      ['Demanda (con abogado)', '4 meses'],
    ],
    rules: [
      'Mínimo vital de agua: si en el hogar viven personas de especial protección, no se puede suspender totalmente el acueducto; deben garantizar al menos 50 litros diarios por persona (T-717 de 2010, T-740 de 2011, T-093 de 2015).',
      'Recuperación de consumos: exige debido proceso y no puede ir más allá de cinco meses salvo dolo del usuario (SU-1010 de 2008 y art. 150 de la Ley 142).',
      'La tutela no sirve para obtener el servicio cuando persiste una conexión irregular (T-188 de 2026).',
    ],
    warnings: [
      'El plazo de 5 días hábiles para recurrir es fatal: si se pierde, la factura queda en firme.',
      'Para que tramiten el recurso, paga lo no reclamado o el promedio de los últimos cinco periodos.',
      'No proceden reclamos contra facturas de más de cinco meses. Revisa la fecha de expedición.',
      'Guarda el número de radicado de todo: sin él no puedes probar el silencio positivo.',
      'Antes de pedir la prescripción de una deuda, no firmes acuerdos de pago ni reconozcas la deuda.',
    ],
    lawyer: ['Nulidad y restablecimiento del derecho contra la decisión definitiva de la empresa o la Superservicios.'],
    channels: ['superservicios', 'te-resuelvo', 'creg', 'cra', 'sic', 'datacredito', 'transunion', 'defensoria'],
  },
  {
    id: 'transito',
    route: 'app/transito/',
    title: 'Tránsito',
    icon: 'directions_car',
    tone: 'rose',
    tagline: 'Comparendos, fotomultas, cobros coactivos, embargos y prescripción',
    intro: 'Documentos para defenderte de un comparendo, recurrir la sanción, frenar el cobro coactivo y reclamar por fotomultas irregulares.',
    context: 'Antes de radicar, verifica siempre la norma vigente a la fecha de la infracción. La Sentencia C-038 de 2020 (responsabilidad del propietario en fotomultas) solo aplica hacia el futuro.',
    stages: [
      { id: 'comparendo', title: 'Recibiste un comparendo', desc: 'Impugnarlo a tiempo, pedir tu expediente, descargos y vehículos en patios.' },
      { id: 'fotomultas', title: 'Fotomultas y cámaras', desc: 'Conductor distinto, vehículo vendido, cámaras sin requisitos y organismos investigados.' },
      { id: 'sancion', title: 'Ya te sancionaron', desc: 'Recursos, caducidad, revocatoria y silencio positivo.' },
      { id: 'cobro', title: 'Te están cobrando', desc: 'Prescripción, excepciones, embargos, SIMIT, devoluciones y acuerdos de pago.' },
      { id: 'quejas', title: 'Quejas y control', desc: 'Supertransporte, queja disciplinaria e impulso de trámites.' },
      { id: 'judicial', title: 'Ante un juez', desc: 'Tutelas, desacato, acción de cumplimiento y demandas con abogado.' },
    ],
    route_steps: [
      { title: 'Pide tu expediente', code: '01', text: 'Si no conoces el expediente o dudas de la notificación. Responden en 10 días hábiles.' },
      { title: 'Impugna el comparendo', code: '12', text: 'Dentro de los 11 días hábiles siguientes a recibirlo.' },
      { title: 'Caducidad', code: '03', text: 'Si pasó más de 1 año desde la infracción sin sanción, o el recurso lleva más de 1 año sin resolverse.' },
      { title: 'Prescripción', code: '04', text: 'Si pasaron 3 años sin mandamiento de pago notificado.' },
      { title: 'Excepciones', code: '02', text: 'Si ya te notificaron mandamiento de pago: 15 días.' },
      { title: 'Tutela', code: '07', text: 'Si no responden tu petición o responden sin fondo.' },
    ],
    deadlines: [
      ['Impugnar comparendo (cámara)', '11 días hábiles'],
      ['Impugnar comparendo impuesto en vía', '5 días hábiles'],
      ['Caducidad (art. 161 CNTT)', '1 año'],
      ['Prescripción (art. 159 CNTT)', '3 años'],
      ['Excepciones al mandamiento de pago', '15 días'],
      ['Reposición contra rechazo de excepciones', '1 mes'],
      ['Renuencia (antes de la acción de cumplimiento)', '10 días'],
      ['Nulidad y restablecimiento (con abogado)', '4 meses'],
    ],
    rules: [
      'La prescripción y la falta de título deben alegarse como excepciones dentro de los 15 días si ya hay mandamiento de pago notificado.',
      'Pérdida de fuerza ejecutoria (art. 91 CPACA): procede si a los cinco años de estar en firme el acto no se ha ejecutado.',
      'Fotomultas de los organismos investigados por la Supertransporte (19 de mayo de 2026): si no has pagado, minuta 32; si ya pagaste, minuta 33.',
    ],
    warnings: [
      'La acción de cumplimiento suele rechazarse si se usa para pedir prescripción o caducidad: úsala para deberes concretos.',
      'La tutela por debido proceso es excepcional: sobre todo si nunca hubo notificación y hay un perjuicio grave, como un embargo.',
      'Desde septiembre de 2026, los comparendos por dispositivos móviles exigen un agente de tránsito identificado (no es retroactivo).',
    ],
    lawyer: [
      'Nulidad y restablecimiento del derecho contra la sanción o actos del cobro coactivo (4 meses).',
      'Reparación directa por embargos o cobros ilegales (2 años).',
      'Devoluciones masivas a un grupo de afectados por la misma cámara.',
    ],
    channels: ['simit', 'runt', 'supertransporte', 'mintransporte', 'procuraduria', 'judicatura', 'tutela-en-linea'],
  },
];

export const getArea = (id) => AREAS.find((a) => a.id === id);
