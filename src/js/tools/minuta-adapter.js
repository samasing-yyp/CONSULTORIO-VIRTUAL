/**
 * Convierte una minuta importada (tools/import_minutas.py) en una plantilla
 * del generador: agrega los datos de la persona, el lugar y la fecha,
 * convierte las condiciones en funciones y arma la guía y el despacho.
 */
import { personaFields, lugarFechaFields, computedFecha, docAbbr } from '../data/legal-clauses.js';
import { evalCond, parseInline } from './template-engine.js';
import { getArea } from '../data/areas.js';
import { slug } from '../core/ui.js';

/** Texto plano de un fragmento (para listas de anexos en el despacho). */
function plain(text, values) {
  return parseInline(text, { values, computed: {}, labels: {} })
    .map((s) => (s.field && s.empty ? '____' : s.text))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Une párrafos cortos consecutivos (destinatario, notificaciones) en un bloque de renglones. */
function mergeTight(blocks) {
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.t === 'p' && b.tight) {
      const line = b.if ? { text: b.text, if: b.if } : b.text;
      if (prev && prev.t === 'lines' && prev._tight) prev.lines.push(line);
      else out.push({ t: 'lines', lines: [line], align: 'left', _tight: true });
    } else out.push(b);
  }
  return out;
}

export function adaptMinuta(meta, def) {
  const area = getArea(meta.area);
  const byId = Object.fromEntries(
    def.fields.map((f) => {
      const g = { ...f };
      if (typeof g.when === 'string') {
        const cond = g.when;
        g.when = (v) => evalCond(cond, v);
      }
      if (g.type === 'date') g.type = 'text'; // fechas en texto libre: «3 de octubre de 2026»
      return [g.id, g];
    }),
  );
  const blocks = mergeTight(def.blocks);

  // Anexos y pruebas: elementos de lista bajo un título ANEXOS / PRUEBAS
  const annexBlocks = [];
  let inAnnex = false;
  for (const b of blocks) {
    if (b.t === 'h') inAnnex = /ANEXOS|PRUEBAS/.test(b.text);
    else if (inAnnex && b.t === 'list') annexBlocks.push(b);
  }

  const steps = [
    { id: 'persona', title: 'Tus datos', intro: 'Quién firma el documento. Puedes guardarlos para no escribirlos otra vez.', fields: personaFields('', { who: 'tu' }) },
    ...def.steps.map((s) => ({ id: s.id, title: s.title, fields: s.fields.map((id) => byId[id]).filter(Boolean) })),
    { id: 'firma', title: 'Lugar y fecha', fields: lugarFechaFields() },
  ];

  const tips = [];
  if (meta.deadline) tips.push(`Plazo: ${meta.deadline}.`);
  if (meta.lawyer) tips.push('Este trámite se presenta con abogado. La minuta te sirve para preparar la información.');
  if (meta.confidential) tips.push('Información sensible: este documento no se guarda como borrador.');
  tips.push(...(area?.warnings || []).slice(0, 2));

  return {
    id: meta.id,
    title: meta.title,
    summary: meta.summary,
    icon: meta.icon,
    tone: meta.tone,
    category: meta.area,
    area: meta.area,
    code: meta.code,
    plan: meta.plan || 'basico',
    confidential: !!meta.confidential,
    filePrefix: slug(meta.title).slice(0, 48),
    nameField: 'nombre',
    channels: meta.channels || area?.channels?.slice(0, 3) || [],
    notes: def.notes || [],
    guide: {
      que: meta.summary || meta.title,
      cuando: meta.situation ? [meta.situation] : [],
      anexos: annexBlocks.flatMap((b) => b.items.map((it) => plain(typeof it === 'string' ? it : it.text, {}))).slice(0, 8),
      tips,
    },
    despacho: {
      donde: `Ante quién: ${meta.entity || 'la entidad correspondiente'}. Radícalo por su canal oficial (ventanilla, correo de PQRS o plataforma).`,
      pasos: [
        'Revisa el documento completo y firma.',
        'Adjunta los anexos y las pruebas que mencionas.',
        'Radícalo por el canal oficial y guarda el número de radicado o la constancia de envío.',
        meta.deadline ? `Ten presente el plazo: ${meta.deadline}.` : 'Anota la fecha de radicación para calcular los plazos de respuesta.',
      ],
    },
    steps,
    computed: (v) => ({ ...computedFecha(v), docAbbr: docAbbr(v.tipoDoc) }),
    deadline: meta.deadline ? () => ({ tone: 'info', title: 'Plazo clave', text: meta.deadline }) : null,
    annexes(v) {
      return annexBlocks.flatMap((b) =>
        b.items.filter((it) => typeof it === 'string' || !it.if || evalCond(it.if, v)).map((it) => plain(typeof it === 'string' ? it : it.text, v)),
      );
    },
    document: () => blocks,
  };
}
