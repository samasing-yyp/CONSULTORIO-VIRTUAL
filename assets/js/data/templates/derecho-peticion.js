/**
 * Derecho de petición (interés particular, general, documentos o consulta).
 * Referencias: Art. 23 C.P.; Ley 1437 de 2011 sustituida por Ley 1755 de 2015;
 * modelo público de la Personería de Girón. Redacción propia.
 */
import {
  personaFields, identificacion, datosContacto, firma, lugarFechaFields, encabezadoFecha, computedFecha,
  ART_23, ELEMENTOS_PETICION, PLAZOS_PETICION,
} from '../legal-clauses.js';
import { sumarDiasHabiles, diasHabilesEntre, fechaLarga } from '../../tools/legal-utils.js';

const MODALIDADES = {
  particular: { label: 'en interés particular', plazo: 15, ref: 'DERECHO DE PETICIÓN EN INTERÉS PARTICULAR' },
  general: { label: 'en interés general', plazo: 15, ref: 'DERECHO DE PETICIÓN EN INTERÉS GENERAL' },
  documentos: { label: 'de documentos e información', plazo: 10, ref: 'DERECHO DE PETICIÓN DE DOCUMENTOS E INFORMACIÓN' },
  consulta: { label: 'de consulta', plazo: 30, ref: 'DERECHO DE PETICIÓN DE CONSULTA' },
};

