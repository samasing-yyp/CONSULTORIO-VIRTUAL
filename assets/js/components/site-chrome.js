/**
 * Web Components del "chrome" del sitio: encabezados y pie de página.
 * Uso:
 *   <site-header active="home"></site-header>
 *   <app-header active="plantillas"></app-header>
 *   <site-footer></site-footer>
 *
 * @icons close, menu, person, workspace_premium
 */
import { APP, ROUTES, url } from '../core/config.js';
import { currentUser, planOf, logout } from '../core/auth.js';
import { esc, ms, textSizeButton, bindTextSize, $, $$ } from '../core/ui.js';

export const BRAND_MARK = `
<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
  <rect width="40" height="40" rx="12" fill="#10244a"/>
  <path d="M13 9.5h10.2l6.3 6.3V29a2.5 2.5 0 0 1-2.5 2.5H13A2.5 2.5 0 0 1 10.5 29V12A2.5 2.5 0 0 1 13 9.5z" fill="#fff"/>
  <path d="M23.2 9.5v5.3c0 .6.4 1 1 1h5.3z" fill="#c9d8f2"/>
  <rect x="14.5" y="20" width="11" height="2.6" rx="1.3" fill="#f6d77a"/>
  <rect x="14.5" y="25" width="7" height="2.6" rx="1.3" fill="#e8857a"/>
</svg>`;

function brand(href) {
  return `<a class="brand" href="${href}" aria-label="${esc(APP.name)}, inicio">${BRAND_MARK}<span>${esc(APP.name)}</span></a>`;
}

function bindHeader(root) {
  const header = $('.site-header', root);
  const toggle = $('.menu-toggle', root);
  const nav = $('.nav', root);
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = ms(open ? 'close' : 'menu');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle.click();
  });
  bindTextSize(root);
  $$('[data-action="logout"]', root).forEach((b) => b.addEventListener('click', logout));
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active');
    const user = currentUser();
    const links = [
      ['home', 'Inicio', ROUTES.home],
      ['precios', 'Precios', ROUTES.precios],
      ['terminos', 'Términos', ROUTES.terminos],
    ];
    const cta = user
      ? `<a class="btn btn-primary btn-sm" href="${url(ROUTES.app)}">${ms('apps')}Ir al directorio</a>`
      : `<a class="btn btn-primary btn-sm" href="${url(ROUTES.ingresar)}">${ms('login')}Ingresar</a>`;

    this.innerHTML = `
      <a class="skip-link" href="#contenido">Saltar al contenido</a>
      <header class="site-header">
        <div class="container">
          ${brand(url(ROUTES.home))}
          <button class="icon-btn menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-principal">${ms('menu')}</button>
          <nav class="nav" id="nav-principal" aria-label="Principal">
            ${links
              .map(([id, label, route]) => `<a href="${url(route)}"${id === active ? ' aria-current="page"' : ''}>${label}</a>`)
              .join('')}
            <span class="mobile-only">${cta.replace('btn-sm', 'btn-block')}</span>
          </nav>
          <div class="header-actions desktop-only">
            ${textSizeButton()}
            ${cta}
          </div>
        </div>
      </header>`;
    bindHeader(this);
  }
}

class AppHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active');
    const user = currentUser();
    const plan = planOf(user);
    const links = [
      ['directorio', 'Directorio', ROUTES.app],
      ['plantillas', 'Plantillas', ROUTES.plantillas],
      ['canales', 'Canales oficiales', ROUTES.canales],
    ];
    const badge = plan
      ? `<span class="badge ${plan.id === 'premium' ? 'badge-premium' : ''}">${ms(plan.id === 'premium' ? 'workspace_premium' : 'person', 'fill')}${esc(plan.label)}</span>`
      : '';

    this.innerHTML = `
      <a class="skip-link" href="#contenido">Saltar al contenido</a>
      <header class="site-header app">
        <div class="container">
          ${brand(url(ROUTES.app))}
          <button class="icon-btn menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-app">${ms('menu')}</button>
          <nav class="nav" id="nav-app" aria-label="Herramientas">
            ${links
              .map(([id, label, route]) => `<a href="${url(route)}"${id === active ? ' aria-current="page"' : ''}>${label}</a>`)
              .join('')}
            <div class="mobile-only app-user-mobile">
              <div class="app-user">${badge}<span>${esc(user?.name || '')}</span></div>
              <button class="btn btn-outline btn-block" type="button" data-action="text-size">${ms('text_increase')}Tamaño de texto</button>
              <button class="btn btn-secondary btn-block" type="button" data-action="logout">${ms('logout')}Cerrar sesión</button>
            </div>
          </nav>
          <div class="header-actions desktop-only">
            <div class="app-user" title="${esc(user?.email || '')}">${badge}<span class="app-user-name">${esc(user?.name || '')}</span></div>
            ${textSizeButton()}
            <button class="icon-btn" type="button" data-action="logout" title="Cerrar sesión" aria-label="Cerrar sesión">${ms('logout')}</button>
          </div>
        </div>
      </header>`;
    bindHeader(this);
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              ${brand(url(ROUTES.home))}
              <p style="margin-top:var(--space-4);max-width:36ch">${esc(APP.tagline)}. Herramientas de apoyo: no somos una entidad pública ni un canal oficial de trámites.</p>
              <div class="flag-line" aria-hidden="true"></div>
            </div>
            <div>
              <h4>Producto</h4>
              <ul>
                <li><a href="${url(ROUTES.home)}">Inicio</a></li>
                <li><a href="${url(ROUTES.precios)}">Precios</a></li>
                <li><a href="${url(ROUTES.ingresar)}">Ingresar</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="${url(ROUTES.terminos)}#terminos">Términos de uso</a></li>
                <li><a href="${url(ROUTES.terminos)}#habeas-data">Habeas data</a></li>
                <li><a href="${url(ROUTES.terminos)}#archivos">Alojamiento de archivos</a></li>
              </ul>
            </div>
            <div>
              <h4>Canales oficiales</h4>
              <ul>
                <li><a href="https://www.gov.co" target="_blank" rel="noopener">gov.co ${ms('open_in_new')}</a></li>
                <li><a href="https://procesojudicial.ramajudicial.gov.co/TutelaEnLinea" target="_blank" rel="noopener">Tutela en Línea ${ms('open_in_new')}</a></li>
                <li><a href="https://www.policia.gov.co" target="_blank" rel="noopener">Policía Nacional ${ms('open_in_new')}</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} ${esc(APP.name)} · Versión ${esc(APP.version)}</span>
            <span>Hecho en Colombia para que más personas conozcan sus derechos.</span>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('app-header', AppHeader);
customElements.define('site-footer', SiteFooter);
