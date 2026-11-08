#!/usr/bin/env node
/**
 * Verifica que todas las rutas internas existan con las mayúsculas exactas
 * (GitHub Pages distingue mayúsculas; Windows no).
 *
 * Revisa: href/src relativos en las páginas HTML, imports de los módulos JS,
 * los logos de channels.js y que cada ruta de ROUTES tenga su index.html.
 *
 * Uso:  node tools/check-links.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', '.git', '.claude']);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || (dir === ROOT && e.name === 'tools')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = await walk(ROOT);
const known = new Set(files.map((f) => relative(ROOT, f).split(sep).join('/')));
const problems = [];

/** Resuelve `ref` desde el archivo `from` y comprueba que exista exactamente. */
function check(from, ref) {
  const clean = ref.split(/[?#]/)[0];
  if (!clean) return;
  const base = posix.dirname(relative(ROOT, from).split(sep).join('/'));
  let target = posix.normalize(posix.join(base, clean));
  if (clean.endsWith('/') || target === '.') target = posix.join(target, 'index.html');
  if (target.startsWith('..') || !known.has(target)) problems.push(`${relative(ROOT, from)} → ${ref}`);
}

for (const f of files) {
  if (f.endsWith('.html') && !f.endsWith('404.html')) {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const ref = m[1];
      if (/^(https?:|mailto:|tel:|#|data:|\?)/.test(ref) || ref.includes('${')) continue;
      check(f, ref);
    }
  }
  if (f.endsWith('.js') && f.includes(`${sep}assets${sep}js${sep}`)) {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/(?:from\s+|import\(\s*)'(\.{1,2}\/[^']+)'/g)) check(f, m[1]);
  }
}

const channels = await readFile(join(ROOT, 'assets/js/data/channels.js'), 'utf8');
for (const m of channels.matchAll(/logo: '([^']+)'/g)) {
  if (!known.has(`assets/img/logos/${m[1]}`)) problems.push(`channels.js → logo ${m[1]}`);
}

const config = await readFile(join(ROOT, 'assets/js/core/config.js'), 'utf8');
const routes = config.match(/export const ROUTES = \{([\s\S]*?)\};/)[1];
for (const m of routes.matchAll(/:\s*'([^']*)'/g)) {
  const page = posix.join(posix.normalize(m[1] || '.'), 'index.html');
  if (!known.has(page)) problems.push(`ROUTES → ${m[1]} (falta ${page})`);
}

if (problems.length) {
  console.error(`✗ ${problems.length} ruta(s) rota(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`✓ Rutas verificadas en ${files.filter((f) => /\.(html|js)$/.test(f)).length} archivos. Sin enlaces rotos.`);
