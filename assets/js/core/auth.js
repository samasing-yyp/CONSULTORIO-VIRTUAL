/**
 * Sesión (versión demo).
 *
 * La interfaz pública (login, loginDemo, logout, currentUser, requireAuth,
 * hasFeature) está pensada para mantenerse igual cuando se conecte un backend
 * real: solo cambiaría la implementación interna de `login` y de la sesión.
 */
import { local } from './storage.js';
import { PLANS, ROUTES, url } from './config.js';
import { DEMO_USERS } from '../data/users.js';

const KEY = 'session';
const TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function createSession(user) {
  const now = Date.now();
  const s = {
    userId: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: now,
    expiresAt: now + TTL_MS,
  };
  local.set(KEY, s);
  return s;
}

/** Simula una llamada a servidor. */
export async function login(email, password) {
  await new Promise((r) => setTimeout(r, 450));
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password,
  );
  if (!user) return { ok: false, error: 'Correo o contraseña incorrectos.' };
  return { ok: true, user: createSession(user) };
}

export async function loginDemo(plan) {
  const user = DEMO_USERS.find((u) => u.plan === plan);
  if (!user) return { ok: false, error: 'Plan no disponible.' };
  return { ok: true, user: createSession(user) };
}

export function logout() {
  local.remove(KEY);
  window.location.href = url(ROUTES.home);
}

export function currentUser() {
  const s = local.get(KEY);
  if (!s || typeof s !== 'object') return null;
  if (!s.expiresAt || s.expiresAt < Date.now()) {
    local.remove(KEY);
    return null;
  }
  return s;
}

export function planOf(user = currentUser()) {
  return user ? PLANS[user.plan] || PLANS.basico : null;
}

export function hasFeature(feature, user = currentUser()) {
  const plan = planOf(user);
  return !!plan && plan.features.includes(feature);
}

/** Redirige a Ingresar si no hay sesión. Devuelve el usuario si existe. */
export function requireAuth() {
  const user = currentUser();
  if (!user) {
    const next = window.location.pathname + window.location.search;
    window.location.replace(`${url(ROUTES.ingresar)}?next=${encodeURIComponent(next)}`);
    return null;
  }
  return user;
}

/** Devuelve una URL "next" segura (solo del mismo sitio). */
export function safeNext(raw) {
  if (!raw) return url(ROUTES.app);
  try {
    const target = new URL(raw, window.location.origin);
    const root = new URL(url());
    // Solo rutas del propio sitio (mismo origen y dentro de su carpeta raíz)
    if (target.origin !== root.origin || !target.pathname.startsWith(root.pathname)) return url(ROUTES.app);
    return target.href;
  } catch {
    return url(ROUTES.app);
  }
}
