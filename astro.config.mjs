// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Sitio 100 % estático: `npm run build` genera `dist/` con HTML, CSS y JS planos.
 * No hay servidor Node en producción; GitHub Pages sirve `dist/` tal cual.
 *
 * BASE_PATH y SITE_URL los define el flujo de GitHub Actions a partir de la
 * configuración de Pages (sitio de proyecto: /CONSULTORIO-VIRTUAL; dominio
 * propio: raíz). Sin esas variables se usa el sitio de proyecto.
 */
const base = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH || '/' : '/CONSULTORIO-VIRTUAL';

export default defineConfig({
  site: process.env.SITE_URL || 'https://samasing-yyp.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
