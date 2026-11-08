import '../components/site-chrome.js';
import '../components/app-notice.js';
import { requireAuth, hasFeature } from '../core/auth.js';
import { TOOLS, ROUTES, url, templateUrl } from '../core/config.js';
import { $, esc, ms } from '../core/ui.js';
import { TEMPLATES, getTemplate, featureFor } from '../data/templates/index.js';
import { CHANNELS } from '../data/channels.js';
import { listDrafts } from '../core/drafts.js';
import { fechaLarga, today } from '../tools/legal-utils.js';

const user = requireAuth();
if (user) render();

function render() {
  document.documentElement.classList.remove('no-js');
  $('[data-today]').textContent = fechaLarga(today()).replace(/^./, (c) => c.toUpperCase());
  $('[data-greeting]').textContent = `Hola, ${user.name.split(' ')[0]}`;

  // Herramientas
  const active = TOOLS.filter((t) => t.status === 'activo');
  const soon = TOOLS.filter((t) => t.status !== 'activo');
  $('[data-tools]').innerHTML = active
    .map(
      (t) => `
      <a class="card is-interactive tool-card big ${t.tone}" href="${url(t.route)}">
        <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.desc)}</p>
        <span class="go">Abrir ${ms('arrow_forward')}</span>
      </a>`,
    )
    .join('');
  $('[data-soon]').innerHTML = soon
    .map(
      (t) => `
      <div class="soon-card">
        <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
        <div><strong>${esc(t.title)}</strong>${esc(t.desc)} <span class="badge">Próximamente</span></div>
      </div>`,
    )
    .join('');

  // Plan: borradores (Premium) o invitación (Básico)
  const planSection = $('[data-plan-section]');
  if (hasFeature('drafts')) {
    const drafts = listDrafts(user).filter((d) => getTemplate(d.templateId));
    planSection.innerHTML = `
      <div class="container">
        <div class="app-section-head"><h2>Mis borradores</h2></div>
        ${
          drafts.length
            ? `<div class="draft-list">${drafts
                .map((d) => {
                  const t = getTemplate(d.templateId);
                  return `<a class="draft-item" href="${templateUrl(t.id)}">
                    <div class="card-icon ${t.tone}" style="width:40px;height:40px;margin:0">${ms(t.icon)}</div>
                    <div><strong>${esc(t.title)}</strong><small>${esc(d.label || 'Sin nombre')} · Guardado ${new Date(d.updatedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
                    ${ms('chevron_right')}
                  </a>`;
                })
                .join('')}</div>`
            : `<div class="empty-state">${ms('draft')}<span>Aún no tienes borradores. Se guardan solos mientras llenas una plantilla.</span></div>`
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

  // Plantillas
  $('[data-templates]').innerHTML = TEMPLATES.map((t) => {
    const locked = !hasFeature(featureFor(t));
    return `
      <a class="tpl-card ${locked ? 'locked' : ''}" href="${templateUrl(t.id)}">
        <div class="card-icon ${t.tone}">${ms(t.icon)}</div>
        <div><strong>${esc(t.title)}</strong><small>${esc(t.summary)}</small></div>
        ${t.plan === 'premium' ? `<span class="badge ${locked ? '' : 'badge-premium'}">${ms(locked ? 'lock' : 'workspace_premium', 'fill')}Premium</span>` : ''}
      </a>`;
  }).join('');

  // Canales destacados
  $('[data-channels]').innerHTML = CHANNELS.filter((c) => c.featured)
    .map((c) => `<a class="chip" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.service)} ${ms('open_in_new')}</a>`)
    .join('');
}
