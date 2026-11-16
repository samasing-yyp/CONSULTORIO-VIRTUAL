/**
 * Galería de documentos: las tarjetas ya están en el HTML. Aquí se filtran por
 * categoría o área y se ordenan por parecido con lo que escribe la persona
 * (sin tildes, con raíces de palabra y sinónimos frecuentes).
 */
import { requireAuth } from '../core/auth.js';
import { $, $$, norm, initReveal } from '../core/ui.js';
import { getArea } from '../data/areas.js';

// Sinónimos frecuentes (palabra de la persona -> palabras del catálogo)
const SYN = {
  agua: ['acueducto'], luz: ['energia'], recibo: ['factura'], cortaron: ['corte', 'suspension'],
  multa: ['comparendo', 'fotomulta'], camara: ['fotomulta', 'camaras'], carro: ['vehiculo'], moto: ['vehiculo'],
  plata: ['pago', 'valor'], medico: ['eps', 'medica'], droga: ['medicamento'], remedio: ['medicamento'],
  cita: ['autorizacion', 'cita'], incapacidad: ['incapacidades'], embarazo: ['maternidad', 'ive'],
  invalidez: ['pcl', 'capacidad laboral'], datacredito: ['centrales de riesgo'], embargaron: ['embargo'],
};
const STOPW = new Set(['que', 'los', 'las', 'del', 'por', 'para', 'con', 'una', 'mis', 'mas', 'pero', 'como', 'nos', 'les', 'fue', 'han', 'hay']);
const stem = (w) => (w.length >= 6 ? w.slice(0, 4) : w);

const user = requireAuth();
const root = $('[data-gallery]');

if (user && root) {
  const params = new URLSearchParams(window.location.search);
  const input = $('[data-q]', root);
  const grouped = $('[data-grouped]', root);
  const flat = $('[data-flat]', root);
  const grid = $('[data-flat-grid]', root);
  const cards = $$('[data-doc]', grid).map((el) => ({ el, cat: el.dataset.category, hay: norm(el.dataset.search) }));
  let cat = params.get('area') && getArea(params.get('area')) ? params.get('area') : 'todas';
  input.value = params.get('q') || '';

  // Con sinónimo definido se usa la palabra completa y sus sinónimos; si no, la raíz.
  const score = (hay, words) => words.reduce((n, w) => n + ((SYN[w] ? [w, ...SYN[w]] : [stem(w)]).some((s) => hay.includes(s)) ? 1 : 0), 0);

  function draw() {
    const q = input.value.trim();
    const words = norm(q).split(/\s+/).filter((w) => w.length > 2 && !STOPW.has(w));
    $$('[data-cat]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    const groupedView = cat === 'todas' && !words.length;
    grouped.hidden = !groupedView;
    flat.hidden = groupedView;
    if (!groupedView) {
      const need = Math.max(1, Math.ceil(words.length / 2));
      const res = cards
        .map((c) => ({ ...c, s: words.length ? score(c.hay, words) : 1 }))
        .filter((c) => (cat === 'todas' || c.cat === cat) && c.s >= need)
        .sort((a, b) => b.s - a.s);
      const shown = new Set(res.map((c) => c.el));
      cards.forEach((c) => { c.el.hidden = !shown.has(c.el); });
      res.forEach((c) => grid.appendChild(c.el));
      $$('[data-area-note]', root).forEach((n) => { n.hidden = n.dataset.areaNote !== cat; });
      $('[data-empty]', root).hidden = res.length > 0;
      $('[data-empty-q]', root).textContent = q;
    }
    initReveal(root);
    const u = new URL(window.location.href);
    cat !== 'todas' ? u.searchParams.set('area', cat) : u.searchParams.delete('area');
    q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
    history.replaceState(null, '', u);
  }

  const setCat = (k) => {
    cat = k;
    draw();
    window.scrollTo({ top: root.querySelector('.app-section').getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
  };

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
  $$('[data-cat]', root).forEach((b) => b.addEventListener('click', () => setCat(b.dataset.cat)));
  $$('[data-show]', root).forEach((b) => b.addEventListener('click', () => setCat(b.dataset.show)));
  draw();
}
