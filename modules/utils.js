/**
 * ============================================================
 *  modules/utils.js
 *  Funciones utilitarias puras y reutilizables.
 *  No dependen del DOM ni del estado global.
 * ============================================================
 */

/**
 * Genera un ID único basado en timestamp + aleatoriedad.
 * @returns {string}
 */
export const generarId = () =>
  'nota-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

/**
 * Formatea una fecha ISO a string legible en español (Colombia).
 * @param {string} isoString
 * @returns {string}
 */
export const formatearFecha = (isoString) => {
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

/**
 * Escapa caracteres HTML para prevenir XSS al insertar texto en el DOM.
 * @param {string} str
 * @returns {string}
 */
export const escaparHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};
