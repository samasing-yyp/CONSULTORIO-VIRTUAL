#!/usr/bin/env node
/**
 * Recolecta los íconos de Material Symbols usados en el sitio y actualiza el
 * parámetro `icon_names` del <link data-icons> en todas las páginas HTML.
 * Así Google Fonts solo envía los glifos necesarios (mucho más liviano).
 *
 * Uso:  node tools/icons.mjs
 *
 * Detecta:
 *   <span class="ms ...">nombre</span>      (HTML y plantillas de texto en JS)
 *   ms('nombre')   icon: 'nombre'   data-icon="nombre"
 *   comentarios  @icons nombre1, nombre2   (para íconos elegidos dinámicamente)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', '.git', 'vendor', '.claude']);
const SKIP_TOP = new Set(['tools']); // solo la carpeta tools/ de la raíz

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || (dir === ROOT && SKIP_TOP.has(entry.name))) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out);
    else if (['.html', '.js'].includes(extname(entry.name))) out.push(p);
  }
  return out;
}

const PATTERNS = [
  /class="ms[^"]*"[^>]*>\s*([a-z0-9_]+)\s*</g,
  /\bms\(\s*'([a-z0-9_]+)'/g,
  /\bicon:\s*'([a-z0-9_]+)'/g,
  /data-icon="([a-z0-9_]+)"/g,
];

const files = await walk(ROOT);
const icons = new Set();
for (const f of files) {
  const src = await readFile(f, 'utf8');
  for (const re of PATTERNS) for (const m of src.matchAll(re)) icons.add(m[1]);
  for (const m of src.matchAll(/@icons[ \t]+([a-z0-9_, \t]+)/g)) {
    m[1].split(/[\s,]+/).filter(Boolean).forEach((i) => icons.add(i));
  }
}

const list = [...icons].sort();
const param = list.join(',');
let updated = 0;
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const src = await readFile(f, 'utf8');
  const next = src.replace(/(data-icons[^>]*icon_names=)[^&"]*/g, `$1${param}`)
                  .replace(/(icon_names=)[^&"]*(&display=block"[^>]*data-icons)/g, `$1${param}$2`);
  if (next !== src) { await writeFile(f, next); updated++; }
}
console.log(`${list.length} íconos -> ${updated} páginas actualizadas`);
console.log(list.join(' '));
