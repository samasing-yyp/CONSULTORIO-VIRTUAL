/**
 * Comportamiento del encabezado (público y de la app), común a todas las páginas:
 * menú móvil, sombra al hacer scroll, tamaño de texto, cerrar sesión y los
 * datos del usuario (nombre y plan, que viven en el navegador).
 *
 * @icons close, menu, apps, login, person, workspace_premium, lock
 */
import { ROUTES, url } from '../js/core/config.js';
import { currentUser, planOf, logout, hasFeature } from '../js/core/auth.js';
import { $$, esc, ms, bindTextSize } from '../js/core/ui.js';

const header = document.querySelector('[data-chrome]');
if (header) {
  const toggle = header.querySelector('.menu-toggle');
  const nav = header.querySelector('.nav');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    toggle.innerHTML = ms(open ? 'close' : 'menu');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('is-open')) toggle.click();
  });
  bindTextSize(document);
  $$('[data-action="logout"]').forEach((b) => b.addEventListener('click', logout));

  const user = currentUser();
  // Público: con sesión, «Ingresar» pasa a «Ir al directorio»
  if (user) {
    $$('[data-session-cta]').forEach((a) => {
      a.href = url(ROUTES.app);
      a.innerHTML = `${ms('apps')}<span>Ir al directorio</span>`;
    });
  }
  // Candados: contenido Premium cuando el plan no lo incluye
  if (user && !hasFeature('templates.premium', user)) {
    $$('[data-plan="premium"]').forEach((el) => {
      el.classList.add('locked');
      const badge = el.querySelector('[data-plan-badge]');
      if (badge) {
        badge.classList.remove('badge-premium');
        badge.innerHTML = `${ms('lock', 'fill')}Premium`;
      }
      const go = el.querySelector('[data-go-label]');
      if (go) go.textContent = 'Ver detalles';
    });
  }

  // App: nombre y plan
  const plan = planOf(user);
  if (user && plan) {
    const premium = plan.id === 'premium';
    const badge = `<span class="badge ${premium ? 'badge-premium' : ''}">${ms(premium ? 'workspace_premium' : 'person', 'fill')}${esc(plan.label)}</span>`;
    $$('[data-user-badge]').forEach((el) => { el.outerHTML = badge; });
    $$('[data-user-name]').forEach((el) => { el.textContent = user.name; });
    $$('[data-user-email-title]').forEach((el) => { el.title = user.email; });
  }
}
