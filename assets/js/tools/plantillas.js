/**
 * Generador de documentos con plantilla.
 *  - Sin ?t=  → galería de plantillas.
 *  - Con ?t=id → asistente por pasos + vista previa en vivo + descarga PDF.
 *
 * @icons arrow_back, check, check_circle, close, delete, download, draft, error, lock, menu_book, add,
 * @icons visibility, edit, restart_alt, cloud_done, task_alt, warning, event_available, schedule, chevron_left, chevron_right
 */
import '../components/site-chrome.js';
import '../components/app-notice.js';
import { requireAuth, hasFeature } from '../core/auth.js';
import { ROUTES, url, asset } from '../core/config.js';
import { $, $$, esc, ms, toast, slug, norm, initReveal } from '../core/ui.js';
import { TEMPLATES, CATEGORIES, getTemplate, featureFor } from '../data/templates/index.js';
import { getChannel } from '../data/channels.js';
import { renderHTML, renderPDF, labelsOf, initialValues, blankItem, isVisible, validate } from './template-engine.js';
import { getDraft, saveDraft, removeDraft, setHandoff, takeHandoff } from '../core/drafts.js';
import { formatCOP, pesosEnLetras, isoDate, today } from './legal-utils.js';

const user = requireAuth();
const root = $('[data-root]');
const params = new URLSearchParams(window.location.search);

if (user) {
  const t = getTemplate(params.get('t'));
  if (t) editor(t);
  else gallery();
}

/* ======================================================================
   Galería
   ====================================================================== */
