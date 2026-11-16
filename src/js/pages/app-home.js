/**
 * Directorio (/app/): lo que depende de la persona y vive en su navegador.
 * El resto (herramientas, áreas, documentos, canales) ya viene en el HTML.
 *
 * @icons draft, chevron_right, workspace_premium
 */
import { requireAuth, hasFeature } from '../core/auth.js';
import { ROUTES, url } from '../core/config.js';
import { $, esc, ms } from '../core/ui.js';
import { docById } from '../data/catalog.js';
import { listDrafts } from '../core/drafts.js';
import { fechaLarga, today } from '../tools/legal-utils.js';

const user = requireAuth();
if (user) render();

function render() {
  $('[data-today]').textContent = fechaLarga(today()).replace(/^./, (c) => c.toUpperCase());
  $('[data-greeting]').textContent = `Hola, ${user.name.split(' ')[0]}`;

  // Plan: borradores (Premium) o invitación (Básico)
  const planSection = $('[data-plan-section]');
  if (hasFeature('drafts')) {
    const drafts = listDrafts(user).filter((d) => docById(d.templateId));
    planSection.innerHTML = `
      <div class="container">
        <div class="app-section-head"><h2>Mis borradores</h2></div>
        ${
          drafts.length
            ? `<div class="draft-list">${drafts
                .map((d) => {
                  const t = docById(d.templateId);
                  return `<a class="draft-item" href="${t.href}">
                    <div class="card-icon ${t.tone}" style="width:40px;height:40px;margin:0">${ms(t.icon)}</div>
                    <div><strong>${esc(t.title)}</strong><small>${esc(d.label || 'Sin nombre')} · Guardado ${new Date(d.updatedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
                    ${ms('chevron_right')}
                  </a>`;
                })
                .join('')}</div>`
            : `<div class="empty-state">${ms('draft')}<span>Aún no tienes borradores. Se guardan solos mientras llenas un documento.</span></div>`
        }
      </div>`;
  } else {
    planSection.innerHTML = `
      <div class="container">
        <div class="upsell">
          <div>
            <span class="badge badge-premium">${ms('workspace_premium', 'fill')}Premium</span>
            <h3 style="margin-top:var(--space-3)">Desbloquea la tutela guiada y guarda tus borradores</h3>
            <p>Texto de ejemplo: con Premium accedes a todas las plantillas, incluidos los documentos de familia y de empresa.</p>
          </div>
          <a class="btn btn-primary" href="${url(ROUTES.precios)}">Ver Premium</a>
        </div>
      </div>`;
  }
}
