/**
 * Arranque de cada página (script clásico, síncrono y diminuto en el <head>).
 *
 * 1. Aplica el tamaño de texto guardado antes del primer pintado (sin parpadeo).
 * 2. Guardián de sesión: si <html data-auth="required"> y no hay sesión
 *    vigente, redirige a /ingresar/ antes de descargar el resto de la página.
 * 3. Precarga de navegación: Speculation Rules (Chrome/Edge) o, si no hay
 *    soporte, <link rel="prefetch"> al pasar el cursor o tocar un enlace.
 *
 * La raíz del sitio se calcula desde la ubicación de este archivo, así que
 * funciona igual en localhost, en un dominio propio o en GitHub Pages
 * (https://usuario.github.io/repositorio/).
 */
(function () {
  var html = document.documentElement;
  var NS = 'cd:v1:';
  var root = new URL('../../', document.currentScript.src);
  window.__CD_ROOT__ = root.href;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(NS + key) || 'null'); } catch (e) { return null; }
  }

  // 1. Preferencias
  var prefs = read('prefs');
  if (prefs && prefs.textSize) html.setAttribute('data-text-size', prefs.textSize);

  // 2. Guardián de sesión
  if (html.getAttribute('data-auth') === 'required') {
    var s = read('session');
    if (!s || !s.expiresAt || s.expiresAt < Date.now()) {
      var next = location.pathname + location.search + location.hash;
      location.replace(new URL('ingresar/', root).href + '?next=' + encodeURIComponent(next));
      return;
    }
  }

  // 3. Precarga de páginas internas
  var reduceData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
  if (reduceData) return;

  var EXCLUDE = '[target="_blank"], [download], [data-no-prefetch], [href^="mailto:"], [href^="#"]';

  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    var rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({
      prefetch: [{
        where: { and: [{ href_matches: root.pathname + '*' }, { not: { selector_matches: EXCLUDE } }] },
        eagerness: 'moderate',
      }],
    });
    document.head.appendChild(rules);
    return;
  }

  var done = {};
  function prefetch(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.matches(EXCLUDE) || a.origin !== location.origin) return;
    var href = a.href.split('#')[0];
    if (done[href] || href === location.href.split('#')[0]) return;
    done[href] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = href;
    document.head.appendChild(l);
  }
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);
})();
