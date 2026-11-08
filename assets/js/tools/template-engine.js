/**
 * Motor de plantillas.
 *
 * Una plantilla (assets/js/data/templates/*.js) declara:
 *   - steps[].fields[]  → el formulario guiado
 *   - computed(v)       → valores derivados (fechas en letras, plazos, montos…)
 *   - document(v, c)    → lista de bloques del documento
 *
 * Los bloques usan texto con marcas en línea:
 *   **negrita**   y   {{campo}}  /  {{campo|upper}}  /  {{lista.0.sub}}
 *
 * El mismo arreglo de bloques se dibuja en HTML (vista previa en vivo) y en
 * jsPDF (descarga), así lo que se ve es exactamente lo que se descarga.
 *
 * Tipos de bloque:
 *   { t: 'p', text, align?: 'left'|'right'|'center'|'justify', indent? }
 *   { t: 'h', text }                        título de sección centrado
 *   { t: 'lines', lines: [text], align? }   renglones sin espacio entre sí
 *   { t: 'list', style: 'ordinal'|'num'|'bullet'|'alpha', items: [text] }
 *   { t: 'quote', text }                    cita con sangría
 *   { t: 'sign', lines: [text] }            firma
 *   { t: 'space', size? }
 */
import { esc } from '../core/ui.js';
import { ordinal } from './legal-utils.js';

/* ---------- Valores ---------- */

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const FILTERS = {
  upper: (s) => String(s).toLocaleUpperCase('es-CO'),
  lower: (s) => String(s).toLocaleLowerCase('es-CO'),
};

function resolveField(expr, ctx) {
  const [path, ...filters] = expr.split('|').map((s) => s.trim());
  let value = getPath(ctx.computed, path);
  if (value === undefined) value = getPath(ctx.values, path);
  const empty = value == null || String(value).trim() === '';
  let text = empty ? '' : String(value).trim();
  if (!empty) for (const f of filters) if (FILTERS[f]) text = FILTERS[f](text);
  return { text, empty, field: path, label: labelFor(path, ctx.labels) };
}

const wild = (p) => p.replace(/\.\d+\./g, '.*.');
function labelFor(path, labels) {
  const base = path.replace(/(Larga|Letras|Txt)$/, '');
  return (
    labels[path] || labels[wild(path)] || labels[base] || labels[wild(base)] ||
    base.split('.').pop().replace(/^[a-z]+_/, '').replace(/([A-Z])/g, ' $1').toLowerCase()
  );
}

/** Convierte texto con marcas en segmentos {text, bold, field?, empty?, label?}. */
export function parseInline(src, ctx) {
  const segs = [];
  let bold = false;
  const re = /(\*\*)|\{\{([^}]+)\}\}/g;
  let last = 0;
  let m;
  const str = String(src ?? '');
  while ((m = re.exec(str))) {
    if (m.index > last) segs.push({ text: str.slice(last, m.index), bold });
    if (m[1]) bold = !bold;
    else {
      const r = resolveField(m[2], ctx);
      segs.push({ text: r.text, bold, field: r.field, empty: r.empty, label: r.label });
    }
    last = re.lastIndex;
  }
  if (last < str.length) segs.push({ text: str.slice(last), bold });
  return segs;
}

/* ---------- HTML (vista previa) ---------- */

