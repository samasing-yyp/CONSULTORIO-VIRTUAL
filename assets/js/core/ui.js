/**
 * Utilidades de interfaz compartidas.
 */
import { local } from './storage.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escapa texto para insertarlo de forma segura en HTML. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Ícono de Material Symbols. */
export const ms = (name, cls = '') => `<span class="ms ${cls}" aria-hidden="true">${name}</span>`;

/** Notificación breve en la parte inferior. */
export function toast(message, icon = 'info', ms_ = 3200) {
  let region = $('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${ms(icon)}<span>${esc(message)}</span>`;
  region.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 200ms';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, ms_);
}

/** Animación de aparición al hacer scroll. */
export function initReveal(root = document) {
  const items = $$('.reveal', root);
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- Preferencia de tamaño de texto ---------- */
const SIZES = ['', 'grande', 'muy-grande'];
const SIZE_LABEL = { '': 'Normal', grande: 'Grande', 'muy-grande': 'Muy grande' };

export function getPrefs() {
  return local.get('prefs', {}) || {};
}

export function applyTextSize(size) {
  if (size) document.documentElement.dataset.textSize = size;
  else delete document.documentElement.dataset.textSize;
}

export function cycleTextSize() {
  const prefs = getPrefs();
  const next = SIZES[(SIZES.indexOf(prefs.textSize || '') + 1) % SIZES.length];
  local.set('prefs', { ...prefs, textSize: next });
  applyTextSize(next);
  toast(`Tamaño de texto: ${SIZE_LABEL[next]}`, 'text_increase', 1800);
  return next;
}

/** Botón "Aa" reutilizable. */
export function textSizeButton() {
  return `<button class="icon-btn" type="button" data-action="text-size" title="Cambiar tamaño de texto" aria-label="Cambiar tamaño de texto">${ms('text_increase')}</button>`;
}

export function bindTextSize(root) {
  $$('[data-action="text-size"]', root).forEach((b) => b.addEventListener('click', cycleTextSize));
}

/** Convierte texto a slug sin tildes: "José Pérez" -> "jose-perez". */
export function slug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Normaliza para búsquedas: minúsculas y sin tildes. */
export const norm = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Marca el documento como "con JS" para estilos progresivos. */
document.documentElement.classList.remove('no-js');
applyTextSize(getPrefs().textSize || '');
