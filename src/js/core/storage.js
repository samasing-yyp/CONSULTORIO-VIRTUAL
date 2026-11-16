/**
 * Envoltorio seguro de localStorage / sessionStorage.
 * - Llaves con espacio de nombres y versión (cd:v1:...) para poder migrar datos.
 * - Nunca lanza errores: en modo privado o con almacenamiento bloqueado
 *   cae a un almacén en memoria y el sitio sigue funcionando.
 */

const NS = 'cd:v1:';
const memory = new Map();

function backend(kind) {
  try {
    const s = kind === 'session' ? window.sessionStorage : window.localStorage;
    const probe = `${NS}__probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function make(kind) {
  const store = backend(kind);
  return {
    get(key, fallback = null) {
      try {
        const raw = store ? store.getItem(NS + key) : memory.get(kind + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (store) store.setItem(NS + key, raw);
        else memory.set(kind + key, raw);
        return true;
      } catch {
        memory.set(kind + key, raw);
        return false;
      }
    },
    remove(key) {
      try {
        if (store) store.removeItem(NS + key);
      } catch { /* sin acción */ }
      memory.delete(kind + key);
    },
  };
}

export const local = make('local');
export const session = make('session');