function segsToHTML(segs) {
  return segs
    .map((s) => {
      let inner;
      if (s.field) {
        inner = s.empty
          ? `<span class="v empty" data-f="${esc(s.field)}">${esc(s.label)}</span>`
          : `<span class="v" data-f="${esc(s.field)}">${esc(s.text).replace(/\n/g, '<br>')}</span>`;
      } else inner = esc(s.text).replace(/\n/g, '<br>');
      return s.bold ? `<strong>${inner}</strong>` : inner;
    })
    .join('');
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
function listMarker(style, i) {
  if (style === 'ordinal') return `${ordinal(i + 1)}:`;
  if (style === 'num') return `${i + 1}.`;
  if (style === 'alpha') return `${ALPHA[i]})`;
  return '•';
}

export function renderHTML(blocks, ctx) {
  const inl = (t) => segsToHTML(parseInline(t, ctx));
  return blocks
    .filter(Boolean)
    .map((b) => {
      switch (b.t) {
        case 'h':
          return `<h4 class="doc-h">${inl(b.text)}</h4>`;
        case 'lines':
          return `<p class="doc-lines a-${b.align || 'left'}">${b.lines.filter((l) => l != null).map(inl).join('<br>')}</p>`;
        case 'list':
          return `<div class="doc-list ${b.style || 'num'}">${b.items
            .filter(Boolean)
            .map((it, i) =>
              b.style === 'ordinal'
                ? `<p class="a-justify"><strong>${listMarker(b.style, i)}</strong> ${inl(it)}</p>`
                : `<p class="li a-justify"><span class="mk">${listMarker(b.style, i)}</span><span>${inl(it)}</span></p>`,
            )
            .join('')}</div>`;
        case 'quote':
          return `<p class="doc-quote a-justify">${inl(b.text)}</p>`;
        case 'sign':
          return `<div class="doc-sign"><div class="sign-line"></div>${b.lines.filter((l) => l != null).map(inl).join('<br>')}</div>`;
        case 'space':
          return `<div class="doc-space" style="height:${(b.size || 1) * 0.8}em"></div>`;
        case 'p':
        default:
          return `<p class="a-${b.align || 'justify'}${b.indent ? ' indent' : ''}">${inl(b.text)}</p>`;
      }
    })
    .join('');
}

/* ---------- PDF (jsPDF) ---------- */

const PDF = {
  marginL: 25,
  marginR: 25,
  marginT: 25,
  marginB: 22,
  font: 'times',
  size: 12,
  lineH: 5.7, // mm
  paraGap: 3.2,
};

// La fuente estándar de jsPDF usa WinAnsi: normalizamos caracteres fuera de ese juego.
const pdfSafe = (t) =>
  String(t)
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ');

function segsToWords(segs) {
  // Cada palabra conserva su estilo; '\n' fuerza salto de línea.
  const words = [];
  for (const s of segs) {
    const text = s.field && s.empty ? '__________' : pdfSafe(s.text);
    const parts = text.split(/(\n| +)/);
    for (const p of parts) {
      if (p === '') continue;
      if (p === '\n') words.push({ br: true });
      else if (/^ +$/.test(p)) words.push({ space: true });
      else {
        const prev = words[words.length - 1];
        // Une fragmentos contiguos sin espacio (p. ej. "{{nombre}}," )
        if (prev && !prev.space && !prev.br && prev.glue !== false) {
          prev.parts.push({ text: p, bold: s.bold });
        } else words.push({ parts: [{ text: p, bold: s.bold }] });
      }
    }
  }
  return words;
}

function measure(doc, word) {
  let w = 0;
  for (const part of word.parts) {
    doc.setFont(PDF.font, part.bold ? 'bold' : 'normal');
    w += doc.getTextWidth(part.text);
  }
  return w;
}

function layout(doc, segs, maxW) {
  doc.setFont(PDF.font, 'normal');
  const spaceW = doc.getTextWidth(' ');
  const words = segsToWords(segs);
  const lines = [];
  let line = { words: [], width: 0, forced: false };
  let pendingSpace = false;
  for (const w of words) {
    if (w.br) {
      line.forced = true;
      lines.push(line);
      line = { words: [], width: 0, forced: false };
      pendingSpace = false;
      continue;
    }
    if (w.space) { pendingSpace = line.words.length > 0; continue; }
    const ww = measure(doc, w);
    const add = (line.words.length ? spaceW : 0) + ww;
    if (line.words.length && line.width + add > maxW) {
      lines.push(line);
      line = { words: [], width: 0, forced: false };
    }
    line.words.push({ ...w, w: ww });
    line.width += (line.words.length > 1 ? spaceW : 0) + ww;
    pendingSpace = false;
  }
  if (line.words.length || !lines.length) { line.forced = true; lines.push(line); }
  return { lines, spaceW };
}

export function renderPDF(blocks, ctx, meta = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PDF.marginL - PDF.marginR;
  let y = PDF.marginT;

  doc.setProperties({
    title: pdfSafe(meta.title || 'Documento'),
    subject: pdfSafe(meta.subject || ''),
    creator: 'Consultoría Digital',
  });
  doc.setFontSize(PDF.size);
  doc.setTextColor(20, 20, 20);

  const ensure = (h) => {
    if (y + h > pageH - PDF.marginB) {
      doc.addPage();
      y = PDF.marginT;
    }
  };

  function drawLine(line, x, width, align, isLast, spaceW) {
    let cursor = x;
    let gap = spaceW;
    const n = line.words.length;
    if (align === 'center') cursor = x + (width - line.width) / 2;
    else if (align === 'right') cursor = x + width - line.width;
    else if (align === 'justify' && !isLast && !line.forced && n > 1) gap = spaceW + (width - line.width) / (n - 1);
    for (const w of line.words) {
      for (const part of w.parts) {
        doc.setFont(PDF.font, part.bold ? 'bold' : 'normal');
        doc.text(part.text, cursor, y);
        cursor += doc.getTextWidth(part.text);
      }
      cursor += gap;
    }
  }

  function paragraph(text, { align = 'justify', indent = 0, hang = 0, marker = null, markerBold = false } = {}) {
    const segs = parseInline(text, ctx);
    const x = PDF.marginL + indent + hang;
    const w = contentW - indent - hang;
    const { lines, spaceW } = layout(doc, segs, w);
    lines.forEach((ln, i) => {
      ensure(PDF.lineH);
      if (i === 0) y += 0; // primera línea
      if (i === 0 && marker) {
        doc.setFont(PDF.font, markerBold ? 'bold' : 'normal');
        doc.text(pdfSafe(marker), PDF.marginL + indent, y);
      }
      drawLine(ln, x, w, align, i === lines.length - 1, spaceW);
      y += PDF.lineH;
    });
  }

  for (const b of blocks.filter(Boolean)) {
    switch (b.t) {
      case 'h': {
        ensure(PDF.lineH * 3);
        y += 1.5;
        paragraph(`**${b.text}**`, { align: 'center' });
        y += PDF.paraGap - 1;
        break;
      }
      case 'lines': {
        const ls = b.lines.filter((l) => l != null);
        ensure(Math.min(ls.length, 4) * PDF.lineH);
        ls.forEach((l) => paragraph(l, { align: b.align || 'left' }));
        y += PDF.paraGap;
        break;
      }
      case 'list': {
        b.items.filter(Boolean).forEach((it, i) => {
          if (b.style === 'ordinal') {
            paragraph(`**${listMarker('ordinal', i)}** ${it}`, { align: 'justify' });
          } else {
            paragraph(it, { hang: 7, marker: listMarker(b.style, i) });
          }
          y += PDF.paraGap * 0.6;
        });
        y += PDF.paraGap * 0.5;
        break;
      }
      case 'quote':
        paragraph(b.text, { indent: 10, align: 'justify' });
        y += PDF.paraGap;
        break;
      case 'sign': {
        const ls = b.lines.filter((l) => l != null);
        ensure(18 + ls.length * PDF.lineH);
        y += 14;
        doc.setDrawColor(60);
        doc.setLineWidth(0.3);
        doc.line(PDF.marginL, y - 4, PDF.marginL + 70, y - 4);
        ls.forEach((l) => paragraph(l, { align: 'left' }));
        y += PDF.paraGap;
        break;
      }
      case 'space':
        y += (b.size || 1) * 4;
        break;
      case 'p':
      default:
        paragraph(b.text, { align: b.align || 'justify', indent: b.indent ? 0 : 0 });
        y += PDF.paraGap;
    }
  }

  // Numeración de páginas
  const total = doc.getNumberOfPages();
  if (total > 1) {
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont(PDF.font, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Página ${i} de ${total}`, pageW / 2, pageH - 10, { align: 'center' });
    }
  }
  return doc;
}

/* ---------- Campos ---------- */

/** Recorre todos los campos (incluye subcampos de grupos repetibles). */
export function eachField(template, fn) {
  for (const step of template.steps) {
    for (const f of step.fields) {
      fn(f, step);
      if (f.type === 'repeat') f.fields.forEach((sf) => fn({ ...sf, _parent: f }, step));
    }
  }
}

/** Mapa de etiquetas cortas para mostrar en los vacíos de la vista previa. */
export function labelsOf(template) {
  const labels = {};
  eachField(template, (f) => {
    const key = f._parent ? `${f._parent.id}.*.${f.id}` : f.id;
    labels[key] = (f.short || f.label || f.id).toLowerCase();
  });
  return { ...labels, ...(template.labels || {}) };
}

/** Valores iniciales según los `default` de cada campo. */
export function initialValues(template) {
  const v = {};
  for (const step of template.steps) {
    for (const f of step.fields) {
      if (f.type === 'repeat') {
        const n = f.min ?? 1;
        v[f.id] = Array.from({ length: n }, () => blankItem(f));
      } else if (f.type === 'checkbox') v[f.id] = f.default ?? false;
      else if (f.type === 'checks') v[f.id] = f.default ?? [];
      else v[f.id] = typeof f.default === 'function' ? f.default() : f.default ?? '';
    }
  }
  return v;
}

export function blankItem(repeatField) {
  const item = {};
  repeatField.fields.forEach((sf) => {
    item[sf.id] = sf.type === 'checkbox' ? false : sf.default ?? '';
  });
  return item;
}

export const isVisible = (f, v) => !f.when || !!f.when(v);

const isEmpty = (x) => x == null || (typeof x === 'string' && x.trim() === '') || (Array.isArray(x) && x.length === 0);

/** Valida campos requeridos visibles + reglas propias. Devuelve [{id, msg, step}] */
export function validate(template, v, c) {
  const errors = [];
  template.steps.forEach((step, si) => {
    for (const f of step.fields) {
      if (!isVisible(f, v)) continue;
      if (f.type === 'repeat') {
        (v[f.id] || []).forEach((item, i) => {
          f.fields.forEach((sf) => {
            if (sf.required && isVisible(sf, item) && isEmpty(item[sf.id])) {
              errors.push({ id: `${f.id}.${i}.${sf.id}`, msg: `${f.itemLabel || 'Elemento'} ${i + 1}: falta «${sf.label}».`, step: si });
            }
          });
        });
        if (f.minFilled && (v[f.id] || []).length < f.minFilled) errors.push({ id: f.id, msg: `Agrega al menos ${f.minFilled}.`, step: si });
        continue;
      }
      if (f.required && isEmpty(v[f.id])) errors.push({ id: f.id, msg: `Falta «${f.label}».`, step: si });
      if (f.validate && !isEmpty(v[f.id])) {
        const msg = f.validate(v[f.id], v);
        if (msg) errors.push({ id: f.id, msg, step: si });
      }
    }
  });
  if (template.check) {
    for (const e of template.check(v, c) || []) errors.push({ step: 0, ...e });
  }
  return errors;
}
