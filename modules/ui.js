/**
 * ============================================================
 *  modules/ui.js
 *  Responsable de toda la retroalimentación visual:
 *    · Toasts (notificaciones flotantes)
 *    · Panel de consola en el DOM
 *  No contiene lógica de negocio.
 * ============================================================
 */

/** Referencia al contenedor de toasts */
const toastContainer = document.getElementById('toast-container');

/** Referencia al panel de log visible en el DOM */
const logOutput = document.getElementById('log-output');

// ── TOASTS ────────────────────────────────────────────────

/**
 * Muestra una notificación flotante temporal.
 * @param {string} mensaje
 * @param {'success'|'error'|'info'} tipo
 * @param {number} duracion — ms antes de desaparecer (default 3000)
 */
export const mostrarToast = (mensaje, tipo = 'info', duracion = 3000) => {
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut .25s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, duracion);
};

// ── LOG / CONSOLA ─────────────────────────────────────────

/**
 * Agrega una línea al panel de consola del DOM y al console nativo.
 * @param {string} mensaje
 * @param {'info'|'success'|'error'|'warn'} tipo
 */
export const logConsola = (mensaje, tipo = 'info') => {
  const div = document.createElement('div');
  div.className = `log-${tipo}`;
  div.textContent = `[${new Date().toLocaleTimeString('es-CO')}] ${mensaje}`;
  logOutput.appendChild(div);
  logOutput.scrollTop = logOutput.scrollHeight;

  // Mirror en console nativo del navegador
  const colorMap = { success: '#85c27e', error: '#e07b6a', warn: '#e8c56d', info: '#7ecbc3' };
  console[tipo === 'success' ? 'log' : tipo](
    `%c${mensaje}`, `color:${colorMap[tipo] ?? colorMap.info}`
  );
};

// ── HELPERS DE ESTADO DE BOTÓN ────────────────────────────

/**
 * Pone un botón en estado de carga (deshabilita + cambia texto).
 * @param {HTMLButtonElement} btn
 * @param {string} textoLoading
 */
export const btnLoading = (btn, textoLoading = '⟳ Cargando...') => {
  btn.disabled = true;
  btn._textoOriginal = btn.textContent;
  btn.textContent = textoLoading;
};

/**
 * Restaura un botón a su estado normal.
 * @param {HTMLButtonElement} btn
 */
export const btnReady = (btn) => {
  btn.disabled = false;
  btn.textContent = btn._textoOriginal ?? btn.textContent;
};
