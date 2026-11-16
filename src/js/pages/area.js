/**
 * Sección de área: el contenido viene en el HTML. Aquí solo corren la
 * animación de aparición y el buscador «¿Qué te pasó?».
 */
import { requireAuth } from '../core/auth.js';
import { $, $$, norm, initReveal } from '../core/ui.js';

const user = requireAuth();
const root = $('[data-area-page]');

if (user && root) {
  initReveal(root);
  const rows = $$('.sit-row', root);
  const stages = $$('[data-stage]', root);
  $('[data-q]', root).addEventListener('input', (e) => {
    const words = norm(e.target.value).split(/\s+/).filter((w) => w.length > 2);
    let shown = 0;
    rows.forEach((r) => {
      const ok = !words.length || words.every((w) => r.dataset.search.includes(w));
      r.hidden = !ok;
      if (ok) shown++;
    });
    stages.forEach((s) => {
      s.hidden = !$$('.sit-row:not([hidden])', s).length;
      s.classList.add('is-visible');
    });
    $('[data-empty]', root).hidden = shown > 0;
  });
}
