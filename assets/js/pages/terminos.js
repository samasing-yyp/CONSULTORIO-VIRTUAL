import '../components/site-chrome.js';
import { $, $$, initReveal } from '../core/ui.js';

initReveal();

// Índice: resalta la sección visible (scrollspy).
const links = $$('.legal-toc nav a');
const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    });
  },
  { rootMargin: '-30% 0px -60% 0px' },
);
sections.forEach((s) => io.observe(s));

// En móvil el índice empieza cerrado y se cierra al elegir una sección.
const toc = $('.toc-mobile');
const mq = window.matchMedia('(max-width: 900px)');
const sync = () => { toc.open = !mq.matches; };
sync();
mq.addEventListener('change', sync);
links.forEach((a) => a.addEventListener('click', () => { if (mq.matches) toc.open = false; }));
