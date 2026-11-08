/**
 * Utilidades para documentos legales colombianos:
 * fechas en letras, números a letras, pesos, ordinales y días hábiles
 * (excluye fines de semana y festivos de Colombia, Ley 51 de 1983).
 */

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Convierte 'AAAA-MM-DD' o Date a Date local a medianoche. */
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const today = () => toDate(new Date());

/** "8 de noviembre de 2026" */
export function fechaLarga(v) {
  const d = toDate(v);
  if (!d) return '';
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "a los ocho (8) días del mes de noviembre de 2026" */
export function fechaEnLetras(v) {
  const d = toDate(v);
  if (!d) return '';
  const n = d.getDate();
  const dia = n === 1 ? 'al primer (1) día' : `a los ${numeroALetras(n)} (${n}) días`;
  return `${dia} del mes de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/* ---------- Números a letras ---------- */
const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function hasta999(n) {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  let out = CENTENAS[c];
  if (r) {
    let txt;
    if (r < 30) txt = UNIDADES[r];
    else {
      const d = Math.floor(r / 10), u = r % 10;
      txt = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : '');
    }
    out = out ? `${out} ${txt}` : txt;
  }
  return out;
}

/** Número entero a letras en español: 1250000 -> "un millón doscientos cincuenta mil". */
export function numeroALetras(num) {
  let n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'cero';
  const partes = [];
  const milesDeMillones = Math.floor(n / 1e9); n %= 1e9;
  const millones = Math.floor(n / 1e6); n %= 1e6;
  const miles = Math.floor(n / 1e3); n %= 1e3;

  if (milesDeMillones) partes.push(`${milesDeMillones === 1 ? 'mil' : apocope(hasta999(milesDeMillones)) + ' mil'}`);
  if (millones || milesDeMillones) {
    if (millones === 1 && !milesDeMillones) partes.push('un millón');
    else if (millones) partes.push(`${apocope(hasta999(millones))} millones`);
    else partes.push('millones');
  }
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocope(hasta999(miles))} mil`);
  if (n) partes.push(hasta999(n));
  return partes.join(' ').replace(/\s+/g, ' ').trim();
}
// "uno" -> "un" delante de mil/millones; "veintiuno" -> "veintiún"
const apocope = (t) => t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

/** Formato COP: 1250000 -> "$1.250.000" */
export function formatCOP(n) {
  const v = Math.round(Number(n) || 0);
  return '$' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "un millón de pesos m/cte ($1.000.000)" */
export function pesosEnLetras(n) {
  const v = Math.round(Number(n) || 0);
  let letras = numeroALetras(v);
  if (/(millón|millones)$/.test(letras)) letras += ' de';
  return `${letras} pesos m/cte (${formatCOP(v)})`;
}

const ORD = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo',
  'undécimo', 'duodécimo', 'decimotercero', 'decimocuarto', 'decimoquinto', 'decimosexto', 'decimoséptimo',
  'decimoctavo', 'decimonoveno', 'vigésimo'];
/** 1 -> "PRIMERO" */
export const ordinal = (i) => (ORD[i - 1] || `${i}.º`).toUpperCase();

/* ---------- Festivos de Colombia ---------- */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const nextMonday = (d) => {
  const wd = d.getDay();
  return wd === 1 ? d : addDays(d, (8 - wd) % 7);
};

const cache = new Map();
export function festivos(year) {
  if (cache.has(year)) return cache.get(year);
  const fixed = [[0, 1], [4, 1], [6, 20], [7, 7], [11, 8], [11, 25]].map(([m, d]) => new Date(year, m, d));
  const moved = [[0, 6], [2, 19], [5, 29], [7, 15], [9, 12], [10, 1], [10, 11]].map(([m, d]) => nextMonday(new Date(year, m, d)));
  const e = easter(year);
  const easterBased = [addDays(e, -3), addDays(e, -2), nextMonday(addDays(e, 39)), nextMonday(addDays(e, 60)), nextMonday(addDays(e, 68))];
  const set = new Set([...fixed, ...moved, ...easterBased].map(isoDate));
  cache.set(year, set);
  return set;
}

export const esHabil = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !festivos(d.getFullYear()).has(isoDate(d));

/** Fecha en que vence un plazo de n días hábiles contados desde el día siguiente a `desde`. */
export function sumarDiasHabiles(desde, n) {
  let d = toDate(desde);
  if (!d) return null;
  let count = 0;
  while (count < n) {
    d = addDays(d, 1);
    if (esHabil(d)) count++;
  }
  return d;
}

/** Días hábiles transcurridos entre `desde` (excluido) y `hasta` (incluido). */
export function diasHabilesEntre(desde, hasta = today()) {
  let d = toDate(desde);
  const end = toDate(hasta);
  if (!d || !end || end <= d) return 0;
  let count = 0;
  while (d < end) {
    d = addDays(d, 1);
    if (esHabil(d)) count++;
  }
  return count;
}

/** Años completos transcurridos. */
export function aniosEntre(desde, hasta = today()) {
  const a = toDate(desde), b = toDate(hasta);
  if (!a || !b) return 0;
  let y = b.getFullYear() - a.getFullYear();
  if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) y--;
  return Math.max(0, y);
}

export function sumarAnios(desde, n) {
  const a = toDate(desde);
  return a ? new Date(a.getFullYear() + n, a.getMonth(), a.getDate()) : null;
}