function gallery() {
  let cat = 'todas';
  let q = '';
  root.innerHTML = `
    <section class="app-hero">
      <div class="container">
        <span class="eyebrow">${ms('edit_document')}Documentos con plantilla</span>
        <h1>¿Qué documento necesitas?</h1>
        <p class="lead muted">Elige una plantilla, responde preguntas sencillas y descarga el PDF listo para radicar.</p>
        <div class="gal-tools">
          <label class="search-field">
            ${ms('search')}
            <span class="visually-hidden">Buscar plantilla</span>
            <input type="search" data-q placeholder="Buscar: tutela, cuota, multa, empresa…" autocomplete="off">
          </label>
          <div class="chip-row" role="toolbar" aria-label="Categorías">
            ${Object.entries(CATEGORIES).map(([k, l]) => `<button class="chip" type="button" data-cat="${k}" aria-pressed="${k === cat}">${esc(l)}</button>`).join('')}
          </div>
        </div>
      </div>
    </section>
    <section class="app-section">
      <div class="container">
        <div class="gal-grid" data-list></div>
      </div>
    </section>`;

  const list = $('[data-list]');
  const draw = () => {
    const nq = norm(q);
    const items = TEMPLATES.filter((t) => (cat === 'todas' || t.category === cat) && (!nq || norm(`${t.title} ${t.summary} ${t.guide.que}`).includes(nq)));
    list.innerHTML = items.length
      ? items
          .map((t, i) => {
            const locked = !hasFeature(featureFor(t));
            return `
            <a class="card is-interactive gal-card reveal ${locked ? 'locked' : ''}" style="--reveal-delay:${i * 40}ms" href="?t=${t.id}">
              <div class="gal-card-top">
                <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
                ${t.plan === 'premium' ? `<span class="badge ${locked ? '' : 'badge-premium'}">${ms(locked ? 'lock' : 'workspace_premium', 'fill')}Premium</span>` : '<span class="badge badge-mint">Básico</span>'}
              </div>
              <h3>${esc(t.title)}</h3>
              <p>${esc(t.summary)}</p>
              <span class="go">${locked ? 'Ver detalles' : 'Usar plantilla'} ${ms('arrow_forward')}</span>
            </a>`;
          })
          .join('')
      : `<div class="empty-state">${ms('search')}<span>No encontramos plantillas con «${esc(q)}». Prueba otra palabra o revisa los <a href="${url(ROUTES.canales)}">canales oficiales</a>.</span></div>`;
    initReveal(list);
  };

  $('[data-q]').addEventListener('input', (e) => { q = e.target.value; draw(); });
  $$('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      cat = b.dataset.cat;
      $$('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    }),
  );
  draw();
}

/* ======================================================================
   Editor
   ====================================================================== */
function editor(t) {
  document.title = `${t.title} · Consultoría Digital`;
  const locked = !hasFeature(featureFor(t));
  const canDraft = hasFeature('drafts');
  const labels = labelsOf(t);
  const S = { step: 0, errors: new Map(), focus: null, tab: 'form' };

  // ----- Valores iniciales: traspaso > borrador > valores por defecto
  let values = initialValues(t);
  const handoff = t.id === 'tutela' ? takeHandoff() : null;
  const draft = canDraft && !locked ? getDraft(user, t.id) : null;
  if (handoff) {
    values = { ...values, ...clean(handoff) };
  } else if (draft) {
    values = { ...values, ...draft.values };
  }

  root.innerHTML = `
    <div class="editor ${locked ? 'is-locked' : ''}" data-editor data-tab="form">
      <div class="editor-bar">
        <div class="container-wide eb-inner">
          <a class="icon-btn" href="${url(ROUTES.plantillas)}" aria-label="Volver a plantillas" title="Volver a plantillas">${ms('arrow_back')}</a>
          <div class="eb-title">
            <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
            <div>
              <h1>${esc(t.title)}</h1>
              <span class="eb-sub">${esc(t.summary)}</span>
            </div>
          </div>
          <div class="eb-actions">
            <span class="save-state" data-save aria-live="polite"></span>
            <button class="btn btn-outline btn-sm" type="button" data-open-guide>${ms('menu_book')}<span class="hide-sm">Guía rápida</span></button>
            ${locked ? '' : `<button class="btn btn-primary btn-sm hide-mobile" type="button" data-download>${ms('download')}Descargar PDF</button>`}
          </div>
        </div>
      </div>

      ${locked ? '' : `
      <div class="editor-tabs container-wide">
        <div class="segmented" role="tablist" aria-label="Vista">
          <button type="button" role="tab" data-tab-btn="form" aria-selected="true">${ms('edit')}Llenar</button>
          <button type="button" role="tab" data-tab-btn="preview" aria-selected="false">${ms('visibility')}Vista previa</button>
        </div>
      </div>`}

      <div class="editor-grid container-wide">
        <section class="form-pane" data-pane="form" aria-label="Formulario">
          ${locked ? lockedPanel(t) : `
            <div data-deadline></div>
            <div class="progress-card">
              <div class="progress-head"><span data-step-label></span><span data-progress-label></span></div>
              <div class="progress-track"><span data-progress></span></div>
              <ol class="stepper" data-stepper></ol>
            </div>
            <div class="error-summary" data-error-summary hidden></div>
            <form class="step-form" data-form novalidate autocomplete="on"></form>
            <div class="step-nav">
              <button class="btn btn-outline" type="button" data-prev>${ms('chevron_left')}Anterior</button>
              <button class="btn btn-primary" type="button" data-next>Siguiente${ms('chevron_right')}</button>
            </div>
            <button class="btn btn-ghost btn-sm reset-btn" type="button" data-reset>${ms('restart_alt')}Empezar de nuevo</button>`}
        </section>

        <section class="preview-pane" data-pane="preview" aria-label="Vista previa del documento">
          <div class="preview-head">
            <span>${ms('visibility')}Vista previa en vivo</span>
            <span class="legend"><i></i>Campo por completar</span>
          </div>
          <div class="paper-wrap">
            <article class="paper ${locked ? 'blurred' : ''}" data-paper></article>
            ${locked ? `<div class="paper-lock">${ms('lock', 'fill')}<strong>Vista previa Premium</strong></div>` : ''}
          </div>
        </section>
      </div>

      ${locked ? '' : `
      <div class="mobile-bar">
        <div class="mb-progress"><span data-progress-mobile></span></div>
        <button class="btn btn-primary btn-block" type="button" data-download>${ms('download')}Descargar PDF</button>
      </div>`}
    </div>

    <dialog class="sheet" data-guide-dialog aria-labelledby="guide-title">${guideHTML(t)}</dialog>
    <dialog class="modal despacho" data-despacho aria-labelledby="despacho-title"></dialog>
    <dialog class="modal" data-confirm aria-labelledby="confirm-title"></dialog>`;

  // ----- Guía
  const guideDialog = $('[data-guide-dialog]');
  $('[data-open-guide]').addEventListener('click', () => guideDialog.showModal());
  guideDialog.addEventListener('click', (e) => { if (e.target === guideDialog || e.target.closest('[data-close]')) guideDialog.close(); });

  const paper = $('[data-paper]');

  if (locked) {
    paper.innerHTML = renderHTML(t.document(values, compute()), ctx());
    return;
  }

  if (handoff) toast('Cargamos los datos de tu derecho de petición.', 'task_alt');
  else if (draft) toast('Recuperamos tu borrador guardado.', 'cloud_done');

  const form = $('[data-form]');
  const steps = t.steps;

  /* ---------- Cálculos ---------- */
  function compute() {
    const c = t.computed ? t.computed(values) : {};
    if (t.itemComputed) for (const [k, fn] of Object.entries(t.itemComputed)) c[k] = (values[k] || []).map(fn);
    return c;
  }
  function ctx() { return { values, computed: compute(), labels }; }

  /* ---------- Vista previa ---------- */
  let raf = 0;
  function paint() {
    const c = ctx();
    paper.innerHTML = renderHTML(t.document(values, c.computed), c);
    highlight(S.focus, false);
  }
  // Agrupa cambios rápidos en un solo cuadro; si la pestaña está oculta, pinta directo.
  function preview() {
    cancelAnimationFrame(raf);
    if (document.hidden) paint();
    else raf = requestAnimationFrame(paint);
  }
  function highlight(path, scroll = true) {
    $$('.v.is-focus', paper).forEach((x) => x.classList.remove('is-focus'));
    if (!path) return;
    const hits = $$(`.v[data-f="${CSS.escape(path)}"]`, paper);
    hits.forEach((x) => x.classList.add('is-focus'));
    if (scroll && hits[0] && window.matchMedia('(min-width: 961px)').matches) {
      const pane = paper.closest('.paper-wrap');
      const top = hits[0].offsetTop - pane.clientHeight / 3;
      pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  /* ---------- Formulario ---------- */
  function renderStep() {
    const step = steps[S.step];
    form.innerHTML = `
      <div class="step-head">
        <h2>${esc(step.title)}</h2>
        ${step.intro ? `<p class="muted">${esc(step.intro)}</p>` : ''}
      </div>
      <div class="form-grid">${step.fields.map((f) => fieldHTML(f, f.id)).join('')}</div>`;
    updateVisibility();
    renderStepper();
    $('[data-prev]').disabled = S.step === 0;
    $('[data-prev]').style.visibility = S.step === 0 ? 'hidden' : 'visible';
    const last = S.step === steps.length - 1;
    $('[data-next]').innerHTML = last ? `${ms('download')}Descargar PDF` : `Siguiente${ms('chevron_right')}`;
  }

  function fieldHTML(f, path, item = null) {
    const v = item ? item[f.id] : values[f.id];
    const id = `f-${path.replace(/\./g, '-')}`;
    const err = S.errors.get(path);
    const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
    const help = f.help ? `<span class="field-help" id="${id}-h">${esc(f.help)}</span>` : '';
    const describedBy = f.help ? ` aria-describedby="${id}-h"` : '';
    const wrapCls = `field${f.half ? ' half' : ''}${err ? ' has-error' : ''}`;
    const errHTML = `<span class="field-error" role="alert">${ms('error')}${esc(err || '')}</span>`;
    const common = `id="${id}" data-path="${path}"${f.required ? ' aria-required="true"' : ''}${describedBy}`;

    switch (f.type) {
      case 'repeat': {
        const items = values[f.id] || [];
        const max = f.max ?? 10;
        return `
          <fieldset class="repeat field" data-wrap="${path}">
            <legend class="field-label">${esc(f.label)}</legend>
            ${help}
            <div class="repeat-list">
              ${items
                .map(
                  (it, i) => `
                <div class="repeat-item">
                  <div class="ri-head">
                    <span>${esc(f.itemLabel || 'Elemento')} ${i + 1}</span>
                    ${items.length > (f.min ?? 0) ? `<button class="icon-btn sm" type="button" data-remove="${f.id}" data-index="${i}" aria-label="Quitar ${esc(f.itemLabel || 'elemento')} ${i + 1}">${ms('delete')}</button>` : ''}
                  </div>
                  <div class="form-grid">${f.fields.map((sf) => fieldHTML(sf, `${f.id}.${i}.${sf.id}`, it)).join('')}</div>
                </div>`,
                )
                .join('')}
            </div>
            ${items.length < max ? `<button class="btn btn-secondary btn-sm add-btn" type="button" data-add="${f.id}">${ms('add')}${esc(f.addLabel || 'Agregar')}</button>` : ''}
          </fieldset>`;
      }
      case 'radio':
        return `
          <div class="${wrapCls}" data-wrap="${path}" role="radiogroup" aria-labelledby="${id}-l">
            <span class="field-label" id="${id}-l">${esc(f.label)}${req}</span>
            ${help}
            <div class="choice-group">
              ${f.options.map((o, i) => `
                <label class="choice">
                  <input type="radio" name="${path}" value="${esc(o.value)}" data-path="${path}" ${String(v) === String(o.value) ? 'checked' : ''} ${i === 0 ? `id="${id}"` : ''}>
                  <span>${esc(o.label)}${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span>
                </label>`).join('')}
            </div>
            ${errHTML}
          </div>`;
      case 'checks':
        return `
          <div class="${wrapCls}" data-wrap="${path}" role="group" aria-labelledby="${id}-l">
            <span class="field-label" id="${id}-l">${esc(f.label)}${req}</span>
            ${help}
            <div class="choice-group">
              ${f.options.map((o, i) => `
                <label class="choice">
                  <input type="checkbox" value="${esc(o.value)}" data-path="${path}" data-multi ${(v || []).includes(o.value) ? 'checked' : ''} ${i === 0 ? `id="${id}"` : ''}>
                  <span>${esc(o.label)}</span>
                </label>`).join('')}
            </div>
            ${errHTML}
          </div>`;
      case 'checkbox':
        return `
          <div class="${wrapCls}" data-wrap="${path}">
            <label class="choice single">
              <input type="checkbox" ${common} ${v ? 'checked' : ''}>
              <span>${esc(f.label)}${f.help ? `<small>${esc(f.help)}</small>` : ''}</span>
            </label>
          </div>`;
      case 'select':
        return `
          <div class="${wrapCls}" data-wrap="${path}">
            <label class="field-label" for="${id}">${esc(f.label)}${req}</label>
            <select class="input" ${common}>
              ${f.options.map((o) => `<option value="${esc(o.value)}" ${String(v) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>
            ${help}${errHTML}
          </div>`;
      case 'textarea':
        return `
          <div class="${wrapCls}" data-wrap="${path}">
            <label class="field-label" for="${id}">${esc(f.label)}${req}</label>
            <textarea class="input" rows="${f.rows || 3}" ${common} placeholder="${esc(f.placeholder || '')}">${esc(v || '')}</textarea>
            ${help}${errHTML}
          </div>`;
      case 'money':
        return `
          <div class="${wrapCls}" data-wrap="${path}">
            <label class="field-label" for="${id}">${esc(f.label)}${req}</label>
            <div class="money"><span aria-hidden="true">$</span><input class="input" type="text" inputmode="numeric" ${common} data-money value="${v ? formatCOP(v).slice(1) : ''}" placeholder="0"></div>
            <span class="field-help money-words" data-words="${path}">${v ? esc(pesosEnLetras(v)) : ''}</span>
            ${help}${errHTML}
          </div>`;
      default: {
        const type = { email: 'email', tel: 'tel', number: 'number', date: 'date' }[f.type] || 'text';
        return `
          <div class="${wrapCls}" data-wrap="${path}">
            <label class="field-label" for="${id}">${esc(f.label)}${req}</label>
            <input class="input" type="${type}" ${common} value="${esc(v ?? '')}" placeholder="${esc(f.placeholder || '')}"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}${type === 'number' ? ' min="0"' : ''}>
            ${help}${errHTML}
          </div>`;
      }
    }
  }

  function updateVisibility() {
    for (const f of steps[S.step].fields) {
      const w = form.querySelector(`[data-wrap="${CSS.escape(f.id)}"]`);
      if (w) w.hidden = !isVisible(f, values);
    }
  }

  /* ---------- Progreso ---------- */
  const filled = (x) => !(x == null || x === '' || (Array.isArray(x) && !x.length));
  function stepStats(step) {
    let total = 0, done = 0;
    for (const f of step.fields) {
      if (!isVisible(f, values)) continue;
      if (f.type === 'repeat') {
        (values[f.id] || []).forEach((it) => f.fields.forEach((sf) => { if (sf.required) { total++; if (filled(it[sf.id])) done++; } }));
      } else if (f.required) { total++; if (filled(values[f.id])) done++; }
    }
    return { total, done };
  }
  function renderStepper() {
    let T = 0, D = 0;
    $('[data-stepper]').innerHTML = steps
      .map((s, i) => {
        const { total, done } = stepStats(s);
        T += total; D += done;
        const complete = total > 0 ? done === total : true;
        const state = i === S.step ? 'current' : complete ? 'done' : '';
        return `<li><button type="button" class="${state}" data-go="${i}" ${i === S.step ? 'aria-current="step"' : ''}>
          <span class="dot">${complete && i !== S.step ? ms('check') : i + 1}</span><span class="lbl">${esc(s.title)}</span></button></li>`;
      })
      .join('');
    const pct = T ? Math.round((D / T) * 100) : 100;
    $('[data-progress]').style.width = `${pct}%`;
    $('[data-progress-mobile]').style.width = `${pct}%`;
    $('[data-step-label]').textContent = `Paso ${S.step + 1} de ${steps.length}`;
    $('[data-progress-label]').textContent = `${pct}% completo`;
  }

  /* ---------- Plazos y avisos ---------- */
  function renderDeadline() {
    const box = $('[data-deadline]');
    const d = t.deadline ? t.deadline(values) : null;
    if (!d) { box.innerHTML = ''; return; }
    const icon = { ok: 'event_available', danger: 'warning', info: 'schedule' }[d.tone] || 'info';
    const canTutela = hasFeature(featureFor(getTemplate('tutela')));
    box.innerHTML = `
      <div class="notice ${d.tone} deadline">
        ${ms(icon)}
        <div>
          <strong>${esc(d.title)}</strong>
          <p>${esc(d.text)}</p>
          ${d.tutela ? `<button class="btn btn-sm ${canTutela ? 'btn-primary' : 'btn-outline'}" type="button" data-to-tutela>${ms(canTutela ? 'gavel' : 'lock')}Convertir en tutela${canTutela ? '' : ' (Premium)'}</button>` : ''}
        </div>
      </div>`;
    $('[data-to-tutela]', box)?.addEventListener('click', () => {
      if (!canTutela) { toast('La tutela guiada está disponible en el plan Premium.', 'lock'); return; }
      setHandoff(getTemplate('tutela').fromPeticion(values));
      window.location.href = '?t=tutela';
    });
  }

  /* ---------- Guardado de borradores ---------- */
  const saveEl = $('[data-save]');
  let saveTimer = 0;
  function renderSaveState(state) {
    if (!canDraft) {
      saveEl.innerHTML = `<a href="${url(ROUTES.precios)}" title="Guardar borradores es una función Premium">${ms('lock')}<span class="hide-sm">Borradores: Premium</span></a>`;
      return;
    }
    saveEl.innerHTML = state === 'saving'
      ? `${ms('schedule')}<span class="hide-sm">Guardando…</span>`
      : `${ms('cloud_done')}<span class="hide-sm">Borrador guardado</span>`;
  }
  function scheduleSave() {
    if (!canDraft) return;
    renderSaveState('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveDraft(user, t.id, values, values[t.nameField] || '');
      renderSaveState('saved');
    }, 700);
  }

  /* ---------- Cambios ---------- */
  function setPath(path, val) {
    const keys = path.split('.');
    let o = values;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = val;
  }

  function onChange(path) {
    if (S.errors.delete(path)) {
      const w = form.querySelector(`[data-wrap="${CSS.escape(path)}"]`);
      w?.classList.remove('has-error');
      renderErrorSummary();
    }
    updateVisibility();
    renderStepper();
    renderDeadline();
    preview();
    scheduleSave();
  }

  function readInput(el) {
    const path = el.dataset.path;
    if (el.dataset.multi !== undefined) {
      return [path, $$(`input[data-multi][data-path="${CSS.escape(path)}"]`, form).filter((x) => x.checked).map((x) => x.value)];
    }
    if (el.type === 'checkbox') return [path, el.checked];
    if (el.dataset.money !== undefined) {
      const digits = el.value.replace(/\D/g, '');
      const words = form.querySelector(`[data-words="${CSS.escape(path)}"]`);
      if (words) words.textContent = digits ? pesosEnLetras(digits) : '';
      return [path, digits];
    }
    return [path, el.value];
  }

  form.addEventListener('input', (e) => {
    const el = e.target.closest('[data-path]');
    if (!el || el.type === 'radio') return;
    const [path, val] = readInput(el);
    setPath(path, val);
    onChange(path);
  });
  form.addEventListener('change', (e) => {
    const el = e.target.closest('[data-path]');
    if (!el) return;
    const [path, val] = readInput(el);
    setPath(path, val);
    onChange(path);
  });
  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el.dataset?.money !== undefined && el.value) el.value = formatCOP(el.value.replace(/\D/g, '')).slice(1);
  });
  form.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-path]');
    S.focus = el ? el.dataset.path : null;
    highlight(S.focus);
  });
  form.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const rem = e.target.closest('[data-remove]');
    if (!add && !rem) return;
    const f = steps[S.step].fields.find((x) => x.id === (add || rem).dataset.add || x.id === (add || rem).dataset.remove);
    if (add) {
      values[f.id] = [...(values[f.id] || []), blankItem(f)];
      renderStep();
      const items = $$('.repeat-item', form.querySelector(`[data-wrap="${CSS.escape(f.id)}"]`));
      items[items.length - 1]?.querySelector('input, textarea, select')?.focus();
    } else {
      values[f.id].splice(Number(rem.dataset.index), 1);
      renderStep();
    }
    preview();
    scheduleSave();
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  /* ---------- Navegación ---------- */
  function goStep(i, focus = true) {
    S.step = Math.max(0, Math.min(steps.length - 1, i));
    renderStep();
    const top = $('.progress-card').getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    if (focus) form.querySelector('h2')?.setAttribute('tabindex', '-1');
    if (focus) form.querySelector('h2')?.focus({ preventScroll: true });
  }
  $('[data-prev]').addEventListener('click', () => goStep(S.step - 1));
  $('[data-next]').addEventListener('click', () => (S.step === steps.length - 1 ? download() : goStep(S.step + 1)));
  $('[data-stepper]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) goStep(Number(b.dataset.go));
  });

  // Pestañas en móvil
  $$('[data-tab-btn]').forEach((b) =>
    b.addEventListener('click', () => {
      $('[data-editor]').dataset.tab = b.dataset.tabBtn;
      $$('[data-tab-btn]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }),
  );

  /* ---------- Errores ---------- */
  function renderErrorSummary() {
    const box = $('[data-error-summary]');
    if (!S.errors.size) { box.hidden = true; return; }
    box.hidden = false;
    const list = [...S.errors.entries()].slice(0, 6);
    box.innerHTML = `
      <div class="notice danger">${ms('error')}
        <div><strong>Faltan ${S.errors.size} dato${S.errors.size > 1 ? 's' : ''} para descargar</strong>
        <ul>${list.map(([id, msg]) => `<li><button type="button" class="linklike" data-err="${esc(id)}">${esc(msg)}</button></li>`).join('')}</ul></div>
      </div>`;
    $$('[data-err]', box).forEach((b) =>
      b.addEventListener('click', () => {
        const err = errorsList.find((x) => x.id === b.dataset.err);
        if (err && err.step !== S.step) goStep(err.step, false);
        const el = form.querySelector(`[data-path="${CSS.escape(b.dataset.err)}"]`) || form.querySelector(`[data-wrap="${CSS.escape(b.dataset.err)}"] input, [data-wrap="${CSS.escape(b.dataset.err)}"] textarea`);
        el?.focus();
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }),
    );
  }
  let errorsList = [];

  /* ---------- Descarga ---------- */
  function download() {
    const c = compute();
    errorsList = validate(t, values, c);
    S.errors = new Map(errorsList.map((e) => [e.id, e.msg]));
    if (errorsList.length) {
      $('[data-editor]').dataset.tab = 'form';
      $$('[data-tab-btn]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tabBtn === 'form')));
      goStep(errorsList[0].step, false);
      renderErrorSummary();
      $('[data-error-summary]').scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast(`Revisa ${errorsList.length} dato${errorsList.length > 1 ? 's' : ''} antes de descargar.`, 'error');
      return;
    }
    renderErrorSummary();
    if (!window.jspdf) { toast('El generador de PDF aún está cargando. Intenta de nuevo.', 'schedule'); return; }
    const doc = renderPDF(t.document(values, c), ctx(), { title: t.title, subject: t.summary });
    const who = values[t.nameField] || c[t.nameField] || user.name;
    const fecha = values.fechaFirma || values.fecha || isoDate(today());
    const filename = `${t.filePrefix}_${slug(who) || 'documento'}_${fecha}.pdf`;
    doc.save(filename);
    openDespacho(filename);
  }
  $$('[data-download]').forEach((b) => b.addEventListener('click', download));

  function openDespacho(filename) {
    const dlg = $('[data-despacho]');
    const annexes = t.annexes ? t.annexes(values) : [];
    const channels = (t.channels || []).map(getChannel).filter(Boolean).slice(0, 3);
    dlg.innerHTML = `
      <div class="modal-body">
        <div class="despacho-head">
          <span class="done-icon">${ms('task_alt')}</span>
          <div><h2 id="despacho-title">Tu documento está listo</h2><p class="subtle file">${ms('picture_as_pdf')}${esc(filename)}</p></div>
        </div>
        <h3>Antes de enviarlo</h3>
        <ol class="despacho-steps">${t.despacho.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
        ${annexes.length ? `<h3>Anexos que debes adjuntar</h3>
          <ul class="checklist">${annexes.map((a, i) => `<li><label><input type="checkbox" id="anx-${i}"><span>${esc(a)}</span></label></li>`).join('')}</ul>` : ''}
        <h3>Dónde radicarlo</h3>
        <p class="muted">${esc(t.despacho.donde)}</p>
        <div class="channel-mini">${channels.map(channelMini).join('')}</div>
        <div class="notice" style="margin-top:var(--space-5)">${ms('info')}<div>Consultoría Digital no radica trámites ni es un canal oficial. La entidad solo recibe tu documento por sus propios canales.</div></div>
        <div class="modal-actions">
          <button class="btn btn-outline" type="button" data-again>${ms('download')}Descargar otra vez</button>
          <button class="btn btn-primary" type="button" data-close-d>Listo</button>
        </div>
      </div>`;
    dlg.showModal();
    $('[data-close-d]', dlg).addEventListener('click', () => dlg.close());
    $('[data-again]', dlg).addEventListener('click', () => { dlg.close(); download(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }, { once: true });
  }

  /* ---------- Reiniciar ---------- */
  $('[data-reset]').addEventListener('click', () => {
    const dlg = $('[data-confirm]');
    dlg.innerHTML = `
      <div class="modal-body">
        <h2 id="confirm-title">¿Empezar de nuevo?</h2>
        <p class="muted">Se borrarán todos los datos que escribiste en esta plantilla${canDraft ? ', incluido el borrador guardado' : ''}. No se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" type="button" value="no">Cancelar</button>
          <button class="btn btn-primary" type="button" value="si">Borrar y empezar</button>
        </div>
      </div>`;
    dlg.showModal();
    $$('button', dlg).forEach((b) =>
      b.addEventListener('click', () => {
        dlg.close();
        if (b.value !== 'si') return;
        if (canDraft) removeDraft(user, t.id);
        values = initialValues(t);
        S.errors.clear();
        renderErrorSummary();
        goStep(0);
        renderDeadline();
        preview();
        renderSaveState('saved');
        if (canDraft) saveEl.innerHTML = '';
        toast('Plantilla reiniciada.', 'restart_alt');
      }),
    );
  });

  // ----- Inicio
  renderStep();
  renderDeadline();
  paint();
  if (canDraft) saveEl.innerHTML = draft ? `${ms('cloud_done')}<span class="hide-sm">Borrador guardado</span>` : '';
  else renderSaveState();
}

/* ======================================================================
   Piezas compartidas
   ====================================================================== */
function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''));
}

function channelMini(c) {
  const logo = c.logo
    ? `<img src="${asset('img/logos/' + c.logo)}" alt="">`
    : `<span class="mono ${c.tone}">${esc(c.sigla)}</span>`;
  return `
    <a class="ch-mini" href="${esc(c.url)}" target="_blank" rel="noopener">
      <span class="ch-logo"${c.logoBg ? ` style="background:${esc(c.logoBg)}"` : ''}>${logo}</span>
      <span><strong>${esc(c.name)}</strong><small>${esc(c.service)}</small></span>
      ${ms('open_in_new')}
    </a>`;
}

function guideHTML(t) {
  const g = t.guide;
  const channels = (t.channels || []).map(getChannel).filter(Boolean);
  return `
    <div class="sheet-body">
      <div class="sheet-head">
        <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
        <h2 id="guide-title">Guía rápida: ${esc(t.title)}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Cerrar guía">${ms('close')}</button>
      </div>
      <section><h3>¿Qué es?</h3><p>${esc(g.que)}</p></section>
      <section><h3>¿Cuándo usarla?</h3><ul>${g.cuando.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section><h3>Qué anexar</h3><ul>${g.anexos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section><h3>Consejos</h3><ul class="tips">${g.tips.map((x) => `<li>${ms('lightbulb')}<span>${esc(x)}</span></li>`).join('')}</ul></section>
      <section><h3>Canales oficiales</h3><p class="muted">${esc(t.despacho.donde)}</p><div class="channel-mini">${channels.map(channelMini).join('')}</div></section>
      <div class="notice">${ms('info')}<div>Esta guía es informativa y no reemplaza la asesoría de un abogado. Para orientación gratuita acude a la Defensoría del Pueblo, la personería de tu municipio o un consultorio jurídico universitario.</div></div>
    </div>`;
}

function lockedPanel(t) {
  return `
    <div class="lock-card">
      <span class="lock-icon">${ms('lock', 'fill')}</span>
      <span class="badge badge-premium">${ms('workspace_premium', 'fill')}Plantilla Premium</span>
      <h2>${esc(t.title)}</h2>
      <p class="muted">${esc(t.guide.que)}</p>
      <ul class="lock-list">${t.guide.cuando.slice(0, 3).map((x) => `<li>${ms('check_circle')}<span>${esc(x)}</span></li>`).join('')}</ul>
      <div class="lock-actions">
        <a class="btn btn-primary" href="${url(ROUTES.precios)}">${ms('workspace_premium')}Ver plan Premium</a>
        <a class="btn btn-outline" href="${url(ROUTES.plantillas)}">Ver plantillas Básico</a>
      </div>
      <p class="subtle">¿Necesitas ayuda gratuita ya? La Defensoría del Pueblo y las personerías orientan sin costo.</p>
    </div>`;
}
