/**
 * Buscador de canales oficiales.
 * Búsqueda local tolerante a tildes, con sinónimos populares y puntaje por
 * coincidencia en nombre, servicio, palabras clave y descripción.
 *
 * @icons apps, fact_check, gavel, badge, health_and_safety, work, shopping_bag, directions_car, family_restroom, storefront
 */
import { requireAuth } from '../core/auth.js';
import { $, $$, norm, initReveal } from '../core/ui.js';
import { CHANNELS, CHANNEL_CATEGORIES, SYNONYMS } from '../data/channels.js';

const user = requireAuth();

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

if (user) {
  const params = new URLSearchParams(window.location.search);
  const input = $('#q');
  const clearBtn = $('[data-clear]');
  const grid = $('[data-results]');
  const cards = Object.fromEntries($$('[data-channel]', grid).map((el) => [el.dataset.channel, el]));
  let cat = params.get('cat') && CHANNEL_CATEGORIES[params.get('cat')] ? params.get('cat') : 'todas';
  input.value = params.get('q') || '';

  $$('[data-s]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.s; cat = 'todas'; draw(); input.focus(); }));
  $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; draw(); }));

  // Las tarjetas ya están en el HTML: aquí solo se muestran, ocultan y reordenan.
  function draw() {
    const q = input.value.trim();
    clearBtn.hidden = !q;
    $$('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    const res = search(q, cat);
    const shown = new Set(res.map((r) => r.c.id));
    Object.entries(cards).forEach(([id, el]) => { el.hidden = !shown.has(id); });
    res.forEach((r, i) => {
      const el = cards[r.c.id];
      el.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 35}ms`);
      grid.appendChild(el);
    });
    $('[data-count]').textContent = q
      ? `${res.length} resultado${res.length === 1 ? '' : 's'} para «${q}»`
      : `${res.length} canal${res.length === 1 ? '' : 'es'} oficiales`;
    $('[data-empty]').hidden = res.length > 0;
    $('[data-empty-q]').textContent = q;
    $('[data-govco]').href = `https://www.gov.co/buscador?q=${encodeURIComponent(q)}`;
    initReveal(grid);
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
