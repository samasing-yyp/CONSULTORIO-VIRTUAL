/**
 * «Mis datos»: datos personales que la persona decide recordar en este
 * dispositivo para llenar automáticamente cualquier documento.
 * Solo se guardan si la persona activa «Recordar mis datos». Se pueden borrar
 * en cualquier momento desde el mismo interruptor.
 */
import { local } from './storage.js';

export const PROFILE_KEYS = ['nombre', 'genero', 'tipoDoc', 'numDoc', 'expedicion', 'ciudad', 'direccion', 'telefono', 'email'];

const key = (user) => `profile:${user.userId}`;

export function getProfile(user) {
  return local.get(key(user), null);
}

export function isRemembering(user) {
  return !!getProfile(user);
}

export function saveProfile(user, values) {
  const data = {};
  for (const k of PROFILE_KEYS) if (values[k] != null && values[k] !== '') data[k] = values[k];
  local.set(key(user), { ...data, updatedAt: Date.now() });
}

export function forgetProfile(user) {
  local.remove(key(user));
}

/** Copia los datos guardados en los campos vacíos de una plantilla. Devuelve cuántos llenó. */
export function applyProfile(user, values, fieldIds) {
  const p = getProfile(user);
  if (!p) return 0;
  let n = 0;
  for (const k of PROFILE_KEYS) {
    if (!fieldIds.has(k) || p[k] == null) continue;
    const empty = values[k] == null || values[k] === '' || (k === 'genero' && values[k] === 'n') || (k === 'tipoDoc' && values[k] === 'cédula de ciudadanía');
    if (empty && values[k] !== p[k]) { values[k] = p[k]; n++; }
  }
  return n;
}
