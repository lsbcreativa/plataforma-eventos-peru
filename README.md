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
| Pre-entrega 3 | Login, JWT en cookie `HttpOnly`, ruta protegida `current` y logout | Completada |
| Pre-entrega 4 | Autenticación centralizada con Passport (estrategias `register`, `login` y `current`) | Completada |
| Pre-entrega 5 | Autorización por roles: middleware de roles, matriz de permisos, propiedad de recursos | Completada |
| Pre-entrega 6 | Entidad `Event` en MongoDB: CRUD completo, reglas de negocio, filtros, paginación y ordenamiento | Completada |
| Pre-entrega 7 | Entidad `Ticket`: inscripciones, control de cupos, cancelaciones y email de confirmación con Nodemailer | Completada |
| Pre-entrega 8 | Arquitectura formal en capas: DAO genérico, Repository de dominio, Services y DTOs explícitos | Completada |
| Próximas | A definir | Pendiente |

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js (>= 18) | Entorno de ejecución |
| Express 4 | Framework del servidor HTTP |
| Módulos ESM | Sistema de módulos (`import` / `export`) |
| dotenv | Manejo de variables de entorno |
| MongoDB + Mongoose | Base de datos y ODM |
| bcrypt | Hasheo de contraseñas |
| jsonwebtoken | Firma y verificación de los JWT |
| cookie-parser | Lectura de la cookie de autenticación |
| Passport | Orquestación de las estrategias de autenticación |
| passport-custom | Estrategias `register` y `login` (validación propia sobre el body) |
| passport-jwt | Estrategia `current` (lee y verifica el JWT de la cookie) |
| Nodemailer | Envío del email de confirmación al inscribirse a un evento |
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
| `JWT_EXPIRES_IN` | Tiempo de validez del token | `1h` |
| `MAIL_HOST` | Servidor SMTP para el email de confirmación de inscripciones | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_USER` | Usuario/cuenta SMTP | `tu_correo@gmail.com` |
| `MAIL_PASS` | Contraseña o contraseña de aplicación SMTP | — |
| `MAIL_FROM` | Remitente que ve quien recibe el email | `EventosPeru <tu_correo@gmail.com>` |

Si las variables de `MAIL_*` quedan vacías, el servidor arranca igual: `POST /api/events/:id/tickets` sigue funcionando, solo que el email de confirmación se omite (queda avisado por log). Ver [Tickets e inscripciones](#tickets-e-inscripciones) para el detalle.

`.env.example` incluye además, comentadas, las variables para futuros providers OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, etc.). No se usan en esta entrega; quedan documentadas para cuando se agregue esa estrategia en `passport.config.js`.

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

Las pruebas de integración que tocan MongoDB (`register.test.js`, `auth.test.js`, `authorization.test.js`) usan `mongodb-memory-server`, que levanta un Mongo real y efímero: no dependen del `MONGO_URL` del `.env` ni de tener una base externa corriendo. Están declaradas en `devDependencies` junto con `supertest` y fijadas en `package-lock.json`, así que un `npm ci` (instalación limpia a partir del lockfile, como la que corre cualquier entorno de CI o de corrección) deja todo listo para `npm test` sin instalar nada más — verificado corriendo `rm -rf node_modules && npm ci && npm test` antes de esta entrega. Unico requisito: la primera corrida necesita salida a internet para que `mongodb-memory-server` descargue el binario de MongoDB una vez; las siguientes corridas reusan esa cache local.

## Estructura de carpetas

```
plataforma-eventos-peru/
├── src/
│   ├── app.js                          # configura Express (no levanta el servidor)
│   ├── server.js                       # levanta el servidor
│   ├── config/
│   │   ├── env.config.js               # carga y centraliza las variables de entorno
│   │   ├── db.config.js                # conexión a MongoDB
│   │   └── passport.config.js          # estrategias 'register', 'login' y 'current'
│   ├── routes/
│   │   ├── index.router.js             # router principal montado en /api
│   │   ├── health.router.js
│   │   ├── events.router.js            # eventos + POST/GET .../tickets, protegidos con requireAuth + authorize
│   │   ├── sessions.router.js          # delega en passport.authenticate(...)
│   │   ├── users.router.js             # GET /api/users, solo admin
│   │   └── tickets.router.js           # GET /my-tickets y PATCH /:tid/cancel
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js      # genera el JWT y setea la cookie tras el login
│   │   ├── users.controller.js
│   │   └── tickets.controller.js
│   ├── services/
│   │   ├── events.service.js           # filtros/paginacion, reglas de negocio y propiedad de recursos
│   │   ├── users.service.js
│   │   └── tickets.service.js          # reglas de inscripcion, cupos, duplicados, cancelacion y email
│   ├── repositories/
│   │   ├── events.repository.js        # metodos de dominio (findEvents, updateEvent...) sobre events.dao.js
│   │   ├── users.repository.js         # metodos de dominio (getUserByEmail...) sobre users.dao.js
│   │   └── tickets.repository.js       # metodos de dominio (countActiveTickets, cancelTicket...) sobre tickets.dao.js
│   ├── dao/
│   │   ├── events.dao.js               # unico archivo que importa Event; metodos genericos (find/findOne/findById/create/updateById/count)
│   │   ├── users.dao.js                # idem con User
│   │   └── tickets.dao.js              # idem con Ticket
│   ├── models/
│   │   ├── User.js                     # campo role: user (default) | organizer | admin
│   │   ├── Event.js                    # campo status: draft (default) | published | cancelled | finished
│   │   └── Ticket.js                   # status: confirmed (default) | pending | cancelled; user/event son referencias
│   ├── constants/
│   │   ├── event.constants.js          # EVENT_STATUSES: lo importan el modelo (enum) y el service (validacion)
│   │   └── ticket.constants.js         # TICKET_STATUSES, misma idea
│   ├── dto/
│   │   ├── user.dto.js                 # toUserDTO: id/first_name/last_name/email/role, nunca password
│   │   ├── session.dto.js              # toCurrentUserDTO: id/email/role a partir del payload del JWT
│   │   ├── event.dto.js                # toEventDTO: allowlist explicita de campos de evento
│   │   └── ticket.dto.js               # toTicketDTO: allowlist + filtra tambien el evento/usuario si vienen poblados
│   ├── middlewares/
│   │   ├── passportAuth.middleware.js  # autenticacion: exporta requireAuth (401 sin sesion)
│   │   ├── authorize.middleware.js     # autorizacion: authorize(...roles) (403 sin permiso)
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js  # middleware centralizado de errores (400/401/403/404/409/500)
│   └── utils/
│       ├── logger.js
│       ├── response.util.js
│       ├── hash.js                     # bcrypt reutilizable
│       ├── jwt.js                      # firma y verificación de JWT
│       ├── validators.js               # validaciones y normalización de email
│       ├── mailer.js                   # Nodemailer: envia o, sin MAIL_HOST, lo omite y avisa por log
│       └── appError.js                 # error con código HTTP asociado
├── test/
│   ├── integration/                    # pruebas sobre los endpoints HTTP
│   │   ├── health.test.js
│   │   ├── events.test.js              # listado, filtros, paginacion, ordenamiento, 404
│   │   ├── register.test.js            # registro contra un MongoDB real
│   │   ├── auth.test.js                # login, current y logout
│   │   ├── authorization.test.js       # roles, 401 vs 403, propiedad de recursos y cambios de status
│   │   ├── tickets.test.js             # inscripcion, cupos, duplicados, cancelacion, my-tickets
│   │   └── errores.test.js
│   └── unit/                           # pruebas de la lógica por capa
│       ├── events.service.test.js      # filtros/paginacion, validaciones de negocio y transiciones de status
│       ├── tickets.service.test.js     # reglas de cupos/duplicados con repositorio y mailer simulados
│       ├── dto.test.js                 # las 4 DTO nunca exponen password, ni con evento/usuario poblado
│       ├── authorize.middleware.test.js
│       ├── passport.config.test.js     # estrategias register/login con repositorio simulado
│       ├── hash.test.js
│       ├── jwt.test.js
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

