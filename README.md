# NotaRápida — Mini App de Notas Modular

App web de notas que integra DOM, LocalStorage y JSON Server.

## Estructura del proyecto

```
/
├── index.html              ← Estructura HTML + estilos
├── app.js                  ← Orquestador (event listeners + arranque)
├── db.json                 ← Base de datos de JSON Server
├── README.md
└── modules/
    ├── config.js           ← Constantes y URL de la API
    ├── utils.js            ← Helpers puros (generarId, formatearFecha)
    ├── ui.js               ← Toasts + panel de consola DOM
    ├── storage.js          ← Capa de LocalStorage
    ├── api.js              ← Fetch CRUD con JSON Server
    ├── store.js            ← Estado global + lógica de negocio
    └── dom.js              ← Construcción y manipulación del DOM
```

## Cómo ejecutar

### 1. Instalar JSON Server (una sola vez)

```bash
npm install -g json-server
```

### 2. Iniciar JSON Server

Desde la carpeta del proyecto:

```bash
json-server --watch db.json --port 3000
```

Verás algo así:

```
Resources
  http://localhost:3000/notas

Home
  http://localhost:3000
```

### 3. Abrir la app

Abre `index.html` con un servidor local (necesario para ES Modules):

**Opción A — VS Code Live Server:**
Click derecho en `index.html` → *Open with Live Server*

**Opción B — Python:**
```bash
python3 -m http.server 5500
# luego abre http://localhost:5500
```

**Opción C — npx serve:**
```bash
npx serve .
```

> ⚠️ No abras `index.html` directamente como archivo (`file://`).
> Los ES Modules requieren HTTP.

---

## Operaciones CRUD con JSON Server

| Operación | Cuándo ocurre |
|-----------|--------------|
| **GET**   | Al iniciar la app (carga notas del servidor) |
| **POST**  | Al pulsar "⇅ Sincronizar API" (notas pendientes) |
| **PUT**   | Al editar una nota ya sincronizada |
| **DELETE**| Al eliminar una nota sincronizada |

## Módulos y responsabilidades

| Módulo | Responsabilidad |
|--------|----------------|
| `config.js` | URL base, clave LS, constantes |
| `utils.js` | Funciones puras sin efectos secundarios |
| `ui.js` | Toasts y log visible en el DOM |
| `storage.js` | `guardar()`, `cargar()`, `limpiar()` en LocalStorage |
| `api.js` | `apiGetNotas`, `apiPostNota`, `apiPutNota`, `apiDeleteNota` |
| `store.js` | Estado global, validaciones, orquesta api + storage |
| `dom.js` | Crear/eliminar `<li>`, modal, formulario |
| `app.js` | Event listeners, arranque, conecta todo |
