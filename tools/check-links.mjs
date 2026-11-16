#!/usr/bin/env node
/**
 * Verifica el sitio compilado (dist/) tal como lo servirá GitHub Pages:
 *  - cada href/src interno apunta a un archivo que existe (con mayúsculas exactas);
 *  - no se publican archivos .docx ni la carpeta «.assets to learn»;
 *  - las páginas de /app/ llevan noindex.
 * El «base» (p. ej. /CONSULTORIO-VIRTUAL/) se detecta desde dist/index.html.
 *
 * Uso:  node tools/check-links.mjs [dist]     (corre solo después de npm run build)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, process.argv[2] || 'dist');

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
const known = new Set(files.map((f) => relative(DIST, f).split(sep).join('/')));
const problems = [];

const home = await readFile(join(DIST, 'index.html'), 'utf8');
const base = (home.match(/src="([^"]*)assets\/js\/boot\.js"/) || [, '/'])[1];

for (const f of files) {
  const rel = relative(DIST, f).split(sep).join('/');
  if (/\.docx$/i.test(rel) || rel.includes('.assets to learn')) problems.push(`publicaría un archivo privado: ${rel}`);
  if (!rel.endsWith('.html')) continue;
  const html = await readFile(f, 'utf8');
  if (rel.startsWith('app/') && !/<meta name="robots" content="noindex/.test(html)) problems.push(`${rel}: falta noindex`);
  const pagePath = base + rel.replace(/index\.html$/, '');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|#|data:|javascript:|\?)/.test(ref) || ref.includes('${')) continue;
    const abs = ref.startsWith('/') ? ref : posix.join(posix.dirname(pagePath.endsWith('/') ? pagePath + 'x' : pagePath), ref);
    let path = abs.split(/[?#]/)[0];
    if (!path.startsWith(base)) { problems.push(`${rel} → ${ref} (fuera del base ${base})`); continue; }
    path = decodeURI(path.slice(base.length));
    if (path === '' || path.endsWith('/')) path += 'index.html';
    if (!known.has(path)) problems.push(`${rel} → ${ref}`);
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} problema(s) en ${relative(ROOT, DIST)}/:\n  ` + [...new Set(problems)].slice(0, 60).join('\n  '));
  process.exit(1);
}
const pages = files.filter((f) => f.endsWith('.html')).length;
console.log(`✓ ${pages} páginas verificadas (base ${base}). Sin enlaces rotos, sin .docx, /app/ con noindex.`);
