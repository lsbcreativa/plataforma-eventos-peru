# Plataforma de Eventos e Inscripciones - Perú

API REST desarrollada con Node.js y Express como base arquitectónica del proyecto final de **Backend II (Coderhouse)**.

## Temática

**EventosPerú** es una plataforma de eventos e inscripciones enfocada en el mercado peruano: congresos de tecnología en Lima, ferias gastronómicas en Arequipa, festivales culturales en Cusco, entre otros.

La plataforma permitirá:

- Publicar eventos con sede, fecha, aforo y precio en soles (PEN).
- Registrar usuarios de forma segura, sin guardar contraseñas en texto plano.
- Gestionar inscripciones y control de cupos disponibles.
- Diferenciar roles: `user`, `organizer` y `admin`.

## Estado del proyecto

| Entrega | Alcance | Estado |
|---|---|---|
| Pre-entrega 1 | Estructura base por capas, servidor Express y variables de entorno | Completada |
| Pre-entrega 2 | Registro seguro de usuarios con validaciones, bcrypt y persistencia en MongoDB | Completada |
| Próximas | Login, JWT, cookies, `current`, Passport, roles y autorización | Pendiente |

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js (>= 18) | Entorno de ejecución |
| Express 4 | Framework del servidor HTTP |
| Módulos ESM | Sistema de módulos (`import` / `export`) |
| dotenv | Manejo de variables de entorno |
| MongoDB + Mongoose | Base de datos y ODM |
| bcrypt | Hasheo de contraseñas |
| node:test | Runner de pruebas nativo de Node (sin dependencias extra) |
| Supertest | Pruebas de integración sobre los endpoints HTTP |
| mongodb-memory-server | MongoDB efímero para correr los tests sin base externa |

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

`MONGO_URL` acepta tanto una instancia local como MongoDB Atlas:

```bash
# MongoDB local
MONGO_URL=mongodb://localhost:27017/eventos_peru

# MongoDB Atlas
MONGO_URL=mongodb+srv://usuario:contraseña@cluster.mongodb.net/eventos_peru
```

> El archivo `.env` está excluido del repositorio mediante `.gitignore`. A partir de esta entrega el registro de usuarios necesita una conexión activa a MongoDB; si falta, el servidor arranca igual pero lo avisa por consola.

## Cómo ejecutar

```bash
# modo desarrollo (recarga automática)
npm run dev

# modo producción
npm start
```

El servidor queda disponible en `http://localhost:8080` (o el puerto definido en `PORT`).

## Tests

El proyecto incluye una suite de pruebas automatizadas que se ejecuta con el runner nativo de Node, sin necesidad de tener MongoDB levantado.

```bash
# ejecutar toda la suite
npm test

# ejecutar en modo watch mientras desarrollás
npm run test:watch
```

Las pruebas se dividen en dos grupos:

| Tipo | Ubicación | Qué valida |
|---|---|---|
| Integración | `test/integration/` | Los endpoints HTTP: códigos de estado, formato de las respuestas y manejo de errores |
| Unitarias | `test/unit/` | La lógica de negocio de cada capa de forma aislada (DAO, servicios y utilidades) |

Las pruebas unitarias aprovechan la inyección de dependencias de la arquitectura: los servicios reciben repositorios simulados, de modo que la lógica se valida sin tocar la fuente de datos real.

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
│       ├── response.util.js
│       ├── hash.js                     # bcrypt reutilizable
│       ├── validators.js               # validaciones y normalización de email
│       ├── user.mapper.js              # arma el usuario público (sin password)
│       └── appError.js                 # error con código HTTP asociado
├── test/
│   ├── integration/                    # pruebas sobre los endpoints HTTP
│   │   ├── health.test.js
│   │   ├── events.test.js
│   │   ├── sessions.test.js
│   │   ├── register.test.js            # registro contra un MongoDB real
│   │   └── errores.test.js
│   └── unit/                           # pruebas de la lógica por capa
│       ├── events.dao.test.js
│       ├── events.service.test.js
│       ├── sessions.service.test.js
│       ├── hash.test.js
│       ├── validators.test.js
│       └── response.util.test.js
├── docs/                               # capturas usadas en este README
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Flujo por capas

```
router  ->  controller  ->  service  ->  repository  ->  dao  ->  fuente de datos
```

Cada capa conoce solo a la siguiente. Los usuarios ya se persisten en MongoDB; los eventos siguen en memoria hasta la entrega que los implemente, y ese cambio solo afectará a su DAO.

Recorrido concreto del registro de un usuario:

