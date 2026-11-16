/**
 * Borradores de documentos (función Premium).
 * En este draft se guardan en el almacenamiento local, separados por usuario.
 * La interfaz (list/get/save/remove) es la que usaría un backend real.
 */
import { local } from './storage.js';

const key = (user) => `drafts:${user.userId}`;

export function listDrafts(user) {
  const all = local.get(key(user), {}) || {};
  return Object.entries(all)
    .map(([templateId, d]) => ({ templateId, ...d }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDraft(user, templateId) {
  return (local.get(key(user), {}) || {})[templateId] || null;
}

export function saveDraft(user, templateId, values, label = '') {
  const all = local.get(key(user), {}) || {};
  all[templateId] = { values, label, updatedAt: Date.now() };
  return local.set(key(user), all);
}

export function removeDraft(user, templateId) {
  const all = local.get(key(user), {}) || {};
  delete all[templateId];
  local.set(key(user), all);
}

/** Traspaso temporal de datos entre plantillas ("Convertir en tutela"). */
export function setHandoff(data) { local.set('handoff', { data, at: Date.now() }); }
export function takeHandoff() {
  const h = local.get('handoff');
  local.remove('handoff');
  return h && Date.now() - h.at < 10 * 60 * 1000 ? h.data : null;
}
