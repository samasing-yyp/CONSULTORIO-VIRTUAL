/**
 * Documento privado de constitución de una SAS (Ley 1258 de 2008).
 * Estructura estudiada en el modelo público de la Cámara de Comercio de
 * Bucaramanga: encabezado de accionistas, estatutos en cinco capítulos y
 * determinaciones relativas a la constitución. Estatutos condensados y
 * redactados de nuevo; las reglas de capital se validan en vivo.
 */
import { TIPOS_DOC, docAbbr } from '../legal-clauses.js';
import { fechaEnLetras, pesosEnLetras, numeroALetras, formatCOP, today, isoDate } from '../../tools/legal-utils.js';

const num = (x) => Number(x) || 0;
const n2 = (n) => `${numeroALetras(n)} (${Number(n).toLocaleString('es-CO')})`;

function capital(v) {
  const vn = num(v.valorNominal);
  const suscritas = (v.accionistas || []).reduce((s, a) => s + num(a.acciones), 0);
  const autorizadas = num(v.accionesAutorizadas);
  const pagadas = v.pagoTotal ? suscritas : num(v.accionesPagadas);
  return { vn, suscritas, autorizadas, pagadas };
}

const PARAGRAFO_PAGO = {
  total: 'El capital suscrito ha sido pagado en su totalidad, en dinero efectivo, al momento de la constitución.',
  parcial: 'El saldo del capital suscrito pendiente de pago se cancelará en dinero efectivo dentro de los {{plazoPago}} meses siguientes a la inscripción de este documento en el registro mercantil.',
};

