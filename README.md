# Plataforma de Eventos e Inscripciones - Perú

API REST desarrollada con Node.js y Express como base arquitectónica del proyecto final de **Backend II (Coderhouse)**.

## Temática

**EventosPerú** es una plataforma de eventos e inscripciones enfocada en el mercado peruano: congresos de tecnología en Lima, ferias gastronómicas en Arequipa, festivales culturales en Cusco, entre otros.

La plataforma permitirá:

- Publicar eventos con sede, fecha, aforo y precio en soles (PEN).
- Registrar usuarios con sus datos personales (incluido el DNI).
- Gestionar inscripciones y control de cupos disponibles.
- Diferenciar roles: `usuario`, `organizador` y `admin`.

En esta primera pre-entrega se construye únicamente la **estructura base por capas**. La autenticación, los roles y la gestión completa de eventos e inscripciones se implementan en las siguientes entregas.

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js (>= 18) | Entorno de ejecución |
| Express 4 | Framework del servidor HTTP |
| Módulos ESM | Sistema de módulos (`import` / `export`) |
| dotenv | Manejo de variables de entorno |
| Mongoose | ODM para MongoDB (modelos base) |

## Instalación

```bash
git clone https://github.com/lsbcreativa/plataforma-eventos-peru.git
cd plataforma-eventos-peru
npm install
```

## Configuración de variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `PORT` | Puerto donde escucha el servidor | `8080` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGO_URL` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/eventos_peru` |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT | `mi_clave_secreta` |

> El archivo `.env` está excluido del repositorio mediante `.gitignore`. Si `MONGO_URL` no está definida, el servidor inicia igual y avisa por consola que trabaja sin base de datos.

## Cómo ejecutar

```bash
# modo desarrollo (recarga automática)
npm run dev

# modo producción
npm start
```

El servidor queda disponible en `http://localhost:8080` (o el puerto definido en `PORT`).

## Estructura de carpetas

```
plataforma-eventos-peru/
├── src/
│   ├── app.js                          # configura Express (no levanta el servidor)
│   ├── server.js                       # levanta el servidor
│   ├── config/
│   │   ├── env.config.js               # carga y centraliza las variables de entorno
│   │   └── db.config.js                # conexión a MongoDB
│   ├── routes/
│   │   ├── index.router.js             # router principal montado en /api
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/
│   │   ├── events.service.js
│   │   └── sessions.service.js
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js
│   └── utils/
│       ├── logger.js
│       └── response.util.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Flujo por capas

```
router  ->  controller  ->  service  ->  repository  ->  dao  ->  fuente de datos
```

Cada capa conoce solo a la siguiente, lo que permite reemplazar la fuente de datos (memoria hoy, MongoDB en la próxima entrega) sin tocar rutas ni controladores.

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/api/health` | Verifica que el servidor esté activo | Implementado |
| GET | `/api/events` | Lista de eventos | Implementado |
| GET | `/api/events/:eid` | Detalle de un evento | Implementado |
| POST | `/api/sessions/register` | Registro de usuarios | Próxima entrega |
| POST | `/api/sessions/login` | Inicio de sesión | Próxima entrega |
| GET | `/api/sessions/current` | Usuario autenticado | Próxima entrega |
| POST | `/api/sessions/logout` | Cierre de sesión | Próxima entrega |

### Ejemplos de respuesta

**GET /api/health** → `200 OK`

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

**GET /api/events** → `200 OK`

```json
{
  "status": "success",
  "payload": []
}
```

**Ruta inexistente** → `404 Not Found`

```json
{
  "status": "error",
  "error": "La ruta GET /api/otra no existe en esta API"
}
```

## Próximos pasos

- Registro y login con hasheo de contraseñas (bcrypt).
- Autenticación con JWT y cookies, integrada con Passport.
- Autorización por roles y middleware de permisos.
- CRUD completo de eventos, inscripciones y control de cupos.
- Persistencia real en MongoDB Atlas.

## Autor

Andrés Botta — Backend II, Coderhouse.
