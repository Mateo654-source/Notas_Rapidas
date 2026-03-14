/**
 * ============================================================
 *  modules/store.js
 *  Estado global de la aplicación y lógica de negocio.
 *  Actúa como la única fuente de verdad (single source of truth).
 *
 *  Exporta:
 *    · getNotas()          — lectura del array
 *    · agregarNota()       — crear
 *    · actualizarNota()    — editar
 *    · eliminarNota()      — borrar
 *    · sincronizarTodo()   — POST de notas pendientes
 *    · cargarDesdeServidor()— GET inicial desde JSON Server
 * ============================================================
 */

import { generarId } from './utils.js';
import { guardar, cargar } from './storage.js';
import { logConsola, mostrarToast } from './ui.js';
import {
  apiGetNotas, apiPostNota,
  apiPutNota, apiDeleteNota
} from './api.js';

// ── Estado privado ────────────────────────────────────────
/** @type {Array<Object>} Array principal de notas en memoria */
let _notas = [];

// ── Acceso de lectura ─────────────────────────────────────

/** Devuelve una copia del array (evita mutación externa) */
export const getNotas = () => [..._notas];

// ── Inicialización ────────────────────────────────────────

/**
 * Inicializa el store:
 *  1. Carga desde LocalStorage (para tener datos inmediatamente)
 *  2. Intenta hacer GET a JSON Server para sincronizar
 * @returns {Array} Notas cargadas
 */
export const inicializar = async () => {
  // Paso 1: cargar cache local primero (UI instantánea)
  _notas = cargar();

  // Paso 2: intentar obtener datos del servidor
  const notasServidor = await apiGetNotas();

  if (notasServidor && notasServidor.length > 0) {
    // Merge: el servidor es fuente de verdad para notas sincronizadas
    // Conservamos notas locales no sincronizadas
    const localesNuevos = _notas.filter(n => !n.sincronizada);
    _notas = [...notasServidor.map(n => ({ ...n, sincronizada: true })), ...localesNuevos];
    guardar(_notas);
    logConsola(`Store inicializado con ${notasServidor.length} nota(s) del servidor`, 'success');
  } else {
    logConsola('JSON Server no disponible — usando cache local', 'warn');
  }

  return [..._notas];
};

// ── CREAR ─────────────────────────────────────────────────

/**
 * Agrega una nueva nota al store, persiste en LS.
 * La sincronización con la API queda pendiente (sincronizada: false).
 * @param {string} titulo
 * @param {string} descripcion
 * @param {string} categoria
 * @returns {Object} La nota creada
 */
export const agregarNota = (titulo, descripcion, categoria) => {
  const nuevaNota = {
    id: generarId(),
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    categoria,
    fechaCreacion: new Date().toISOString(),
    sincronizada: false
  };

  _notas.unshift(nuevaNota);
  guardar(_notas);
  logConsola(`Nota creada localmente: "${nuevaNota.titulo}"`, 'success');
  return nuevaNota;
};

// ── ACTUALIZAR ────────────────────────────────────────────

/**
 * Actualiza los campos de una nota existente.
 * Si estaba sincronizada, hace PUT a JSON Server.
 * @param {string} id
 * @param {{ titulo, descripcion, categoria }} cambios
 * @returns {Object|null} Nota actualizada o null si no existe
 */
export const actualizarNota = async (id, cambios) => {
  const indice = _notas.findIndex(n => n.id === id);
  if (indice === -1) {
    logConsola(`actualizarNota: ID "${id}" no encontrado`, 'error');
    return null;
  }

  _notas[indice] = { ..._notas[indice], ...cambios };

  // Si ya estaba en el servidor, hacer PUT
  if (_notas[indice].sincronizada) {
    const resultado = await apiPutNota(_notas[indice].id, _notas[indice]);
    if (!resultado) mostrarToast('⚠️ Cambios guardados localmente (API no disponible).', 'error');
  }

  guardar(_notas);
  logConsola(`Nota actualizada: "${_notas[indice].titulo}"`, 'success');
  return { ..._notas[indice] };
};

// ── ELIMINAR ──────────────────────────────────────────────

/**
 * Elimina una nota del store y del servidor (si estaba sincronizada).
 * @param {string} id
 * @returns {boolean}
 */
export const eliminarNota = async (id) => {
  const nota = _notas.find(n => n.id === id);
  if (!nota) {
    logConsola(`eliminarNota: ID "${id}" no encontrado`, 'error');
    return false;
  }

  // DELETE en JSON Server si estaba sincronizada
  if (nota.sincronizada) {
    const ok = await apiDeleteNota(nota.id);
    if (!ok) mostrarToast('⚠️ Eliminada localmente (API no disponible).', 'error');
  }

  _notas = _notas.filter(n => n.id !== id);
  guardar(_notas);
  logConsola(`Nota eliminada: "${nota.titulo}"`, 'warn');
  return true;
};

// ── SINCRONIZAR ───────────────────────────────────────────

/**
 * Envía al servidor todas las notas que aún no están sincronizadas (POST).
 * Actualiza el estado de cada una tras el POST exitoso.
 * @returns {{ exitosas: number, fallidas: number }}
 */
export const sincronizarTodo = async () => {
  const pendientes = _notas.filter(n => !n.sincronizada);

  if (pendientes.length === 0) {
    logConsola('Nada pendiente de sincronizar', 'info');
    return { exitosas: 0, fallidas: 0 };
  }

  logConsola(`Sincronizando ${pendientes.length} nota(s)...`, 'info');
  let exitosas = 0;
  let fallidas = 0;

  // POST en paralelo
  const resultados = await Promise.allSettled(
    pendientes.map(nota => apiPostNota(nota))
  );

  resultados.forEach((res, i) => {
    const idLocal = pendientes[i].id;
    const idx = _notas.findIndex(n => n.id === idLocal);

    if (res.status === 'fulfilled' && res.value) {
      // JSON Server devuelve el objeto con el mismo id que enviamos
      _notas[idx].sincronizada = true;
      exitosas++;
    } else {
      fallidas++;
    }
  });

  guardar(_notas);
  logConsola(`Sincronización: ${exitosas} ok, ${fallidas} fallidas`, exitosas ? 'success' : 'error');
  return { exitosas, fallidas };
};

// ── VALIDACIÓN (negocio) ──────────────────────────────────

/**
 * Valida los datos de una nota antes de crearla o editarla.
 * Usa Set para detectar títulos duplicados.
 * @param {string} titulo
 * @param {string} descripcion
 * @param {string|null} idActual — ID a excluir en edición
 * @returns {{ valido: boolean, errores: string[] }}
 */
export const validarNota = (titulo, descripcion, idActual = null) => {
  const errores = [];

  if (!titulo || titulo.trim().length < 2)
    errores.push('El título debe tener al menos 2 caracteres.');

  if (!descripcion || descripcion.trim().length < 5)
    errores.push('La descripción debe tener al menos 5 caracteres.');

  // Set de títulos existentes excluyendo la nota que se edita
  const titulosSet = new Set(
    _notas
      .filter(n => n.id !== idActual)
      .map(n => n.titulo.toLowerCase().trim())
  );

  if (errores.length === 0 && titulosSet.has(titulo.toLowerCase().trim()))
    errores.push('Ya existe una nota con ese título.');

  return { valido: errores.length === 0, errores };
};
