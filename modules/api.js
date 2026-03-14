/**
 * ============================================================
 *  modules/api.js
 *  Capa de comunicación con JSON Server.
 *  Implementa operaciones CRUD: GET, POST, PUT, DELETE.
 *
 *  Prerequisito: tener JSON Server corriendo con:
 *    npx json-server --watch db.json --port 3000
 *
 *  Cada función retorna los datos o null ante error.
 *  Todos los errores se loguean en consola y en el panel DOM.
 * ============================================================
 */

import { API_BASE_URL } from './config.js';
import { logConsola } from './ui.js';

// ── HEADERS comunes ───────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── HELPER INTERNO ────────────────────────────────────────

/**
 * Wrapper genérico para fetch con manejo de errores centralizado.
 * @param {string} url
 * @param {RequestInit} opciones
 * @param {string} etiqueta — Nombre del método para el log
 * @returns {any|null}
 */
const peticion = async (url, opciones, etiqueta) => {
  try {
    const res = await fetch(url, opciones);

    // JSON Server devuelve 200/201/204 en éxito
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    // DELETE devuelve 200 con body vacío en json-server
    const texto = await res.text();
    const datos = texto ? JSON.parse(texto) : {};

    logConsola(`${etiqueta} exitoso`, 'success');
    return datos;
  } catch (err) {
    logConsola(`${etiqueta} error — ${err.message}`, 'error');
    return null;
  }
};

// ── GET ───────────────────────────────────────────────────

/**
 * Obtiene todas las notas desde JSON Server.
 * @returns {Array|null}
 */
export const apiGetNotas = async () => {
  logConsola('GET → obteniendo notas de JSON Server...', 'info');
  const datos = await peticion(API_BASE_URL, {}, 'GET');

  if (datos) {
    console.groupCollapsed(`📡 GET ${API_BASE_URL}`);
    console.table(datos.map(n => ({
      id: n.id, titulo: n.titulo, categoria: n.categoria
    })));
    console.groupEnd();
  }

  return datos;
};

// ── POST ──────────────────────────────────────────────────

/**
 * Crea una nota nueva en JSON Server.
 * @param {Object} nota — Objeto nota (sin apiId)
 * @returns {Object|null} — Nota creada con el id asignado por JSON Server
 */
export const apiPostNota = async (nota) => {
  logConsola(`POST → creando "${nota.titulo}" en JSON Server...`, 'info');

  // Enviamos el objeto completo; JSON Server lo almacena tal cual
  const resultado = await peticion(
    API_BASE_URL,
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(nota) },
    'POST'
  );

  if (resultado) {
    console.log(`📡 POST ${API_BASE_URL} — creado:`, resultado);
  }

  return resultado;
};

// ── PUT ───────────────────────────────────────────────────

/**
 * Actualiza completamente una nota existente en JSON Server.
 * @param {string|number} id — ID de la nota en JSON Server
 * @param {Object} nota      — Objeto nota actualizado
 * @returns {Object|null}
 */
export const apiPutNota = async (id, nota) => {
  logConsola(`PUT → actualizando "${nota.titulo}" (id: ${id})...`, 'info');

  const resultado = await peticion(
    `${API_BASE_URL}/${id}`,
    { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(nota) },
    'PUT'
  );

  if (resultado) {
    console.log(`📡 PUT ${API_BASE_URL}/${id} — actualizado:`, resultado);
  }

  return resultado;
};

// ── DELETE ────────────────────────────────────────────────

/**
 * Elimina una nota en JSON Server por su ID.
 * @param {string|number} id
 * @returns {boolean} — true si fue eliminada, false si hubo error
 */
export const apiDeleteNota = async (id) => {
  logConsola(`DELETE → eliminando id ${id} de JSON Server...`, 'info');

  const resultado = await peticion(
    `${API_BASE_URL}/${id}`,
    { method: 'DELETE' },
    'DELETE'
  );

  console.log(`📡 DELETE ${API_BASE_URL}/${id} — OK`);

  // peticion() devuelve null solo ante error; {} es éxito
  return resultado !== null;
};
