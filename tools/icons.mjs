#!/usr/bin/env node
/**
 * Recolecta los íconos de Material Symbols usados en src/ y escribe
 * src/js/data/icon-names.json. BaseLayout.astro lo usa para pedir a Google
 * Fonts solo esos glifos (mucho más liviano). Corre solo antes de cada build.
 *
 * Uso:  node tools/icons.mjs
 *
 * Detecta:
 *   <Icon name="nombre" />            (componentes .astro)
 *   <span class="ms ...">nombre</span>  ms('nombre')   icon: 'nombre'
 *   comentarios  @icons nombre1, nombre2   (íconos elegidos dinámicamente)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'js', 'data', 'icon-names.json');

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out);
    else if (['.astro', '.js', '.mjs', '.ts'].includes(extname(entry.name))) out.push(p);
  }
  return out;
}

const PATTERNS = [
  /<Icon\s+name="([a-z0-9_]+)"/g,
  /class="ms[^"]*"[^>]*>\s*([a-z0-9_]+)\s*</g,
  /\bms\(\s*'([a-z0-9_]+)'/g,
  /\bicon:\s*'([a-z0-9_]+)'/g,
  /data-icon="([a-z0-9_]+)"/g,
];

const icons = new Set();
for (const f of await walk(SRC)) {
  const src = await readFile(f, 'utf8');
  for (const re of PATTERNS) for (const m of src.matchAll(re)) icons.add(m[1]);
  for (const m of src.matchAll(/@icons[ \t]+([a-z0-9_, \t]+)/g)) {
    m[1].split(/[\s,]+/).filter(Boolean).forEach((i) => icons.add(i));
  }
}

const list = [...icons].sort();
await writeFile(OUT, JSON.stringify(list) + '\n');
console.log(`${list.length} íconos -> src/js/data/icon-names.json`);