export default {
  id: 'derecho-peticion',
  title: 'Derecho de petición',
  summary: 'Pide información, documentos, una actuación o una respuesta a una entidad pública o a una empresa.',
  icon: 'forum',
  tone: '',
  category: 'peticiones',
  plan: 'basico',
  filePrefix: 'derecho-de-peticion',
  nameField: 'nombre',
  channels: ['gov-co', 'sic', 'supersalud', 'defensoria'],

  guide: {
    que: 'Es una solicitud respetuosa que cualquier persona puede presentar ante una autoridad o una empresa para obtener información, documentos o una decisión. No necesitas abogado.',
    cuando: ['Necesitas copias de documentos (historia clínica, certificados, expedientes).', 'Quieres que una entidad actúe o te explique una decisión.', 'Una empresa de servicios no resuelve tu reclamo.'],
    anexos: ['Copia de tu documento de identidad (opcional).', 'Documentos que soporten lo que cuentas (facturas, correos, fotos).'],
    tips: ['Escribe un hecho por renglón y en orden de fechas.', 'Pide cosas concretas: «que me entreguen copia de…», no «que me ayuden».', 'Guarda el número de radicado: con él puedes exigir la respuesta o presentar una tutela.'],
  },

  despacho: {
    donde: 'Radícalo en la ventanilla, el correo de PQRSD o la plataforma de la entidad a la que escribes.',
    pasos: ['Firma el documento.', 'Envíalo por el canal oficial de la entidad y guarda el número de radicado o la constancia de envío.', 'Anota la fecha: desde el día siguiente empiezan a contar los días hábiles para responder.'],
  },

  steps: [
    {
      id: 'tus-datos',
      title: 'Tus datos',
      intro: 'Quién presenta la petición. Así la entidad sabe a quién responder.',
      fields: [...personaFields('', { who: 'tu' })],
    },
    {
      id: 'destinatario',
      title: 'A quién le escribes',
      fields: [
        { id: 'entidadTipo', type: 'radio', label: '¿A quién va dirigida?', default: 'publica', options: [
          { value: 'publica', label: 'Entidad pública', desc: 'Alcaldía, EPS pública, Registraduría, colegio público…' },
          { value: 'privada', label: 'Empresa u organización privada', desc: 'Banco, empresa de servicios, EPS privada, universidad…' },
        ] },
        { id: 'entidad', type: 'text', label: 'Nombre de la entidad o empresa', short: 'entidad', required: true, placeholder: 'Ej.: Secretaría Distrital de Salud' },
        { id: 'dependencia', type: 'text', label: 'Dependencia o cargo (opcional)', short: 'dependencia', placeholder: 'Ej.: Oficina de Atención al Ciudadano' },
        { id: 'entidadCiudad', type: 'text', label: 'Ciudad de la entidad', short: 'ciudad de la entidad', required: true, half: true },
        { id: 'entidadDireccion', type: 'text', label: 'Dirección o correo de la entidad (opcional)', short: 'dirección de la entidad', half: true },
      ],
    },
    {
      id: 'peticion',
      title: 'Tu petición',
      intro: 'Cuenta qué pasó y qué pides. Usa frases cortas.',
      fields: [
        { id: 'modalidad', type: 'radio', label: '¿Qué tipo de petición es?', default: 'particular', options: [
          { value: 'particular', label: 'Interés particular', desc: 'Algo que te afecta a ti. Plazo: 15 días hábiles.' },
          { value: 'documentos', label: 'Documentos o información', desc: 'Copias, certificados, datos. Plazo: 10 días hábiles.' },
          { value: 'consulta', label: 'Consulta', desc: 'Una opinión de la entidad sobre un tema a su cargo. Plazo: 30 días hábiles.' },
          { value: 'general', label: 'Interés general', desc: 'Algo que afecta a tu comunidad. Plazo: 15 días hábiles.' },
        ] },
        { id: 'hechos', type: 'repeat', label: 'Hechos', itemLabel: 'Hecho', addLabel: 'Agregar otro hecho', min: 1, max: 12,
          help: 'Lo que pasó, en orden. Incluye fechas si las conoces.',
          fields: [{ id: 'texto', type: 'textarea', label: 'Hecho', short: 'hecho', required: true, rows: 3, placeholder: 'Ej.: El 3 de octubre de 2026 solicité una cita y no me la asignaron.' }] },
        { id: 'peticiones', type: 'repeat', label: 'Lo que pides', itemLabel: 'Petición', addLabel: 'Agregar otra petición', min: 1, max: 10,
          help: 'Una solicitud concreta por cada recuadro.',
          fields: [{ id: 'texto', type: 'textarea', label: 'Petición', short: 'petición', required: true, rows: 2, placeholder: 'Ej.: Que se me entregue copia completa de mi historia clínica.' }] },
      ],
    },
    {
      id: 'cierre',
      title: 'Anexos y firma',
      fields: [
        { id: 'anexos', type: 'repeat', label: 'Anexos (opcional)', itemLabel: 'Anexo', addLabel: 'Agregar anexo', min: 0, max: 10,
          fields: [{ id: 'texto', type: 'text', label: 'Documento anexo', short: 'anexo', placeholder: 'Ej.: Copia de la factura del 2 de octubre' }] },
        { id: 'medioRespuesta', type: 'radio', label: '¿Cómo quieres recibir la respuesta?', default: 'correo', options: [
          { value: 'correo', label: 'Por correo electrónico' },
          { value: 'fisica', label: 'En mi dirección física' },
        ] },
        ...lugarFechaFields(),
        { id: 'fechaRadicacion', type: 'date', label: '¿Ya la radicaste? Fecha de radicación (opcional)', short: 'fecha de radicación', help: 'Solo sirve para calcular el plazo de respuesta. No aparece en el documento.', noDoc: true },
      ],
    },
  ],

  computed(v) {
    const mod = MODALIDADES[v.modalidad] || MODALIDADES.particular;
    return { ...computedFecha(v), modalidadLabel: mod.label, modalidadRef: mod.ref, plazo: String(mod.plazo) };
  },

  /** Panel de plazo en la barra lateral. */
  deadline(v) {
    const mod = MODALIDADES[v.modalidad] || MODALIDADES.particular;
    if (!v.fechaRadicacion) {
      return { tone: 'info', title: `Plazo de respuesta: ${mod.plazo} días hábiles`, text: 'Si ya radicaste la petición, escribe la fecha en el último paso y te diremos si ya venció.' };
    }
    const vence = sumarDiasHabiles(v.fechaRadicacion, mod.plazo);
    const usados = diasHabilesEntre(v.fechaRadicacion);
    if (usados > mod.plazo) {
      return { tone: 'danger', title: 'El plazo ya venció', text: `Vencía el ${fechaLarga(vence)}. Han pasado ${usados} días hábiles. Si no te respondieron, puedes presentar una acción de tutela.`, tutela: true };
    }
    return { tone: 'ok', title: `Vence el ${fechaLarga(vence)}`, text: `Han pasado ${usados} de ${mod.plazo} días hábiles. Te quedan ${mod.plazo - usados}.` };
  },

  annexes(v) {
    return (v.anexos || []).map((a) => a.texto).filter(Boolean);
  },

  document(v) {
    const privada = v.entidadTipo === 'privada';
    const hechos = (v.hechos || []).map((_, i) => `{{hechos.${i}.texto}}`);
    const peticiones = (v.peticiones || []).map((_, i) => `{{peticiones.${i}.texto}}`);
    peticiones.push(
      `Que la respuesta se emita de fondo dentro del término de {{plazo}} días hábiles previsto en la ley y se me envíe ${v.medioRespuesta === 'fisica' ? 'a la dirección física' : 'al correo electrónico'} indicado en el acápite de notificaciones.`,
    );
    const anexos = (v.anexos || []).map((a, i) => (a.texto ? `{{anexos.${i}.texto}}` : null)).filter(Boolean);

    return [
      encabezadoFecha(),
      { t: 'space' },
      { t: 'lines', lines: ['Señores', '**{{entidad|upper}}**', v.dependencia ? '{{dependencia}}' : null, v.entidadDireccion ? '{{entidadDireccion}}' : null, '{{entidadCiudad}}'] },
      { t: 'p', text: '**Referencia: {{modalidadRef}}**', align: 'left' },
      {
        t: 'p',
        text: `${identificacion(v)}, en ejercicio del derecho fundamental de petición consagrado en el artículo 23 de la Constitución Política y regulado por la Ley 1755 de 2015${privada ? ', aplicable también a organizaciones privadas según su artículo 32,' : ','} presento respetuosamente la siguiente petición {{modalidadLabel}}, con fundamento en los siguientes:`,
      },
      { t: 'h', text: 'HECHOS' },
      { t: 'list', style: 'ordinal', items: hechos },
      { t: 'h', text: 'PETICIONES' },
      { t: 'p', text: 'De manera respetuosa solicito:' },
      { t: 'list', style: 'ordinal', items: peticiones },
      { t: 'h', text: 'FUNDAMENTOS DE DERECHO' },
      { t: 'p', text: ART_23 },
      { t: 'p', text: PLAZOS_PETICION },
      { t: 'p', text: ELEMENTOS_PETICION },
      anexos.length ? { t: 'h', text: 'ANEXOS' } : null,
      anexos.length ? { t: 'list', style: 'num', items: anexos } : null,
      { t: 'h', text: 'NOTIFICACIONES' },
      { t: 'p', text: 'Recibiré respuesta en:', align: 'left' },
      { t: 'lines', lines: datosContacto(v) },
      { t: 'p', text: 'Atentamente,', align: 'left' },
      firma(v),
    ];
  },
};