export default {
  id: 'constitucion-sas',
  title: 'Constitución de SAS',
  summary: 'Documento privado de constitución y estatutos de una Sociedad por Acciones Simplificada.',
  icon: 'domain_add',
  tone: 'sun',
  category: 'empresa',
  plan: 'premium',
  filePrefix: 'constitucion-sas',
  nameField: 'denominacion',
  labels: {
    razon: 'razón social', vnTxt: 'valor nominal', autTxt: 'capital autorizado', autAcc: 'número de acciones',
    susTxt: 'capital suscrito', susAcc: 'número de acciones', pagTxt: 'capital pagado', pagAcc: 'acciones pagadas', fechaLetras: 'fecha',
  },
  channels: ['vue', 'rues', 'camara-comercio', 'dian'],

  guide: {
    que: 'Es el documento con el que una o varias personas crean una SAS: define el nombre, el objeto, el capital, las acciones y quién la representa. Se inscribe en la Cámara de Comercio.',
    cuando: ['Quieres formalizar tu negocio como empresa.', 'Necesitas separar tu patrimonio personal del de la empresa.'],
    anexos: ['Copia del documento de identidad de cada accionista.', 'Carta de aceptación de los representantes legales (y del revisor fiscal, si aplica) que no sean accionistas.', 'Formulario RUES y, para obtener el NIT, el PRE-RUT.'],
    tips: ['Consulta la homonimia del nombre en el RUES antes de firmar.', 'El valor nominal de la acción es el mismo para el capital autorizado, suscrito y pagado.', 'El capital suscrito puede pagarse en un plazo máximo de dos años (art. 9 de la Ley 1258 de 2008).'],
  },

  despacho: {
    donde: 'Inscríbela en la Cámara de Comercio del domicilio principal, de forma virtual (VUE) o en sede.',
    pasos: ['Firma el documento todos los accionistas.', 'Haz la presentación personal ante la Cámara de Comercio o notaría, o usa firma electrónica en la plataforma virtual.', 'Diligencia el formulario RUES y el PRE-RUT.', 'Paga los derechos de inscripción y el impuesto de registro.'],
  },

  steps: [
    {
      id: 'accionistas',
      title: 'Accionistas',
      intro: 'Quiénes constituyen la sociedad y cuántas acciones suscribe cada uno.',
      fields: [
        { id: 'accionistas', type: 'repeat', label: 'Accionistas', itemLabel: 'Accionista', addLabel: 'Agregar accionista', min: 1, max: 10,
          fields: [
            { id: 'nombre', type: 'text', label: 'Nombre completo', short: 'nombre del accionista', required: true },
            { id: 'nacionalidad', type: 'text', label: 'Nacionalidad', short: 'nacionalidad', default: 'colombiana', half: true },
            { id: 'tipoDoc', type: 'select', label: 'Documento', half: true, default: 'cédula de ciudadanía', options: TIPOS_DOC.slice(0, 4).map(({ value, label }) => ({ value, label })) },
            { id: 'numDoc', type: 'text', label: 'Número', short: 'número de documento', required: true, half: true },
            { id: 'domicilio', type: 'text', label: 'Ciudad de domicilio', short: 'domicilio', required: true, half: true },
            { id: 'acciones', type: 'number', label: 'Acciones que suscribe', short: 'acciones suscritas', required: true, half: true },
          ] },
      ],
    },
    {
      id: 'sociedad',
      title: 'La sociedad',
      fields: [
        { id: 'denominacion', type: 'text', label: 'Nombre de la sociedad (sin «S.A.S.»)', short: 'denominación', required: true, placeholder: 'Ej.: Panadería La Esquina', help: 'Se agrega «S.A.S.» automáticamente. Verifica antes que no exista en el RUES.' },
        { id: 'objeto', type: 'textarea', label: 'Objeto social principal', short: 'objeto social', required: true, rows: 4, placeholder: 'Ej.: La producción y comercialización de productos de panadería y repostería.' },
        { id: 'domicilio', type: 'text', label: 'Domicilio principal (ciudad)', short: 'domicilio', required: true, half: true },
        { id: 'direccion', type: 'text', label: 'Dirección para notificaciones', short: 'dirección', required: true, half: true },
        { id: 'emailNotif', type: 'email', label: 'Correo para notificaciones judiciales', short: 'correo', half: true },
        { id: 'duracion', type: 'select', label: 'Duración', half: true, default: 'indefinida', options: [
          { value: 'indefinida', label: 'Indefinida' }, { value: 'fija', label: 'Por un número de años' },
        ] },
        { id: 'anios', type: 'number', label: 'Años de duración', short: 'años', required: true, half: true, when: (v) => v.duracion === 'fija' },
      ],
    },
    {
      id: 'capital',
      title: 'Capital',
      intro: 'Autorizado: el máximo al que aspira la sociedad. Suscrito: lo que los accionistas se comprometen a pagar. Pagado: lo que entregan hoy.',
      fields: [
        { id: 'valorNominal', type: 'money', label: 'Valor nominal de cada acción', short: 'valor nominal', required: true, half: true, default: '1000' },
        { id: 'accionesAutorizadas', type: 'number', label: 'Acciones autorizadas', short: 'acciones autorizadas', required: true, half: true },
        { id: 'pagoTotal', type: 'checkbox', label: 'El capital suscrito se paga completo al constituir', default: true },
        { id: 'accionesPagadas', type: 'number', label: 'Acciones pagadas hoy', short: 'acciones pagadas', required: true, half: true, when: (v) => !v.pagoTotal },
        { id: 'plazoPago', type: 'number', label: 'Plazo para pagar el resto (meses)', short: 'plazo', required: true, half: true, default: '12', when: (v) => !v.pagoTotal, validate: (x) => (Number(x) > 24 || Number(x) < 1 ? 'El plazo debe estar entre 1 y 24 meses.' : null) },
      ],
    },
    {
      id: 'administracion',
      title: 'Representación',
      fields: [
        { id: 'sistemaRL', type: 'radio', label: 'Representación legal', default: 'suplente', options: [
          { value: 'unico', label: 'Un representante legal' },
          { value: 'suplente', label: 'Representante legal y un suplente', desc: 'El suplente reemplaza al principal en sus faltas.' },
        ] },
        { id: 'rl_nombre', type: 'text', label: 'Representante legal', short: 'representante legal', required: true, half: true },
        { id: 'rl_numDoc', type: 'text', label: 'Cédula del representante legal', short: 'cédula', required: true, half: true },
        { id: 'sup_nombre', type: 'text', label: 'Suplente', short: 'suplente', required: true, half: true, when: (v) => v.sistemaRL === 'suplente' },
        { id: 'sup_numDoc', type: 'text', label: 'Cédula del suplente', short: 'cédula', required: true, half: true, when: (v) => v.sistemaRL === 'suplente' },
        { id: 'revisor', type: 'checkbox', label: 'Nombrar revisor fiscal', help: 'Obligatorio solo si la sociedad supera los topes de activos o ingresos de ley.' },
        { id: 'rf_nombre', type: 'text', label: 'Revisor fiscal', short: 'revisor fiscal', required: true, half: true, when: (v) => v.revisor },
        { id: 'rf_tp', type: 'text', label: 'Tarjeta profesional', short: 'tarjeta profesional', required: true, half: true, when: (v) => v.revisor },
        { id: 'ciudadFirma', type: 'text', label: 'Ciudad de firma', short: 'ciudad', required: true, half: true },
        { id: 'fechaFirma', type: 'date', label: 'Fecha de firma', short: 'fecha', required: true, half: true, default: () => isoDate(today()) },
      ],
    },
  ],

  computed(v) {
    const k = capital(v);
    const c = {
      razon: v.denominacion ? `${v.denominacion.trim()} S.A.S.` : '',
      fechaLetras: fechaEnLetras(v.fechaFirma),
      nAcc: (v.accionistas || []).length,
    };
    if (k.vn) {
      c.vnTxt = pesosEnLetras(k.vn);
      if (k.autorizadas) { c.autTxt = pesosEnLetras(k.autorizadas * k.vn); c.autAcc = n2(k.autorizadas); }
      if (k.suscritas) { c.susTxt = pesosEnLetras(k.suscritas * k.vn); c.susAcc = n2(k.suscritas); }
      if (k.pagadas) { c.pagTxt = pesosEnLetras(k.pagadas * k.vn); c.pagAcc = n2(k.pagadas); }
    }
    return c;
  },

  /** Panel lateral: resumen del capital con validación. */
  deadline(v) {
    const k = capital(v);
    if (!k.vn || !k.suscritas) return { tone: 'info', title: 'Capital', text: 'Completa las acciones de cada accionista y el valor nominal para ver el resumen.' };
    const errs = this.check(v);
    const resumen = `Autorizado ${formatCOP(k.autorizadas * k.vn)} · Suscrito ${formatCOP(k.suscritas * k.vn)} · Pagado ${formatCOP(k.pagadas * k.vn)}`;
    if (errs.length) return { tone: 'danger', title: 'Revisa el capital', text: `${errs[0].msg} ${resumen}` };
    return { tone: 'ok', title: 'Capital consistente', text: resumen };
  },

  check(v) {
    const k = capital(v);
    const e = [];
    if (k.autorizadas && k.suscritas > k.autorizadas) e.push({ id: 'accionesAutorizadas', msg: `Las acciones suscritas (${k.suscritas}) superan las autorizadas (${k.autorizadas}).`, step: 2 });
    if (!v.pagoTotal && k.pagadas > k.suscritas) e.push({ id: 'accionesPagadas', msg: `Las acciones pagadas (${k.pagadas}) superan las suscritas (${k.suscritas}).`, step: 2 });
    if (k.vn && k.vn <= 0) e.push({ id: 'valorNominal', msg: 'El valor nominal debe ser mayor que cero.', step: 2 });
    return e;
  },

  annexes(v) {
    const a = ['Copia del documento de identidad de cada accionista.'];
    const accionistas = (v.accionistas || []).map((x) => (x.nombre || '').trim().toLowerCase());
    const noAcc = (n) => n && !accionistas.includes(n.trim().toLowerCase());
    if (noAcc(v.rl_nombre)) a.push(`Carta de aceptación de ${v.rl_nombre} como representante legal.`);
    if (v.sistemaRL === 'suplente' && noAcc(v.sup_nombre)) a.push(`Carta de aceptación de ${v.sup_nombre} como suplente.`);
    if (v.revisor && v.rf_nombre) a.push(`Carta de aceptación del revisor fiscal ${v.rf_nombre}, con copia de su tarjeta profesional.`);
    return a;
  },

  document(v) {
    const accs = v.accionistas || [];
    const plural = accs.length > 1;
    const personas = accs.map((a, i) => `**{{accionistas.${i}.nombre|upper}}**, de nacionalidad {{accionistas.${i}.nacionalidad}}, identificado(a) con {{accionistas.${i}.tipoDoc}} No. {{accionistas.${i}.numDoc}}, domiciliado(a) en {{accionistas.${i}.domicilio}}`);
    const encabezado = `${personas.join('; ')}, ${plural ? 'declaran' : 'declara'} previamente al establecimiento y a la firma de los presentes estatutos, haber decidido constituir una sociedad por acciones simplificada denominada **{{razon|upper}}**, que se regirá por los siguientes:`;
    const suscripcion = accs.map((a, i) => `{{accionistas.${i}.nombre}}: {{accionistas.${i}.acciones}} acciones.`);
    const art = (n, titulo, texto) => ({ t: 'p', text: `**Artículo ${n}. ${titulo}.** ${texto}` });
    let n = 0;
    const A = (titulo, texto) => art(++n, titulo, texto);

    const rl = v.sistemaRL === 'suplente'
      ? 'La representación legal estará a cargo de un representante legal, quien tendrá un suplente que lo reemplazará en sus faltas absolutas, temporales o accidentales, con las mismas facultades. Ambos serán designados por la asamblea general de accionistas por el término que esta determine.'
      : 'La representación legal estará a cargo de un representante legal designado por la asamblea general de accionistas por el término que esta determine.';

    return [
      { t: 'lines', align: 'center', lines: ['**DOCUMENTO PRIVADO DE CONSTITUCIÓN**', '**{{razon|upper}}**'] },
      { t: 'p', text: encabezado },
      { t: 'h', text: 'ESTATUTOS' },
      { t: 'h', text: 'CAPÍTULO I · DISPOSICIONES GENERALES' },
      A('Forma', 'La compañía que por este documento se constituye es una sociedad por acciones simplificada, de naturaleza comercial, denominada {{razon}}, regida por estos estatutos, por la Ley 1258 de 2008 y por las demás normas aplicables. En todos sus actos y documentos la denominación irá seguida de las palabras «sociedad por acciones simplificada» o de la sigla «S.A.S.».'),
      A('Objeto social', 'La sociedad tendrá como objeto principal: {{objeto}} Así mismo, podrá realizar cualquier otra actividad económica lícita, en Colombia o en el extranjero, y todas las operaciones relacionadas, conexas o complementarias con su objeto.'),
      A('Domicilio', 'El domicilio principal de la sociedad será la ciudad de {{domicilio}} y su dirección para notificaciones judiciales será {{direccion}}' + (v.emailNotif ? ', correo electrónico {{emailNotif}}' : '') + '. La sociedad podrá crear sucursales, agencias o dependencias en otros lugares del país o del exterior, por decisión de la asamblea general de accionistas.'),
      A('Duración', v.duracion === 'fija' ? 'La sociedad tendrá una duración de {{anios}} años contados a partir de la inscripción de este documento en el registro mercantil.' : 'El término de duración de la sociedad será indefinido.'),
      { t: 'h', text: 'CAPÍTULO II · CAPITAL Y ACCIONES' },
      A('Capital autorizado', 'El capital autorizado de la sociedad es de {{autTxt}}, dividido en {{autAcc}} acciones ordinarias de valor nominal de {{vnTxt}} cada una.'),
      A('Capital suscrito', 'El capital suscrito inicial de la sociedad es de {{susTxt}}, dividido en {{susAcc}} acciones ordinarias de valor nominal de {{vnTxt}} cada una, distribuidas así:'),
      { t: 'list', style: 'bullet', items: suscripcion },
      A('Capital pagado', `El capital pagado de la sociedad es de ${v.pagoTotal ? '{{susTxt}}, dividido en {{susAcc}}' : '{{pagTxt}}, dividido en {{pagAcc}}'} acciones ordinarias de valor nominal de {{vnTxt}} cada una. **Parágrafo.** ${v.pagoTotal ? PARAGRAFO_PAGO.total : PARAGRAFO_PAGO.parcial}`),
      A('Derechos de las acciones', 'Al momento de la constitución todas las acciones son ordinarias, nominativas y de igual valor. Cada acción confiere a su titular un voto en las decisiones de la asamblea general de accionistas y el derecho a participar en las utilidades y en el remanente de la liquidación.'),
      A('Aumento del capital suscrito', 'El capital suscrito podrá aumentarse mediante la emisión de nuevas acciones aprobada por la asamblea general de accionistas, que podrá delegar en el representante legal la elaboración del reglamento de colocación.'),
      A('Derecho de preferencia', 'Salvo decisión en contrario de la asamblea, las nuevas acciones se ofrecerán primero a los accionistas, en proporción al número de acciones que posean al momento de la oferta.'),
      A('Transferencia de acciones', 'La transferencia de acciones se hará mediante endoso del título y su inscripción en el libro de registro de acciones. Cuando la sociedad tenga varios accionistas, la asamblea podrá establecer restricciones a la negociación de acciones en los términos del artículo 13 de la Ley 1258 de 2008.'),
      { t: 'h', text: 'CAPÍTULO III · ÓRGANOS SOCIALES' },
      A('Órganos de la sociedad', 'La sociedad tendrá una asamblea general de accionistas y un representante legal. Mientras la sociedad tenga un solo accionista, este ejercerá todas las atribuciones de la asamblea.'),
      A('Asamblea general de accionistas', 'La asamblea, integrada por los accionistas, se reunirá en forma ordinaria al menos una vez al año, dentro de los tres meses siguientes al cierre del ejercicio, para aprobar los estados financieros, y en forma extraordinaria cuando sea convocada. Podrá reunirse en forma presencial o no presencial, conforme a la ley.'),
      A('Convocatoria', 'La asamblea será convocada por el representante legal mediante comunicación escrita dirigida a cada accionista con una antelación mínima de cinco (5) días hábiles, indicando el orden del día. Los accionistas podrán renunciar a su derecho a ser convocados.'),
      A('Quórum y mayorías', 'La asamblea deliberará con uno o varios accionistas que representen al menos la mitad más una de las acciones suscritas, y decidirá con el voto favorable de la mitad más una de las acciones presentes, salvo las mayorías especiales previstas en la ley.'),
      A('Actas', 'Las decisiones de la asamblea se harán constar en actas firmadas por el presidente y el secretario de la reunión, o por el accionista único, y se asentarán en el libro de actas.'),
      A('Representación legal', rl),
      A('Facultades del representante legal', 'El representante legal podrá celebrar y ejecutar todos los actos y contratos comprendidos en el objeto social o que se relacionen directamente con la existencia y el funcionamiento de la sociedad, sin límite de cuantía, salvo las restricciones que establezca la asamblea.'),
      v.revisor ? A('Revisor fiscal', 'La sociedad tendrá un revisor fiscal, contador público, designado por la asamblea general de accionistas, con las funciones previstas en la ley.') : null,
      { t: 'h', text: 'CAPÍTULO IV · ESTADOS FINANCIEROS Y UTILIDADES' },
      A('Ejercicio social', 'El ejercicio social será anual y se cerrará el 31 de diciembre de cada año. Al cierre, el representante legal presentará a la asamblea los estados financieros de fin de ejercicio.'),
      A('Utilidades', 'Las utilidades se repartirán entre los accionistas en proporción a sus acciones, una vez aprobados los estados financieros y efectuadas las apropiaciones que ordene la ley o la asamblea.'),
      { t: 'h', text: 'CAPÍTULO V · DISOLUCIÓN Y LIQUIDACIÓN' },
      A('Disolución', 'La sociedad se disolverá por las causales previstas en el artículo 34 de la Ley 1258 de 2008 y por decisión de la asamblea general de accionistas.'),
      A('Liquidación', 'La liquidación se adelantará conforme al procedimiento previsto para las sociedades de responsabilidad limitada. Actuará como liquidador el representante legal o la persona que designe la asamblea.'),
      { t: 'h', text: 'DETERMINACIONES RELATIVAS A LA CONSTITUCIÓN' },
      { t: 'p', text: `**1. Representación legal.** Se designa como representante legal de {{razon}} a **{{rl_nombre|upper}}**, identificado(a) con cédula de ciudadanía No. {{rl_numDoc}}${v.sistemaRL === 'suplente' ? ', y como suplente a **{{sup_nombre|upper}}**, identificado(a) con cédula de ciudadanía No. {{sup_numDoc}}' : ''}, quienes aceptan el cargo y manifiestan que no tienen incompatibilidades ni restricciones para ejercerlo.` },
      v.revisor ? { t: 'p', text: '**2. Revisor fiscal.** Se designa como revisor fiscal a **{{rf_nombre|upper}}**, con tarjeta profesional No. {{rf_tp}}.' } : null,
      { t: 'p', text: `**${v.revisor ? 3 : 2}. Personificación jurídica.** Una vez inscrito este documento en el registro mercantil, {{razon}} formará una persona jurídica distinta de sus accionistas, conforme al artículo 2 de la Ley 1258 de 2008.` },
      { t: 'p', text: 'Se firma en {{ciudadFirma}}, {{fechaLetras}}.' },
      ...accs.map((a, i) => ({ t: 'sign', lines: [`**{{accionistas.${i}.nombre|upper}}**`, `${docAbbr(a.tipoDoc)} {{accionistas.${i}.numDoc}}`, 'Accionista'] })),
    ];
  },
};
