/**
 * ============================================================
 *  modules/storage.js
 *  Capa de abstracción para LocalStorage.
 *  Encapsula serialización, deserialización y manejo de errores.
 * ============================================================
 */

import { LS_KEY } from './config.js';
import { logConsola } from './ui.js';

/**
 * Guarda el array de notas serializado en LocalStorage.
 * @param {Array} notas — Array global de notas
 */
export const guardar = (notas) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notas));
    logConsola(`LocalStorage: ${notas.length} nota(s) guardada(s)`, 'success');

    // Evidencia en DevTools: tabla con resumen
    console.groupCollapsed('📦 LocalStorage → estado actual');
    console.table(notas.map(n => ({
      id: n.id.slice(0, 14),
      titulo: n.titulo,
      categoria: n.categoria,
      sincronizada: n.sincronizada
    })));
    console.groupEnd();
  } catch (err) {
    logConsola(`Error al guardar en LocalStorage: ${err.message}`, 'error');
  }
};

/**
 * Lee y devuelve el array de notas desde LocalStorage.
 * Retorna [] si no hay datos o si hay un error de parseo.
 * @returns {Array}
 */
export const cargar = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      logConsola('LocalStorage vacío — iniciando sin notas', 'info');
      return [];
    }
    const notas = JSON.parse(raw);
    logConsola(`LocalStorage: ${notas.length} nota(s) recuperada(s)`, 'success');
    return notas;
  } catch (err) {
    logConsola(`Error al leer LocalStorage: ${err.message}`, 'error');
    return [];
  }
};

/**
 * Elimina completamente la clave de notas en LocalStorage.
 * Útil para testing o botón "borrar todo".
 */
export const limpiar = () => {
  localStorage.removeItem(LS_KEY);
  logConsola('LocalStorage limpiado', 'warn');
};
