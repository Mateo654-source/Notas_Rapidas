/**
 * ============================================================
 *  modules/config.js
 *  Constantes globales y configuración centralizada.
 *  Modifica API_BASE_URL si cambias el puerto de JSON Server.
 * ============================================================
 */

/** URL base de JSON Server (por defecto puerto 3000) */
export const API_BASE_URL = 'http://localhost:3000/notas';

/** Clave usada para persistir en LocalStorage */
export const LS_KEY = 'notaRapida_notas';

/** Categorías disponibles */
export const CATEGORIAS = ['personal', 'trabajo', 'idea', 'urgente', 'otro'];