Cada capa conoce solo a la siguiente. Los eventos ya persisten en MongoDB a través de `events.dao.js`; el resto de las capas (`events.repository.js`, `events.service.js`) no cambiaron su forma solo porque cambió la fuente de datos.

La autenticación (registro, login y usuario actual) ya no pasa por un `service`: la validación, la normalización y el acceso a datos viven dentro de la estrategia de Passport correspondiente, y el controller solo entra en juego después de que la estrategia autenticó (o creó) al usuario.

Recorrido concreto del registro de un usuario:

```
POST /api/sessions/register
  └─ sessions.router.js       define la ruta y delega en passport.authenticate('register', ...)
     └─ passport.config.js    estrategia 'register': valida, normaliza, verifica duplicados y hashea
        └─ users.repository
           └─ users.dao       persiste con Mongoose
              └─ User.js      modelo de la colección
     └─ sessions.controller   ya con el usuario creado en req.user, arma la respuesta publica
```

Recorrido concreto del login:

```
POST /api/sessions/login
  └─ sessions.router.js       delega en passport.authenticate('login', ...)
     └─ passport.config.js    estrategia 'login': busca el usuario y compara el hash con bcrypt
     └─ sessions.controller   con el usuario en req.user, genera el JWT y setea la cookie httpOnly
```

Recorrido concreto de la creación de un evento, con los dos middlewares de autorización antes de tocar el router de negocio:

```
POST /api/events
  └─ requireAuth              estrategia 'current' de Passport: sin sesion valida, corta con 401
     └─ authorize('organizer', 'admin')   compara req.user.role: si no coincide, corta con 403
        └─ events.controller  createEvent
           └─ events.service  valida campos, capacity, price y fecha; arma el evento con organizer = req.user.id
              └─ events.repository
                 └─ events.dao   persiste con Mongoose
                    └─ Event.js  modelo de la coleccion
```

## Arquitectura en capas

