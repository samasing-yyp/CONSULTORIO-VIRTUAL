/**
 * <app-notice>: aviso persistente en la zona de herramientas.
 * Recuerda que el sitio no es un canal oficial y lleva a los canales reales.
 */
import { ROUTES, url } from '../core/config.js';
import { ms } from '../core/ui.js';

class AppNotice extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="app-notice" role="note">
        <div class="container">
          ${ms('info')}
          <span><strong>Herramienta de apoyo, no canal oficial.</strong> Tus trámites se radican ante cada entidad.
          <a href="${url(ROUTES.canales)}">Ver canales oficiales</a></span>
        </div>
      </div>`;
  }
}
customElements.define('app-notice', AppNotice);
