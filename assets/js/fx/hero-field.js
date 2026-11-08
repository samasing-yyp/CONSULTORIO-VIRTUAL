/**
 * Campo de partículas del hero (Canvas 2D, sin dependencias).
 * Pequeños trazos orientados por un campo de flujo suave, en azul, amarillo y
 * rojo muy tenues. Se apartan del cursor, se pausan fuera de vista o con la
 * pestaña oculta, y con prefers-reduced-motion se dibuja un solo cuadro.
 */

const COLORS = [
  [22, 48, 94],   // azul
  [22, 48, 94],
  [22, 48, 94],
  [242, 201, 76], // amarillo
  [224, 122, 110],// rojo
];

// Ruido de valor 2D barato (suficiente para un campo de flujo suave).
function makeNoise(seed = 1) {
  const p = new Uint8Array(512);
  let s = seed;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const fade = (t) => t * t * (3 - 2 * t);
  const h = (x, y) => p[p[x & 255] + (y & 255)] / 255;
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = fade(xf), v = fade(yf);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

export function mountHeroField(canvas) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noise = makeNoise(7);
  const pointer = { x: -9999, y: -9999, active: false };
  let w = 0, h = 0, dpr = 1, particles = [], raf = 0, running = false, t = 0;

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gap = w < 640 ? 30 : 26;
    particles = [];
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const jx = x + (Math.random() - 0.5) * gap * 0.6;
        const jy = y + (Math.random() - 0.5) * gap * 0.6;
        particles.push({
          bx: jx, by: jy, x: jx, y: jy, vx: 0, vy: 0,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          len: 3 + Math.random() * 4,
        });
      }
    }
  }

  function frame() {
    t += 0.0035;
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.42;
    const maxD = Math.hypot(cx, cy);

    for (const p of particles) {
      // Repulsión del cursor
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      const R = 140;
      if (pointer.active && d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 2.2;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      // Resorte hacia su lugar
      p.vx += (p.bx - p.x) * 0.04;
      p.vy += (p.by - p.y) * 0.04;
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;

      // Ángulo según el campo de flujo
      const a = noise(p.bx * 0.004 + t, p.by * 0.004 - t * 0.6) * Math.PI * 4;
      // Más visibles hacia los bordes, casi invisibles detrás del texto central
      const dist = Math.hypot(p.bx - cx, p.by - cy) / maxD;
      const alpha = Math.min(0.55, Math.max(0, (dist - 0.18) * 0.9));
      if (alpha <= 0.01) continue;

      const l = p.len + Math.hypot(p.vx, p.vy) * 1.5;
      const ex = Math.cos(a) * l, ey = Math.sin(a) * l;
      ctx.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - ex / 2, p.y - ey / 2);
      ctx.lineTo(p.x + ex / 2, p.y + ey / 2);
      ctx.stroke();
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  build();
  frame();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); if (!running) frame(); }, 150);
  });

  const host = canvas.parentElement;
  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
  });
  host.addEventListener('pointerleave', () => { pointer.active = false; });

  if (!reduced) {
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }
}
