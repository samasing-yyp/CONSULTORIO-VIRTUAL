// @icons visibility_off
import '../components/site-chrome.js';
import { $, $$, ms } from '../core/ui.js';
import { login, loginDemo, currentUser, safeNext } from '../core/auth.js';

const params = new URLSearchParams(window.location.search);
const next = safeNext(params.get('next'));

// Sesión existente: si venía de una página protegida, entra directo
const existing = currentUser();
if (existing && params.get('next')) {
  window.location.replace(next);
} else if (existing) {
  $('.session-notice').hidden = false;
  $('[data-session-name]').textContent = existing.name;
}

// Plan sugerido desde la página de precios (?plan=premium)
const suggested = params.get('plan');
if (suggested) $(`[data-demo="${CSS.escape(suggested)}"]`)?.classList.add('is-suggested');

// Mostrar / ocultar contraseña
const pass = $('#password');
const toggle = $('.pass-toggle');
toggle.addEventListener('click', () => {
  const show = pass.type === 'password';
  pass.type = show ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(show));
  toggle.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  toggle.innerHTML = ms(show ? 'visibility_off' : 'visibility');
});

// Formulario
const form = $('.auth-form');
const errorBox = $('.form-error');
const submit = form.querySelector('[type="submit"]');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = !msg;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const email = form.email.value.trim();
  const password = form.password.value;
  if (!email || !password) {
    showError('Escribe tu correo y tu contraseña.');
    (email ? form.password : form.email).focus();
    return;
  }
  submit.setAttribute('aria-disabled', 'true');
  submit.querySelector('.btn-label').textContent = 'Ingresando…';
  const res = await login(email, password);
  if (res.ok) {
    window.location.href = next;
    return;
  }
  submit.removeAttribute('aria-disabled');
  submit.querySelector('.btn-label').textContent = 'Ingresar';
  showError(res.error);
});

// Accesos demo
$$('[data-demo]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const res = await loginDemo(btn.dataset.demo);
    if (res.ok) window.location.href = next;
    else showError(res.error);
  }),
);
