/**
 * Buscador de canales oficiales.
 * Búsqueda local tolerante a tildes, con sinónimos populares y puntaje por
 * coincidencia en nombre, servicio, palabras clave y descripción.
 *
 * @icons apps, fact_check, gavel, badge, health_and_safety, work, shopping_bag, directions_car, family_restroom, storefront
 */
import '../components/site-chrome.js';
import '../components/app-notice.js';
import { requireAuth } from '../core/auth.js';
import { asset } from '../core/config.js';
import { $, $$, esc, ms, norm, initReveal } from '../core/ui.js';
import { CHANNELS, CHANNEL_CATEGORIES, SYNONYMS } from '../data/channels.js';

const user = requireAuth();

const SUGGESTIONS = ['pasado judicial', 'duplicado de cédula', 'denunciar un robo', 'queja contra mi EPS', 'multas de tránsito', 'cuota alimentaria', 'crear empresa', 'abogado gratis'];

const INDEX = CHANNELS.map((c) => ({
  c,
  name: norm(`${c.name} ${c.sigla}`),
  service: norm(c.service),
  keys: norm(c.keywords),
  desc: norm(c.desc),
}));

function expand(q) {
  let text = norm(q);
  for (const [k, v] of Object.entries(SYNONYMS)) if (text.includes(norm(k))) text += ` ${norm(v)}`;
  const STOP = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'mi', 'mis', 'por', 'para', 'con', 'en', 'y', 'a', 'contra', 'quiero', 'necesito', 'como', 'del', 'al']);
  return text.split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}

function search(q, cat) {
  const terms = expand(q);
  return INDEX.map((it) => {
    if (cat !== 'todas' && it.c.category !== cat) return null;
    if (!terms.length) return { c: it.c, score: it.c.featured ? 1 : 0 };
    let score = 0;
    for (const w of terms) {
      const stem = w.length > 4 ? w.slice(0, -1) : w; // tolera plural/singular
      if (it.name.includes(stem)) score += 6;
      if (it.service.includes(stem)) score += 5;
      if (it.keys.includes(stem)) score += 4;
      if (it.desc.includes(stem)) score += 1;
    }
    return score > 0 ? { c: it.c, score } : null;
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
}

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

function card(c, i) {
  const logo = c.logo
    ? `<img src="${asset('img/logos/' + c.logo)}" alt="Logo de ${esc(c.name)}" loading="lazy">`
    : `<span class="mono ${c.tone}" aria-hidden="true">${esc(c.sigla)}</span>`;
  const cat = CHANNEL_CATEGORIES[c.category];
  return `
    <article class="ch-card reveal" style="--reveal-delay:${Math.min(i, 8) * 35}ms">
      <div class="ch-card-top">
        <div class="ch-logo-lg"${c.logoBg ? ` style="background:${esc(c.logoBg)}"` : ''}>${logo}</div>
        <span class="badge">${ms(cat.icon)}${esc(cat.label)}</span>
      </div>
      <h3>${esc(c.service)}</h3>
      <p class="ch-entity">${esc(c.name)}</p>
      <p class="ch-desc">${esc(c.desc)}</p>
      <a class="btn btn-secondary btn-block ch-go" href="${esc(c.url)}" target="_blank" rel="noopener" aria-label="Ir al sitio oficial: ${esc(c.service)} (${esc(host(c.url))}), abre en una pestaña nueva">
        Ir al sitio oficial ${ms('open_in_new')}
      </a>
      <span class="ch-host">${ms('lock')}${esc(host(c.url))}</span>
    </article>`;
}

if (user) {
  const params = new URLSearchParams(window.location.search);
  const input = $('#q');
  const clearBtn = $('[data-clear]');
  let cat = params.get('cat') && CHANNEL_CATEGORIES[params.get('cat')] ? params.get('cat') : 'todas';
  input.value = params.get('q') || '';

  $('[data-suggest]').innerHTML = `<span class="subtle">Prueba:</span>${SUGGESTIONS.map((s) => `<button class="chip" type="button" data-s="${esc(s)}">${esc(s)}</button>`).join('')}`;
  $$('[data-s]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.s; cat = 'todas'; draw(); input.focus(); }));

  const counts = CHANNELS.reduce((acc, c) => ((acc[c.category] = (acc[c.category] || 0) + 1), acc), {});
  $('[data-filters]').innerHTML = Object.entries(CHANNEL_CATEGORIES)
    .map(([k, v]) => `<button class="chip" type="button" data-cat="${k}">${ms(v.icon)}${esc(v.label)}<span class="count">${k === 'todas' ? CHANNELS.length : counts[k] || 0}</span></button>`)
    .join('');
  $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; draw(); }));

  function draw() {
    const q = input.value.trim();
    clearBtn.hidden = !q;
    $$('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    const res = search(q, cat);
    $('[data-count]').textContent = q
      ? `${res.length} resultado${res.length === 1 ? '' : 's'} para «${q}»`
      : `${res.length} canal${res.length === 1 ? '' : 'es'} oficiales`;
    $('[data-results]').innerHTML = res.length
      ? res.map((r, i) => card(r.c, i)).join('')
      : `<div class="empty-state">${ms('search_off')}<span>No encontramos «${esc(q)}» en nuestro directorio. Búscalo en el portal único del Estado: <a href="https://www.gov.co/buscador?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">buscar en gov.co ${ms('open_in_new')}</a></span></div>`;
    initReveal($('[data-results]'));
    const url = new URL(window.location.href);
    q ? url.searchParams.set('q', q) : url.searchParams.delete('q');
    cat !== 'todas' ? url.searchParams.set('cat', cat) : url.searchParams.delete('cat');
    history.replaceState(null, '', url);
  }

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
  $('[data-search-form]').addEventListener('submit', (e) => { e.preventDefault(); draw(); });
  clearBtn.addEventListener('click', () => { input.value = ''; draw(); input.focus(); });
  draw();
}
