/**
 * ============================================================
 *  modules/dom.js
 *  Responsable de toda la manipulación del DOM:
 *    · Renderizar la lista de notas
 *    · Crear / eliminar elementos <li>
 *    · Abrir / cerrar el modal de edición
 *    · Actualizar el contador del header
 *
 *  Recibe callbacks desde app.js para no acoplarse al store.
 * ============================================================
 */

import { formatearFecha } from './utils.js';

// ── Referencias al DOM ────────────────────────────────────
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');
const editModal = document.getElementById('edit-modal');
const editTitulo = document.getElementById('edit-titulo');
const editDescripcion = document.getElementById('edit-descripcion');
const editCategoria = document.getElementById('edit-categoria');

// ── RENDERIZADO COMPLETO ──────────────────────────────────

/**
 * Renderiza todas las notas filtradas en el DOM.
 * Limpia la lista actual y recrea los <li> con appendChild().
 *
 * @param {Array}    notas           — Array completo de notas
 * @param {string}   filtroCategoria — 'todos' o nombre de categoría
 * @param {string}   terminoBusqueda — Texto a buscar en título/descripción
 * @param {Function} onEliminar      — Callback(id) al pulsar "Eliminar"
 * @param {Function} onEditar        — Callback(id) al pulsar "Editar"
 */
export const renderizarLista = (notas, filtroCategoria, terminoBusqueda, onEliminar, onEditar) => {
  notesList.innerHTML = '';
  noteCount.textContent = notas.length;

  // Filtrar
  const filtradas = notas.filter(nota => {
    const okCategoria = filtroCategoria === 'todos' || nota.categoria === filtroCategoria;
    const term = terminoBusqueda.toLowerCase();
    const okBusqueda = !term ||
      nota.titulo.toLowerCase().includes(term) ||
      nota.descripcion.toLowerCase().includes(term);
    return okCategoria && okBusqueda;
  });

  if (filtradas.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📝</span>
        ${notas.length === 0
        ? 'Sin notas aún. ¡Agrega tu primera nota!'
        : 'Ninguna nota coincide con el filtro.'}
      </div>`;
    notesList.appendChild(li);
    return;
  }

  // Crear <li> para cada nota usando appendChild()
  filtradas.forEach(nota => {
    const li = crearElementoNota(nota, onEliminar, onEditar);
    notesList.appendChild(li);
  });
};

// ── CREAR ELEMENTO <li> ───────────────────────────────────

/**
 * Construye un elemento <li> completo para una nota.
 * Usa appendChild() en cada paso.
 *
 * @param {Object}   nota
 * @param {Function} onEliminar — Callback(id, liElement)
 * @param {Function} onEditar   — Callback(id)
 * @returns {HTMLLIElement}
 */
const crearElementoNota = (nota, onEliminar, onEditar) => {
  const li = document.createElement('li');
  li.className = 'note-item';
  li.dataset.id = nota.id;

  // Barra lateral de color según categoría
  const tagBar = document.createElement('div');
  tagBar.className = `note-tag-bar tag-${nota.categoria}`;
  li.appendChild(tagBar);

  // Cuerpo principal
  const body = document.createElement('div');
  body.className = 'note-body';

  // — Encabezado (título + badge) —
  const header = document.createElement('div');
  header.className = 'note-header';

  const h3 = document.createElement('h3');
  h3.className = 'note-title';
  h3.textContent = nota.titulo;
  header.appendChild(h3);

  const catBadge = document.createElement('span');
  catBadge.className = 'note-category';
  catBadge.textContent = nota.categoria;
  header.appendChild(catBadge);

  if (nota.sincronizada) {
    const apiBadge = document.createElement('span');
    apiBadge.className = 'api-badge';
    apiBadge.textContent = '✓ JSON Server';
    header.appendChild(apiBadge);
  }

  body.appendChild(header);

  // — Descripción —
  const desc = document.createElement('p');
  desc.className = 'note-description';
  desc.textContent = nota.descripcion;
  body.appendChild(desc);

  // — Metadatos —
  const meta = document.createElement('div');
  meta.className = 'note-meta';
  meta.innerHTML = `
    <span>📅 ${formatearFecha(nota.fechaCreacion)}</span>
    <span>#${nota.id.slice(5, 13)}</span>
  `;
  body.appendChild(meta);
  li.appendChild(body);

  // — Botones de acción —
  const acciones = document.createElement('div');
  acciones.className = 'note-actions';

  const btnEditar = document.createElement('button');
  btnEditar.className = 'btn btn-edit';
  btnEditar.textContent = '✎ Editar';
  btnEditar.addEventListener('click', () => onEditar(nota.id));
  acciones.appendChild(btnEditar);

  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn btn-danger';
  btnEliminar.textContent = '✕ Eliminar';
  btnEliminar.addEventListener('click', () => onEliminar(nota.id, li));
  acciones.appendChild(btnEliminar);

  li.appendChild(acciones);

  return li;
};

// ── ELIMINAR <li> CON ANIMACIÓN ───────────────────────────

/**
 * Elimina un elemento <li> del DOM con animación de salida.
 * Usa removeChild() cuando termina la animación.
 * @param {HTMLElement} li
 */
export const removerElemento = (li) => {
  li.classList.add('removing');
  li.addEventListener('animationend', () => {
    if (li.parentNode) li.parentNode.removeChild(li);
  }, { once: true });
};

// ── MODAL DE EDICIÓN ──────────────────────────────────────

/**
 * Abre el modal de edición con los valores actuales de la nota.
 * @param {Object} nota
 */
export const abrirModal = (nota) => {
  editTitulo.value = nota.titulo;
  editDescripcion.value = nota.descripcion;
  editCategoria.value = nota.categoria;
  editModal.showModal();
};

/**
 * Cierra el modal de edición.
 */
export const cerrarModal = () => editModal.close();

/**
 * Devuelve los valores actuales del formulario del modal.
 * @returns {{ titulo: string, descripcion: string, categoria: string }}
 */
export const getValoresModal = () => ({
  titulo: editTitulo.value,
  descripcion: editDescripcion.value,
  categoria: editCategoria.value
});

// ── FORMULARIO PRINCIPAL ──────────────────────────────────

/**
 * Limpia los campos del formulario de nueva nota.
 */
export const limpiarFormulario = () => {
  document.getElementById('input-titulo').value = '';
  document.getElementById('input-descripcion').value = '';
  document.getElementById('input-categoria').value = 'personal';
  document.getElementById('input-titulo').focus();
};

/**
 * Marca visualmente un campo como inválido.
 * @param {HTMLElement} campo
 * @param {boolean} invalido
 */
export const marcarCampo = (campo, invalido) => {
  campo.style.borderColor = invalido ? 'var(--danger)' : '';
};
