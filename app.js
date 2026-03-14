/**
 * ============================================================
 *  app.js  —  Orquestador principal de NotaRápida
 *
 *  Responsabilidad: conectar módulos y registrar event listeners.
 *  NO contiene lógica de negocio ni de presentación directa.
 *
 *  Árbol de módulos:
 *    app.js
 *      ├── modules/store.js    ← estado global + reglas de negocio
 *      │     ├── modules/api.js       ← Fetch CRUD con JSON Server
 *      │     ├── modules/storage.js   ← LocalStorage
 *      │     └── modules/utils.js     ← helpers puros
 *      ├── modules/dom.js      ← manipulación del DOM
 *      └── modules/ui.js       ← toasts + consola DOM
 * ============================================================
 */

import {
  inicializar, getNotas,
  agregarNota, actualizarNota, eliminarNota,
  sincronizarTodo, validarNota
} from './modules/store.js';

import {
  renderizarLista, removerElemento,
  abrirModal, cerrarModal, getValoresModal,
  limpiarFormulario, marcarCampo
} from './modules/dom.js';

import { mostrarToast, logConsola, btnLoading, btnReady } from './modules/ui.js';

/* ============================================================
   1. ESTADO LOCAL DEL ORQUESTADOR
   (solo control de UI: filtro activo y término de búsqueda)
   ============================================================ */
let filtroActivo = 'todos';
let terminoBusqueda = '';
let notaEditandoId = null;   // ID de la nota abierta en el modal

/* ============================================================
   2. HELPER: re-renderizar con el estado actual de filtros
   ============================================================ */
const refrescar = () =>
  renderizarLista(
    getNotas(),
    filtroActivo,
    terminoBusqueda,
    handleEliminar,
    handleEditar
  );

/* ============================================================
   3. HANDLERS DE EVENTOS
   ============================================================ */

/** Agrega una nota nueva tras validar los campos del formulario */
const handleAgregar = () => {
  const titulo = document.getElementById('input-titulo').value;
  const descripcion = document.getElementById('input-descripcion').value;
  const categoria = document.getElementById('input-categoria').value;

  // Validar con el store (incluye chequeo de duplicados con Set)
  const { valido, errores } = validarNota(titulo, descripcion);

  // Marcar / desmarcar campos inválidos en el DOM
  marcarCampo(
    document.getElementById('input-titulo'),
    !titulo || titulo.trim().length < 2
  );
  marcarCampo(
    document.getElementById('input-descripcion'),
    !descripcion || descripcion.trim().length < 5
  );

  if (!valido) {
    errores.forEach(e => mostrarToast(`⚠️ ${e}`, 'error'));
    logConsola(`Validación fallida: ${errores.join(' | ')}`, 'error');
    return;
  }

  agregarNota(titulo, descripcion, categoria);
  limpiarFormulario();
  refrescar();
  mostrarToast('✅ Nota agregada.', 'success');
};

/** Elimina una nota: animación en DOM + DELETE en API si aplica */
const handleEliminar = async (id, liElement) => {
  removerElemento(liElement);            // animación inmediata
  const ok = await eliminarNota(id);     // lógica en store + api
  if (ok) {
    mostrarToast('🗑️ Nota eliminada.', 'info');
    refrescar();   // actualiza contador
  }
};

/** Abre el modal de edición con los datos de la nota seleccionada */
const handleEditar = (id) => {
  const nota = getNotas().find(n => n.id === id);
  if (!nota) return;
  notaEditandoId = id;
  abrirModal(nota);
  logConsola(`Editando: "${nota.titulo}"`, 'info');
};

/** Guarda los cambios del modal (PUT en API si la nota estaba sincronizada) */
const handleGuardarEdicion = async () => {
  const { titulo, descripcion, categoria } = getValoresModal();
  const { valido, errores } = validarNota(titulo, descripcion, notaEditandoId);

  if (!valido) {
    errores.forEach(e => mostrarToast(`⚠️ ${e}`, 'error'));
    return;
  }

  await actualizarNota(notaEditandoId, { titulo, descripcion, categoria });
  cerrarModal();
  notaEditandoId = null;
  refrescar();
  mostrarToast('✏️ Nota actualizada.', 'success');
};

/** Sincroniza con JSON Server: GET inicial + POST de pendientes */
const handleSincronizar = async () => {
  const btn = document.getElementById('btn-sync-api');
  btnLoading(btn, '⟳ Sincronizando...');

  const { exitosas, fallidas } = await sincronizarTodo();

  btnReady(btn);
  refrescar();

  if (exitosas > 0)
    mostrarToast(`✅ ${exitosas} nota(s) enviadas a JSON Server.`, 'success');
  if (fallidas > 0)
    mostrarToast(`❌ ${fallidas} nota(s) no pudieron sincronizarse.`, 'error');
  if (exitosas === 0 && fallidas === 0)
    mostrarToast('ℹ️ Todas las notas ya estaban sincronizadas.', 'info');
};

/* ============================================================
   4. REGISTRO DE EVENT LISTENERS
   ============================================================ */

// Formulario principal
document.getElementById('btn-agregar')
  .addEventListener('click', handleAgregar);

document.getElementById('input-titulo')
  .addEventListener('keydown', e => { if (e.key === 'Enter') handleAgregar(); });

// Sincronización con JSON Server
document.getElementById('btn-sync-api')
  .addEventListener('click', handleSincronizar);

// Filtros de categoría
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroActivo = btn.dataset.filter;
    refrescar();
    logConsola(`Filtro activo: ${filtroActivo}`, 'info');
  });
});

// Búsqueda en tiempo real
document.getElementById('input-buscar')
  .addEventListener('input', e => {
    terminoBusqueda = e.target.value;
    refrescar();
  });

// Modal: cerrar sin guardar
document.getElementById('btn-cancel-edit')
  .addEventListener('click', () => { cerrarModal(); notaEditandoId = null; });

// Modal: guardar cambios
document.getElementById('btn-save-edit')
  .addEventListener('click', handleGuardarEdicion);

// Toggle panel consola
document.getElementById('toggle-log')
  .addEventListener('click', () => {
    const log = document.getElementById('log-output');
    log.style.display = log.style.display === 'none' ? 'block' : 'none';
  });

/* ============================================================
   5. ARRANQUE ASÍNCRONO
   ============================================================ */

/**
 * Secuencia de inicio:
 *  1. GET a JSON Server + merge con LocalStorage
 *  2. Si no hay notas, insertar nota de bienvenida
 *  3. Renderizar la lista
 */
const arrancar = async () => {
  logConsola('Iniciando NotaRápida...', 'info');

  await inicializar();

  if (getNotas().length === 0) {
    agregarNota(
      '¡Bienvenido a NotaRápida!',
      'App modular: DOM · LocalStorage · JSON Server. ¡Agrega tu primera nota!',
      'personal'
    );
  }

  refrescar();
  mostrarToast('📋 NotaRápida lista.', 'success');
  logConsola(`App lista — ${getNotas().length} nota(s) cargada(s)`, 'success');

  // Evidencia en DevTools del contenido de LocalStorage
  console.log(
    '%c🗄️ LocalStorage inicial:',
    'color:#e8c56d; font-weight:bold',
    JSON.parse(localStorage.getItem('notaRapida_notas') ?? '[]')
  );
};

arrancar();