```
POST /api/sessions/register
  └─ sessions.router.js      define la ruta
     └─ sessions.controller  lee el body y delega
        └─ sessions.service  valida, normaliza, verifica duplicados y hashea
           └─ users.repository
              └─ users.dao   persiste con Mongoose
                 └─ User.js  modelo de la colección
```

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/api/health` | Verifica que el servidor esté activo | Implementado |
| GET | `/api/events` | Lista de eventos | Implementado |
| GET | `/api/events/:eid` | Detalle de un evento | Implementado |
| POST | `/api/sessions/register` | Registro de usuarios | Implementado |
| POST | `/api/sessions/login` | Inicio de sesión | Próxima entrega |
| GET | `/api/sessions/current` | Usuario autenticado | Próxima entrega |
| POST | `/api/sessions/logout` | Cierre de sesión | Próxima entrega |

## Registro de usuarios

`POST /api/sessions/register` crea un usuario nuevo en la base de datos.

### Campos que espera

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `first_name` | string | Sí | No puede estar vacío |
| `last_name` | string | Sí | No puede estar vacío |
| `email` | string | Sí | Formato válido; se normaliza a minúsculas y sin espacios; único en la base |
| `password` | string | Sí | Mínimo 8 caracteres; se guarda hasheada con bcrypt |

El campo `role` **no se acepta desde el body**. Todo usuario creado por el registro público queda con el rol `user`; los valores `organizer` y `admin` se asignan por fuera de este endpoint.

### Modelo `User`

| Campo | Tipo | Detalle |
|---|---|---|
| `first_name` | String | Requerido |
| `last_name` | String | Requerido |
| `email` | String | Requerido, único, en minúsculas |
| `password` | String | Requerido, guardado como hash bcrypt |
| `role` | String | `user` (por defecto), `organizer` o `admin` |

### Cómo probarlo

Levantá el servidor con `npm run dev` y verificá que la consola muestre `MongoDB conectado`.

**Registro exitoso** → `201 Created`

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Pérez","email":"Ana@Mail.com ","password":"Secreta123"}'
```

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a3b9c1d4e5f6a7b8c9d",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

El email entró como `"Ana@Mail.com "` y se guardó como `ana@mail.com`. La respuesta no incluye la contraseña en ninguna forma.

**Campos faltantes** → `400 Bad Request`

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@mail.com"}'
```

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios: first_name, last_name, password"
}
```

**Email con formato inválido** → `400 Bad Request`

```json
{
  "status": "error",
  "message": "El formato del email no es valido"
}
```

**Contraseña demasiado corta** → `400 Bad Request`

```json
{
  "status": "error",
  "message": "La contraseña debe tener al menos 8 caracteres"
}
```

**Email ya registrado** → `409 Conflict`

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

### Cómo verificar que la contraseña quedó hasheada

Con `mongosh` sobre la base configurada:

```bash
mongosh "mongodb://localhost:27017/eventos_peru" --eval "db.users.findOne({email:'ana@mail.com'})"
```

El campo `password` tiene que verse como un hash de bcrypt, nunca como el texto original:

```
password: '$2b$10$N9qo8uLOickgx2ZMRZoMy...'
```

También se puede revisar desde MongoDB Compass abriendo la colección `users`.

## Seguridad de las contraseñas

Tres capas independientes evitan que la contraseña se filtre:

1. **Nunca se guarda en texto plano.** El servicio la hashea con bcrypt (`utils/hash.js`, 10 rondas de salt) antes de pasarla al repositorio.
2. **Nunca sale en una respuesta.** Todo usuario que viaja al cliente pasa por `utils/user.mapper.js`, que arma un objeto solo con `id`, `first_name`, `last_name`, `email` y `role`.
3. **Refuerzo en el modelo.** El esquema de Mongoose define un `toJSON` que elimina el campo `password`, por si algún documento se serializara directamente.

La suite de tests verifica los tres puntos, incluida una consulta directa a la base para confirmar que lo almacenado es un hash y no el texto original.

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
  "message": "La ruta GET /api/otra no existe en esta API"
}
```

> Todas las respuestas siguen el mismo contrato: `{ "status": "success", "payload": ... }` cuando la operación sale bien, y `{ "status": "error", "message": "..." }` cuando falla.

## Evidencia de funcionamiento

Capturas del servidor respondiendo en local sobre `http://localhost:8080`.

**GET /api/health**

![Respuesta del endpoint de health](docs/health.png)

**GET /api/events**

![Respuesta del endpoint de eventos](docs/events.png)

## Próximos pasos

- Login con verificación de contraseña (el helper `isValidPassword` ya está listo en `utils/hash.js`).
- Autenticación con JWT y cookies, integrada con Passport.
- Ruta `current` para recuperar el usuario autenticado.
- Autorización por roles y middleware de permisos.
- CRUD completo de eventos, inscripciones y control de cupos.

## Autor

**Daniel Andrés Sánchez Botta** — Backend II, Coderhouse.