Desde la Pre-entrega 8 la separación entre capas es formal, no solo una convención: cada capa tiene una responsabilidad única y una regla de qué puede importar. El objetivo no fue agregar funcionalidad nueva sino ordenar la que ya existía — **ninguna ruta cambió su contrato externo** (ver [Comportamiento externo](#comportamiento-externo) más abajo).

```
router  ->  controller  ->  service  ->  repository  ->  dao  ->  modelo de Mongoose
                                              service  ->  dto  (antes de responder)
```

| Capa | Responsabilidad | Puede importar | No puede importar |
|---|---|---|---|
| **Router** (`src/routes/`) | Define la URL y el método HTTP, y arma la cadena de middlewares (`requireAuth`, `authorize`) | controllers, middlewares | modelos, repositories, dao |
| **Controller** (`src/controllers/`) | Extrae datos de `req.body`/`req.params`/`req.query`, llama al service, devuelve la respuesta con `successResponse`. Nunca calcula nada | services, utils de respuesta | modelos, repositories, dao |
| **Service** (`src/services/`) | Toda la lógica de negocio: validaciones, reglas de cupos y estados, permisos sobre recursos propios, envío de email. Es la única capa que decide qué es un error 400/403/404/409 | repositories, `dto/`, `constants/`, `utils/` | modelos (`src/models/`), `dao/` |
| **Repository** (`src/repositories/`) | Traduce conceptos de dominio (`getUserByEmail`, `countActiveTickets`, `cancelTicket`) en llamadas al DAO genérico. Decide qué filtro, qué `populate`, qué cambios aplica una acción de negocio | su propio DAO | modelos, otros DAO |
| **DAO** (`src/dao/`) | Acceso a datos genérico sobre un modelo de Mongoose: `find`, `findOne`, `findById`, `create`, `updateById`, `count`. No sabe qué es un evento "publicado" ni qué significa "cancelar" | su propio modelo de Mongoose | cualquier otra capa |
| **DTO** (`src/dto/`) | Convierte un documento (o resultado de negocio) en el objeto público que viaja al cliente. Allowlist explícita: arma el objeto campo por campo, nunca por spread — un campo nuevo en el modelo no se filtra a la respuesta sin decidirlo acá | nada del resto de la app (son funciones puras) | — |

`src/dao/` son los **únicos** archivos de `src/` que importan algo de `src/models/` (verificado con un grep sobre todo el árbol antes de esta entrega). Los enums de estado (`EVENT_STATUSES`, `TICKET_STATUSES`) tampoco viven en los modelos: están en `src/constants/`, y tanto el modelo (para el `enum` del schema) como el service (para validar contra ese mismo enum) los importan de ahí — así el service nunca necesita tocar `src/models/`.

### DAO genérico vs. Repository de dominio

Antes de esta entrega, `tickets.dao.js` tenía metodos como `findActiveByEvent` o `cancel` que ya sabían qué es un ticket "activo" (`status !== 'cancelled'`) y qué campos cambian al cancelar. Eso mezclaba acceso a datos con reglas de negocio en la capa equivocada. Ahora:

```js
// src/dao/tickets.dao.js — generico, no sabe que es "activo"
async find(filter = {}, { sort, skip, limit, populate } = {}) { /* ... */ }

// src/repositories/tickets.repository.js — acá vive la definicion de dominio
const ACTIVE_FILTER = { status: { $ne: 'cancelled' } };

async countActiveTickets(eventId) {
  const activeTickets = await this.dao.find({ event: eventId, ...ACTIVE_FILTER });
  return activeTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
}

async cancelTicket(id) {
  return this.dao.updateById(id, { status: 'cancelled', cancelledAt: new Date() });
}
```

`TicketsService` ya no sabe cómo se calculan los cupos ocupados ni qué campos cambian al cancelar: solo llama `this.repository.countActiveTickets(eventId)` o `this.repository.cancelTicket(id)`. Si mañana cambia la definición de "ticket activo" (por ejemplo, si se agrega un estado `expired`), el cambio es de una sola línea en el repository — el DAO, el service y los controllers no se enteran.

### DTO: por qué allowlist y no spread

`toEventDTO`/`toTicketDTO` antes armaban la respuesta con spread (`{ ...event }`, excluyendo solo `_id`/`__v`): funcionaba porque hoy ningún documento de evento o ticket tiene un campo sensible, pero no estaba blindado si mañana alguien agregara un `populate` más amplio en el DAO. Ahora cada DTO lista explícitamente los campos que expone:

```js
// src/dto/event.dto.js
const EVENT_FIELDS = ['title', 'description', 'category', 'location', 'date', 'capacity', 'price', 'status', 'organizer', 'createdAt', 'updatedAt'];

export const toEventDTO = (event) => {
  if (!event) return null;
  const dto = { id: String(event.id ?? event._id) };
  EVENT_FIELDS.forEach((field) => {
    if (event[field] !== undefined) dto[field] = event[field];
  });
  return dto;
};
```

`toTicketDTO` va un paso más allá: si `event` o `user` vienen poblados (`.populate(...)`), no los reexporta tal cual — les aplica su propio filtro (`toEventDTO`-like para el evento, `toUserDTO` para el usuario). Así, aunque el `populate` del DAO cambiara mañana y trajera el usuario completo con su `password` hasheado, el DTO lo sigue filtrando antes de que llegue a la respuesta. `test/unit/dto.test.js` prueba exactamente ese caso: arma un ticket con `user` poblado incluyendo `password`, y verifica que `toTicketDTO` nunca lo expone.

### Manejo de errores

`errorHandler.middleware.js` es el único lugar que arma la respuesta de error; todo el resto de la app lanza un `AppError(mensaje, status)` y lo deja pasar con `next(error)`. Los status que usa la API, con un ejemplo real de cada uno:

| Status | Cuándo | Ejemplo |
|---|---|---|
| `400` | Datos inválidos (falta un campo, formato incorrecto, regla de negocio sobre el valor recibido) | `capacity` ≤ 0, `quantity` no numérica, fecha de evento pasada |
| `401` | No autenticado: no hay cookie, o el token es inválido/expiró | Cualquier ruta protegida sin `currentUser` |
| `403` | Autenticado pero sin permiso para esa acción, o no ser dueño del recurso | `user` intentando crear un evento; `organizer` sobre un evento ajeno |
| `404` | El recurso no existe (incluye un `id` con formato inválido, que el DAO trata igual que "no encontrado") | `GET /api/events/:id` inexistente |
| `409` | Conflicto con el estado actual del recurso | Evento ya cancelado, sin cupos, inscripción duplicada |
| `500` | Error interno no esperado | Cualquier excepción no controlada; el mensaje real queda en el log, la respuesta es genérica |

Ningún error de negocio responde `500`: `errorHandler.middleware.js` solo usa ese status para lo que de verdad es una falla del servidor (y ahí sí oculta el detalle, mostrando un mensaje genérico al cliente mientras loguea el original).

### Comportamiento externo

Todas las rutas de sesiones, eventos y tickets responden exactamente igual que antes de esta entrega — mismos status codes, mismos mensajes, misma forma de las respuestas. Lo único que cambió es la organización interna del código. La suite completa (`npm test`, 195 pruebas) y un recorrido manual completo (registro → login → crear evento → publicar → inscribirse → `my-tickets` → cancelar) contra una base real se corrieron antes de cerrar esta entrega para confirmarlo.

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/api/health` | Verifica que el servidor esté activo | No |
| GET | `/api/events` | Lista eventos con filtros, paginación y ordenamiento | No |
| GET | `/api/events/:id` | Detalle de un evento | No |
| POST | `/api/events` | Crea un evento nuevo | Cookie + rol `organizer` o `admin` |
| PUT | `/api/events/:id` | Reemplaza los datos de un evento (propio si es `organizer`, cualquiera si es `admin`) | Cookie + rol `organizer` o `admin` |
| PATCH | `/api/events/:id/status` | Cambia el status de un evento — cancelar es un cambio de status, nunca un borrado físico | Cookie + rol `organizer` o `admin` |
| POST | `/api/events/:id/tickets` | Inscribe al usuario autenticado a un evento | Cookie (cualquier rol) |
| GET | `/api/events/:id/tickets` | Lista las inscripciones de un evento | Cookie + rol `organizer` (dueño) o `admin` |
| GET | `/api/tickets/my-tickets` | Lista las inscripciones propias del usuario autenticado | Cookie (cualquier rol) |
| PATCH | `/api/tickets/:tid/cancel` | Cancela una inscripción — cambia el status, nunca borra el documento | Cookie + dueño del ticket o `admin` |
| POST | `/api/sessions/register` | Registra un usuario nuevo | No |
| POST | `/api/sessions/login` | Valida credenciales y entrega la cookie de sesión | No |
| GET | `/api/sessions/current` | Devuelve el usuario autenticado | Cookie `currentUser` |
| POST | `/api/sessions/logout` | Cierra la sesión y borra la cookie | No |
| GET | `/api/users` | Lista todos los usuarios registrados | Cookie + rol `admin` |

Cada ruta está documentada con su request y su response más abajo: las de sesiones en [Registro de usuarios](#registro-de-usuarios), [Autenticación centralizada con Passport](#autenticación-centralizada-con-passport) y [Autenticación con JWT y cookies](#autenticación-con-jwt-y-cookies); las de eventos en [Eventos](#eventos); las de tickets en [Tickets e inscripciones](#tickets-e-inscripciones); las de roles y usuarios en [Roles y autorización](#roles-y-autorización); las demás en [Ejemplos de respuesta](#ejemplos-de-respuesta).

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

## Autenticación centralizada con Passport

A partir de esta entrega, `register`, `login` y `current` pasan por estrategias de [Passport](https://www.passportjs.org/) centralizadas en `src/config/passport.config.js`. El contrato externo no cambia respecto de la Pre-entrega 3: las rutas, los códigos de estado y las respuestas son los mismos: lo que cambia es la organización interna.

`app.js` solo hace `app.use(passport.initialize())`; no define ninguna estrategia. Las estrategias se registran al importar `passport.config.js`, así que agregar un provider nuevo no requiere tocar `app.js`.

| Estrategia | Tipo | Qué hace |
|---|---|---|
| `register` | `passport-custom` | Valida los campos obligatorios, normaliza el email, verifica que no esté duplicado y hashea la contraseña con bcrypt antes de crear el usuario. El rol siempre queda en `user` |
| `login` | `passport-custom` | Busca el usuario por email y compara la contraseña con `bcrypt.compare`. Si el email no existe o la contraseña no coincide, responde el mismo mensaje genérico |
| `current` | `passport-jwt` | Extrae el JWT de la cookie `currentUser` (no del header `Authorization`) mediante un extractor propio, lo verifica con `JWT_SECRET` y deja su payload en `req.user` |

Se usa `passport-custom` en `register` y `login` en lugar de `passport-local` porque ambas estrategias necesitan devolver mensajes de error específicos (campos faltantes, formato de email, largo de la contraseña) que la validación automática de `passport-local` no permite personalizar sin perder ese detalle.

Ni `register` ni `login` generan el JWT: eso es responsabilidad exclusiva del controller (`sessions.controller.js`), después de que la estrategia autenticó (o creó) al usuario. Así, cambiar cómo se firma o se transporta el token no requiere tocar las estrategias.

`GET /api/sessions/current` usa la estrategia `current` como middleware de la ruta (`passport.authenticate('current', ...)`); si no hay token válido responde `401`, y si lo hay, el controller arma `{ id, email, role }` a partir de `req.user`, sin el password.

`POST /api/sessions/logout` no pasa por Passport: solo borra la cookie `currentUser`, porque no hay nada que autenticar para cerrar sesión.

### Preparado para providers externos

`passport.config.js` está pensado para sumar nuevas estrategias (Google, GitHub, etc.) sin modificar `app.js` ni las rutas existentes: alcanza con registrar la estrategia nueva ahí (`passport.use('google', new GoogleStrategy(...))`) y agregar la ruta que la invoque. Las variables de entorno para esos providers ya están documentadas, comentadas, en `.env.example`.

## Autenticación con JWT y cookies

El login entrega un JWT dentro de una cookie `HttpOnly`. El navegador la envía sola en cada pedido, así que el token nunca queda expuesto a JavaScript del lado del cliente.

### POST /api/sessions/login

**Request**

```json
{ "email": "ana@mail.com", "password": "Secreta123" }
```

**Response 200** — además setea la cookie `currentUser`

```json
{ "status": "success", "message": "Login correcto" }
```

```
Set-Cookie: currentUser=eyJhbGciOiJIUzI1NiIs...; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax
```

**Response 401** — email inexistente o contraseña incorrecta

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

El mensaje es **el mismo en los dos casos**, a propósito: si distinguiera "el email no existe" de "la contraseña es incorrecta", cualquiera podría averiguar qué emails están registrados probando uno por uno.

**Response 400** — falta `email` o `password`

```json
{ "status": "error", "message": "Faltan campos obligatorios: password" }
```

### GET /api/sessions/current

Requiere la cookie `currentUser`. No lleva body.

**Response 200**

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a3b9c1d4e5f6a7b8c9d",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

**Response 401** — sin cookie, o con un token inválido o expirado

```json
{ "status": "error", "message": "No autenticado" }
```

### POST /api/sessions/logout

No lleva body. Borra la cookie `currentUser`.

**Response 200**

```json
{ "status": "success", "message": "Sesión cerrada" }
```

### Cómo probar el flujo completo

Con `curl`, guardando las cookies en un archivo:

```bash
# 1. registro
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Pérez","email":"ana@mail.com","password":"Secreta123"}'

# 2. login: guarda la cookie en cookies.txt
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@mail.com","password":"Secreta123"}'

# 3. current: manda la cookie guardada
curl -b cookies.txt http://localhost:8080/api/sessions/current

# 4. logout
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/sessions/logout

# 5. current otra vez: ahora responde 401
curl -b cookies.txt http://localhost:8080/api/sessions/current
```

En Postman o Thunder Client no hace falta nada especial: la cookie se guarda sola después del login y viaja en los pedidos siguientes.

### La cookie

| Atributo | Valor | Por qué |
|---|---|---|
| `httpOnly` | `true` | JavaScript del navegador no puede leerla; mitiga robo de token por XSS |
| `sameSite` | `lax` | No se envía en pedidos desde otros sitios; mitiga CSRF |
| `maxAge` | `3600000` (1 hora) | La sesión caduca sola |
| `secure` | solo en producción | Exige HTTPS al desplegar, sin romper el desarrollo en `localhost` |

El token se firma con `JWT_SECRET` y expira según `JWT_EXPIRES_IN`, ambas leídas desde el entorno. Su payload lleva únicamente `id`, `email` y `role`: **nunca la contraseña**, ni siquiera hasheada.

## Roles y autorización

Estar autenticado no alcanza para hacer cualquier cosa: cada acción se valida además contra el rol del usuario. El modelo `User` (`src/models/User.js`) define el campo `role` con los valores `user`, `organizer` y `admin`, con `user` como valor por defecto. El registro público (`POST /api/sessions/register`) siempre crea el usuario con rol `user`; la estrategia de registro ignora cualquier `role` que llegue en el body, así que no hay forma de auto-asignarse `organizer` o `admin` desde afuera. Para dar de alta un `organizer` o un `admin` hay que asignar el rol directamente en la base de datos (por ejemplo con `mongosh` o MongoDB Compass), ya que a propósito no existe un endpoint público para eso.

### Matriz de permisos

| Acción | `user` | `organizer` | `admin` |
|---|---|---|---|
| Consultar eventos | ✅ | ✅ | ✅ |
| Crear eventos | ❌ | ✅ | ✅ |
| Modificar eventos propios | ❌ | ✅ | ✅ |
| Modificar cualquier evento | ❌ | ❌ | ✅ |
| Cancelar eventos propios | ❌ | ✅ | ✅ |
| Cancelar cualquier evento | ❌ | ❌ | ✅ |
| Ver todos los usuarios | ❌ | ❌ | ✅ |

"Consultar eventos" no exige rol porque `GET /api/events` y `GET /api/events/:id` son públicas: la matriz no restringe esa acción a ningún rol, así que tampoco se le exige sesión iniciada. "Cancelar" es un cambio de `status` a `cancelled`, no un borrado: ver [Eventos](#eventos).

### Los dos middlewares

Autenticación y autorización son responsabilidades separadas, en archivos distintos y reutilizables desde cualquier ruta:

| Middleware | Archivo | Qué valida | Si falla |
|---|---|---|---|
| Autenticación | `src/middlewares/passportAuth.middleware.js` (`requireAuth`) | Que exista una sesión válida: ejecuta la estrategia `current` de Passport, que lee y verifica el JWT de la cookie `currentUser` | **401** `No autenticado` |
| Autorización | `src/middlewares/authorize.middleware.js` (`authorize(...roles)`) | Que `req.user.role` esté entre los roles permitidos para esa ruta | **403** `No tenés permisos para realizar esta acción` |

`authorize` siempre se monta después de `requireAuth` en la ruta, porque necesita `req.user` ya poblado:

```js
router.post('/', requireAuth, authorize('organizer', 'admin'), createEvent);
```

Ningún rol queda hardcodeado dentro de un controller o de la lógica de negocio: la decisión de "quién puede entrar a esta ruta" vive únicamente en la cadena de middlewares de cada router (`events.router.js`, `users.router.js`).

### 401 vs. 403

Los dos códigos existen para distinguir dos preguntas distintas, y la API nunca los usa indistintamente:

- **401 (No autenticado):** "no sé quién sos". No hay cookie, el token es inválido o expiró. Lo devuelve `requireAuth`, antes de llegar a mirar ningún rol.
- **403 (Sin permiso):** "ya sé quién sos, pero no podés hacer esto". Hay una sesión válida, pero el rol no alcanza para esa acción (`authorize`) o el usuario no es dueño del recurso que intenta modificar (validación de propiedad, más abajo).

Ninguno de los dos casos responde nunca con 500: son errores esperables del negocio, no fallas del servidor, y se manejan igual que el resto de los `AppError` de la app.

### Rutas protegidas (mínimo exigido)

| Ruta | Requisito | Fallo |
|---|---|---|
| `GET /api/sessions/current` | Sesión válida, cualquier rol | 401 si no hay sesión |
| `POST /api/events` | Sesión válida + rol `organizer` o `admin` | 401 sin sesión, 403 con rol `user` |
| `PUT /api/events/:id` | Sesión válida + rol `organizer` o `admin` + ser dueño del evento (o ser `admin`) | 401 sin sesión, 403 sin rol o sin ser dueño |
| `PATCH /api/events/:id/status` | Sesión válida + rol `organizer` o `admin` + ser dueño del evento (o ser `admin`) | 401 sin sesión, 403 sin rol o sin ser dueño |
| `GET /api/users` | Sesión válida + rol `admin` | 401 sin sesión, 403 con rol `user` u `organizer` |

### Propiedad de recursos

Que un `organizer` tenga el rol correcto no significa que pueda tocar cualquier evento: `authorize('organizer', 'admin')` solo verifica el rol, no de quién es el evento. Esa segunda validación (¿este evento es tuyo?) necesita el registro puntual, así que vive en `EventsService` (`src/services/events.service.js`), en un helper privado (`_getOwnedEvent`) compartido por `updateEvent` y `changeStatus`, justo después de buscar el evento:

```js
if (user.role !== 'admin' && String(event.organizer) !== String(user.id)) {
  throw new AppError('No podés modificar un evento que no te pertenece', 403);
}
```

Un `admin` se salta esta comparación y puede modificar o cambiar el status de cualquier evento. El `id`, el `organizer` y el `status` de un evento no se pueden tocar desde el body de un `PUT`: el `status` tiene su propio endpoint, con sus propias reglas de transición (ver [Eventos](#eventos)).

### Cómo probarlo

```bash
# organizer o admin se asignan directo en Mongo, no hay endpoint publico para eso
mongosh "$MONGO_URL" --eval "db.users.updateOne({email:'ana@mail.com'}, {\$set:{role:'organizer'}})"

# login con ese usuario y uso de la cookie guardada
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@mail.com","password":"Secreta123"}'

# 403 si el usuario logueado tiene rol "user"
curl -b cookies.txt -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Congreso Tech 2026","description":"Charlas de IA y cloud","category":"tecnologia","location":"Centro de Convenciones","date":"2026-11-20","capacity":100}'

# 401 sin cookie
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -d '{}'

# 200 solo si quien pide es admin
curl -b cookies.txt http://localhost:8080/api/users
```

`test/integration/authorization.test.js` automatiza exactamente estos casos (`user` vs. `organizer` vs. `admin` en `POST /api/events`, la ruta administrativa `GET /api/users`, sin cookie, y un `organizer` intentando modificar o cambiar el status del evento de otro), sembrando los usuarios con cada rol directo en MongoDB (igual que se haría a mano).

## Eventos

A partir de esta entrega los eventos persisten en MongoDB (antes vivían en un array en memoria). El modelo, las validaciones de negocio, los filtros y la paginación son nuevos; los roles y la propiedad de recursos ya existían desde la Pre-entrega 5 y acá simplemente se aplican sobre el CRUD real.

### Modelo `Event`

| Campo | Tipo | Detalle |
|---|---|---|
| `title` | String | Requerido |
| `description` | String | Requerido |
| `category` | String | Requerido (texto libre: `tecnologia`, `workshop`, `cultura`, lo que use cada organizer) |
| `location` | String | Requerido |
| `date` | Date | Requerido |
| `capacity` | Number | Requerido, entero mayor a 0 |
| `price` | Number | Opcional, `0` por defecto, no puede ser negativo |
| `status` | String | `draft` (por defecto), `published`, `cancelled` o `finished` |
| `organizer` | ObjectId (ref `users`) | Se asigna solo desde `req.user`; nunca se acepta desde el body |

`organizer` es una referencia al `_id` del usuario que creó el evento, no el objeto completo: evita duplicar datos de usuario en cada evento y mantiene una sola fuente de verdad (la colección `users`).

### Reglas de negocio (en `EventsService`, no en las rutas)

Las rutas y los controllers no conocen estas reglas: solo delegan en `events.service.js`, que es el único lugar que las conoce y las aplica.

| Regla | Dónde se aplica | Status |
|---|---|---|
| No se acepta una fecha pasada al crear | `createEvent` | `400` |
| `capacity` debe ser un entero mayor a 0 | `createEvent` y `PUT` (si se envía) | `400` |
| `price` no puede ser negativo | `createEvent` y `PUT` (si se envía) | `400` |
| No se puede publicar (`status: published`) un evento `finished` o `cancelled` | `changeStatus` | `400` |
| Un evento `cancelled` no admite más cambios (ni `PUT` ni un nuevo `status`) | `updateEvent` y `changeStatus` | `409` |
| Un `organizer` no puede tocar eventos ajenos; un `admin` sí | `updateEvent` y `changeStatus` | `403` |

"Cancelado no admite más cambios, salvo justificación documentada": acá la justificación es que no hay ningún caso de uso definido todavía para reactivar un evento cancelado (por ejemplo, reembolsos de inscripciones ya emitidas complicarían esa reactivación) — queda **explícitamente bloqueado** en vez de dejarlo abierto sin reglas. Si una futura entrega define ese caso de uso, se agrega ahí.

### POST /api/events — crear un evento

Requiere sesión y rol `organizer` o `admin`. El `organizer` del evento creado es siempre `req.user.id`; si el body manda un `organizer` distinto, se ignora.

**Request**

```json
{
  "title": "Congreso Tech 2026",
  "description": "Charlas de IA y cloud",
  "category": "tecnologia",
  "location": "Centro de Convenciones de Lima",
  "date": "2026-11-20",
  "capacity": 100,
  "price": 150
}
```

**Response 201**

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a3b9c1d4e5f6a7b8c9d",
    "title": "Congreso Tech 2026",
    "description": "Charlas de IA y cloud",
    "category": "tecnologia",
    "location": "Centro de Convenciones de Lima",
    "date": "2026-11-20T00:00:00.000Z",
    "capacity": 100,
    "price": 150,
    "status": "draft",
    "organizer": "665f28f19c1d4e5f6a7b8c91",
    "createdAt": "2026-08-30T14:41:39.427Z",
    "updatedAt": "2026-08-30T14:41:39.427Z"
  }
}
```

Todo evento nuevo arranca en `draft`: para que aparezca como disponible hay que publicarlo explícitamente con `PATCH /api/events/:id/status`. Esto evita que un evento a medio cargar quede visible por accidente.

**Response 403** — rol `user`

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

**Response 400** — fecha pasada, `capacity <= 0`, `price < 0` o campos obligatorios faltantes

```json
{ "status": "error", "message": "La fecha del evento no puede ser en el pasado" }
```

### GET /api/events — listado con filtros, paginación y ordenamiento

Pública, no requiere sesión.

| Query param | Qué hace |
|---|---|
| `status` | Filtra por status exacto (`draft`, `published`, `cancelled`, `finished`) |
| `category` | Filtra por categoría exacta |
| `location` | Filtra por ubicación exacta |
| `dateFrom` / `dateTo` | Filtra eventos con `date` dentro del rango (`$gte` / `$lte`) |
| `page` | Página a devolver, `1` por defecto |
| `limit` | Resultados por página, `10` por defecto, tope `100` |
| `sort` | Campo de orden: `date`, `price`, `capacity` o `createdAt`; anteponer `-` para descendente (ej. `-date`). Por defecto ordena por `date` ascendente |

**Request de ejemplo** (el que pide el enunciado)

```
GET /api/events?status=published&category=workshop&page=2&limit=5
```

**Response 200**

```json
{
  "status": "success",
  "payload": {
    "data": [ { "id": "...", "title": "...", "...": "..." } ],
    "page": 2,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  }
}
```

`data` nunca devuelve todos los eventos de una: siempre pasa por `skip`/`limit` en la consulta de Mongo (`events.dao.js`), y `total`/`totalPages` salen de un `countDocuments` con el mismo filtro.

### GET /api/events/:id — detalle

Pública. `404` si el evento no existe, incluido el caso de un `id` con formato inválido (no es un `ObjectId`): el DAO atrapa ese `CastError` y lo trata igual que "no encontrado", no como un `500`.

```json
{ "status": "error", "message": "Evento no encontrado" }
```

### PUT /api/events/:id — modificar un evento

Requiere ser el `organizer` dueño del evento, o `admin`. Acepta cualquier subconjunto de `title`, `description`, `category`, `location`, `date`, `capacity`, `price` (no hace falta reenviar el evento entero). `id`, `organizer` y `status` se ignoran si vienen en el body — el `status` tiene su propio endpoint a propósito, para no mezclar una edición de datos con una transición de estado que tiene sus propias reglas.

**Response 200** — mismo formato que la creación, con los campos actualizados.

**Response 403** — el `organizer` no es dueño del evento:

```json
{ "status": "error", "message": "No podés modificar un evento que no te pertenece" }
```

**Response 409** — el evento ya está `cancelled`:

```json
{ "status": "error", "message": "Un evento cancelado no se puede modificar" }
```

### PATCH /api/events/:id/status — cambiar el status

Requiere ser el dueño o `admin`. Es la única forma de "cancelar" un evento: nunca se borra el documento de la base.

**Request**

```json
{ "status": "cancelled" }
```

**Response 200** — el evento con el nuevo `status`.

**Response 400** — `status` no es uno de los cuatro valores válidos, o se intenta publicar un evento `finished`/`cancelled`.

**Response 409** — el evento ya está `cancelled` (no admite un nuevo cambio de status).

### Cómo probarlo

```bash
# crear (requiere cookie de organizer o admin, ver Roles y autorizacion)
curl -b cookies.txt -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Congreso Tech 2026","description":"Charlas de IA y cloud","category":"tecnologia","location":"Centro de Convenciones","date":"2026-11-20","capacity":100}'

# publicar (el id sale de la respuesta anterior)
curl -b cookies.txt -X PATCH http://localhost:8080/api/events/<id>/status \
  -H "Content-Type: application/json" -d '{"status":"published"}'

# listar publicados, ordenados por fecha, pagina 1 de a 5
curl "http://localhost:8080/api/events?status=published&sort=date&page=1&limit=5"

# modificar (solo el dueño o un admin)
curl -b cookies.txt -X PUT http://localhost:8080/api/events/<id> \
  -H "Content-Type: application/json" -d '{"capacity":150}'

# cancelar: no se borra el evento, solo cambia el status
curl -b cookies.txt -X PATCH http://localhost:8080/api/events/<id>/status \
  -H "Content-Type: application/json" -d '{"status":"cancelled"}'

# el evento cancelado sigue existiendo
curl http://localhost:8080/api/events/<id>
```

`test/integration/events.test.js` cubre el listado (filtros combinados, paginación, ordenamiento, 404 con id válido e inválido) y `test/integration/authorization.test.js` cubre la creación por rol, la propiedad de recursos en `PUT` y en el cambio de status, y las transiciones de status inválidas — los mismos casos que pide el enunciado de esta entrega.

## Tickets e inscripciones

Un usuario autenticado (cualquier rol) puede inscribirse a un evento publicado. La entidad `Ticket` relaciona un usuario con un evento — nunca guarda una copia de sus datos, solo la referencia (`ObjectId`) a cada uno.

### Modelo `Ticket`

| Campo | Tipo | Detalle |
|---|---|---|
| `user` | ObjectId (ref `users`) | Quién se inscribió |
| `event` | ObjectId (ref `events`) | A qué evento |
| `status` | String | `confirmed` (por defecto), `pending` o `cancelled` |
| `quantity` | Number | Requerido, entero mayor a 0 (cuántos lugares reserva ese ticket) |
| `reservationCode` | String | Código único generado al crear el ticket (`TCK-XXXXXXXX`) |
| `createdAt` | Date | Automático (`timestamps` de Mongoose) |
| `cancelledAt` | Date | `null` hasta que se cancela; se completa al cancelar |

Ninguna inscripción se hace `pending` en esta entrega: como no hay un paso de pago o aprobación todavía, toda inscripción exitosa nace `confirmed`. El valor `pending` queda reservado en el enum para cuando se agregue ese flujo, sin tener que tocar el modelo.

### Reglas de negocio (en `TicketsService`, no en la ruta ni en el controller)

| Regla | Status si falla |
|---|---|
| El evento tiene que existir | `404` |
| El evento tiene que estar `published` (ni `draft`, ni `cancelled`, ni `finished`) | `409` |
| `quantity` tiene que ser un entero mayor a 0 | `400` |
| Cupos disponibles ≥ `quantity` pedida | `409`, con el mensaje indicando cuántos quedan |
| El usuario no puede tener ya una inscripción activa para ese evento | `409` |
| Cancelar: el ticket tiene que existir, ser del que cancela (o admin), y no estar ya cancelado | `404` / `403` / `409` |

### La regla de cupos

Cupos ocupados = suma de `quantity` de todos los tickets del evento **con `status` distinto de `cancelled`**. Un ticket cancelado no cuenta: por eso cancelar libera el cupo automáticamente, sin ninguna otra acción. Nada se resta ni se recalcula a mano — la próxima inscripción simplemente vuelve a sumar contra los tickets activos que queden. El cálculo en sí vive en el repository (`countActiveTickets`), no en el service — ver [Arquitectura en capas](#arquitectura-en-capas):

```js
// src/services/tickets.service.js
const occupied = await this.repository.countActiveTickets(eventId);
const available = event.capacity - occupied;
```

Además de esta validación a nivel aplicación, el modelo tiene un índice único parcial sobre `{ user, event }` que solo aplica a tickets no cancelados: si dos pedidos llegaran casi al mismo tiempo e igual pasaran la primera validación, Mongo rechaza el segundo insert como duplicado y el service lo traduce al mismo error de negocio (409), en vez de dejar pasar dos inscripciones activas para el mismo usuario. Lo que **no** cubre esta entrega es una condición de carrera sobre el cupo en sí (dos inscripciones simultáneas que juntas superen la capacidad): eso requeriría una transacción de Mongo, fuera del alcance de este proyecto por ahora.

### POST /api/events/:id/tickets — inscribirse

Requiere sesión (cualquier rol: `user`, `organizer` o `admin` pueden inscribirse a eventos, inclusive a los que no organizan ellos).

**Request**

```json
{ "quantity": 2 }
```

`quantity` es opcional: si no se manda, vale `1`.

**Response 201**

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "user": "665f28...",
    "event": "665f27...",
    "status": "confirmed",
    "quantity": 2,
    "reservationCode": "TCK-1F836D7F",
    "cancelledAt": null,
    "createdAt": "2026-09-03T23:40:44.056Z",
    "updatedAt": "2026-09-03T23:40:44.056Z"
  }
}
```

Si el envío del email de confirmación está configurado (ver [más abajo](#confirmación-por-email)), se dispara en este mismo paso; si falla, no cambia la respuesta — el ticket ya quedó creado.

**Response 404** — el evento no existe.

**Response 409** — el evento no está publicado, ya finalizó, está cancelado, no hay cupos suficientes, o ya existe una inscripción activa del mismo usuario para ese evento. El mensaje distingue cuál de los casos fue:

```json
{ "status": "error", "message": "No hay cupos suficientes: quedan 0 de 1" }
```

### GET /api/tickets/my-tickets — mis inscripciones

Requiere sesión. Devuelve únicamente los tickets del usuario autenticado, con los datos del evento traídos por `populate` (`title`, `date`, `location`, sin más) — nunca datos de otros usuarios.

**Response 200**

```json
{
  "status": "success",
  "payload": [
    {
      "id": "665f2a...",
      "user": "665f28...",
      "event": { "title": "Congreso Tech 2026", "date": "2099-11-20T00:00:00.000Z", "location": "Lima" },
      "status": "confirmed",
      "quantity": 1,
      "reservationCode": "TCK-1F836D7F",
      "cancelledAt": null
    }
  ]
}
```

### GET /api/events/:id/tickets — inscripciones de un evento

Requiere sesión + rol `organizer` o `admin` (`authorize` en la ruta), y además ser el dueño de ese evento puntual si el rol es `organizer` (`TicketsService` lo valida contra `event.organizer`, igual que en `PUT /api/events/:id`). Un `organizer` que no organiza ese evento recibe `403`, aunque el rol en sí esté permitido.

**Response 200** — la lista completa de tickets del evento (todos los `status`, no solo los activos: un organizer necesita ver también los cancelados).

### PATCH /api/tickets/:tid/cancel — cancelar una inscripción

Requiere sesión + ser el dueño del ticket, o `admin`. Cambia `status` a `cancelled` y completa `cancelledAt`; el documento **nunca se borra**.

**Response 200**

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "status": "cancelled",
    "cancelledAt": "2026-09-03T23:40:56.683Z",
    "...": "..."
  }
}
```

**Response 403** — el ticket es de otro usuario y quien cancela no es `admin`.

**Response 409** — el ticket ya estaba cancelado.

Apenas se cancela, el cupo queda libre: una inscripción nueva de otro usuario para ese mismo evento vuelve a ser posible si antes no había lugar.

### Confirmación por email

`src/utils/mailer.js` envuelve Nodemailer. El transporte se arma una sola vez con `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER` y `MAIL_PASS`, y cada email sale con `from: MAIL_FROM` — ninguna credencial está hardcodeada en el código, todas salen de variables de entorno (ver [Configuración de variables de entorno](#configuración-de-variables-de-entorno)).

Si `MAIL_HOST` no está configurado, `sendMail` no intenta conectarse a ningún servidor: solo deja un `[WARN]` en el log y sigue. Esto es a propósito: una inscripción no debería fallar porque el proveedor de email esté caído o mal configurado en desarrollo. Por la misma razón, `TicketsService.createTicket` espera el envío pero atrapa cualquier error del mailer — si el email falla, el ticket ya creado no se deshace.

Para probarlo con Gmail: activar verificación en dos pasos en la cuenta y generar una "contraseña de aplicación" (no la contraseña normal) para usar como `MAIL_PASS`. También funciona con cualquier otro proveedor SMTP (Mailtrap, Ethereal, un dominio propio, etc.), completando `MAIL_HOST`/`MAIL_PORT` acordes.

### Cómo probarlo

```bash
# inscribirse (requiere cookie de sesion, cualquier rol; el evento tiene que estar published)
curl -b cookies.txt -X POST http://localhost:8080/api/events/<id>/tickets \
  -H "Content-Type: application/json" -d '{"quantity":1}'

# mis inscripciones
curl -b cookies.txt http://localhost:8080/api/tickets/my-tickets

# inscripciones de un evento (organizer dueño o admin)
curl -b cookies.txt http://localhost:8080/api/events/<id>/tickets

# cancelar (libera el cupo)
curl -b cookies.txt -X PATCH http://localhost:8080/api/tickets/<tid>/cancel
```

`test/integration/tickets.test.js` automatiza el flujo completo: inscripción exitosa, sin sesión (401), evento inexistente (404), evento en borrador/cancelado (409), sin cupo (409 con mensaje), inscripción duplicada (409), cancelación propia liberando el cupo, cancelación de un ticket ajeno como `user` (403), y `GET /api/events/:id/tickets` como `user` común y como `organizer` de otro evento (403 en ambos). `test/unit/tickets.service.test.js` cubre las mismas reglas con un repositorio, un `eventsRepository` y un mailer simulados, incluyendo que una falla del mailer no rompe la creación del ticket.

## Seguridad de las contraseñas

Tres capas independientes evitan que la contraseña se filtre:

1. **Nunca se guarda en texto plano.** La estrategia `register` la hashea con bcrypt (`utils/hash.js`, 10 rondas de salt) antes de pasarla al repositorio.
2. **Nunca sale en una respuesta.** Todo usuario que viaja al cliente pasa por el DTO `src/dto/user.dto.js` (`toUserDTO`), que arma un objeto solo con `id`, `first_name`, `last_name`, `email` y `role` — ver [Arquitectura en capas](#arquitectura-en-capas).
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
  "payload": { "data": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
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

Capturas del servidor respondiendo en local sobre `http://localhost:8080`, con la base alojada en MongoDB Atlas.

### Registro de usuarios

Registro exitoso y rechazo del email duplicado. En la petición viaja `"password":"Secreta123"`, y la respuesta devuelve únicamente `id`, `first_name`, `last_name`, `email` y `role`:

![Respuesta del endpoint de registro](docs/register-response.png)

### Autenticación con JWT y cookies

Flujo completo en una corrida. **(a)** el login responde `Login correcto` y devuelve la cookie `currentUser` con `HttpOnly`, `SameSite=Lax` y `Max-Age=3600`; **(b)** `/current` con esa cookie devuelve `200` con `id`, `email` y `role`; **(c)** el mismo `/current` sin cookie devuelve `401` con `No autenticado`:

![Login, current con cookie y current sin cookie](docs/auth-flujo.png)

> El comportamiento de estas capturas no cambió con la Pre-entrega 4: por dentro, `login` y `current` ahora pasan por las estrategias de Passport descritas en [Autenticación centralizada con Passport](#autenticación-centralizada-con-passport), pero las respuestas HTTP son las mismas.

### Contraseñas almacenadas

Colección `users` en MongoDB Atlas. El campo `password` guarda un hash de bcrypt (`$2b$10$...`), nunca el texto original:

![Usuarios en MongoDB con la contraseña hasheada](docs/mongodb-password-hasheada.png)

### Endpoints base

**GET /api/health**

![Respuesta del endpoint de health](docs/health.png)

**GET /api/events**

![Respuesta del endpoint de eventos](docs/events.png)

> Esta captura es de antes de la Pre-entrega 6: en ese momento `GET /api/events` devolvía `payload: []` directamente. Desde esta entrega devuelve `payload: { data, page, limit, total, totalPages }` (ver [Eventos](#eventos)); el array vacío pasó a ser `data: []` dentro de ese objeto.

## Próximos pasos

- Estrategias de Passport para providers externos (Google, GitHub, etc.), apoyadas en la estructura de `passport.config.js`.
- Flujo de pago/aprobación que use el status `pending` de `Ticket`, hoy reservado sin uso.
- Notificaciones adicionales (por ejemplo, al publicar o cancelar un evento, o al cancelar una inscripción).
- Manejo transaccional del control de cupos ante inscripciones concurrentes.

## Autor

**Daniel Andrés Sánchez Botta** — Backend II, Coderhouse.
