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
| Próximas | CRUD completo de eventos e inscripciones, control de cupos | Pendiente |

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

Las pruebas de integración que tocan MongoDB (`register.test.js`, `auth.test.js`, `authorization.test.js`) usan `mongodb-memory-server`, que levanta un Mongo real y efímero: no dependen del `MONGO_URL` del `.env` ni de tener una base externa corriendo. Van dentro de `devDependencies`, junto con `supertest`, así que `npm install` en cualquier entorno aislado (CI, contenedor limpio, otra máquina) deja todo listo para correr `npm test` sin instalar nada más. Unico requisito: la primera corrida necesita salida a internet para que `mongodb-memory-server` descargue el binario de MongoDB una vez; las siguientes corridas reusan esa cache local.

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
│   │   ├── events.router.js            # POST y PATCH protegidos con requireAuth + authorize
│   │   ├── sessions.router.js          # delega en passport.authenticate(...)
│   │   └── users.router.js             # GET /api/users, solo admin
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js      # genera el JWT y setea la cookie tras el login
│   │   └── users.controller.js
│   ├── services/
│   │   ├── events.service.js           # valida, crea eventos y aplica la propiedad de recursos
│   │   └── users.service.js
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/
│   │   ├── User.js                     # campo role: user (default) | organizer | admin
│   │   └── Event.js
│   ├── middlewares/
│   │   ├── passportAuth.middleware.js  # autenticacion: exporta requireAuth (401 sin sesion)
│   │   ├── authorize.middleware.js     # autorizacion: authorize(...roles) (403 sin permiso)
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js
│   └── utils/
│       ├── logger.js
│       ├── response.util.js
│       ├── hash.js                     # bcrypt reutilizable
│       ├── jwt.js                      # firma y verificación de JWT
│       ├── validators.js               # validaciones y normalización de email
│       ├── user.mapper.js              # arma el usuario público (sin password)
│       └── appError.js                 # error con código HTTP asociado
├── test/
│   ├── integration/                    # pruebas sobre los endpoints HTTP
│   │   ├── health.test.js
│   │   ├── events.test.js
│   │   ├── register.test.js            # registro contra un MongoDB real
│   │   ├── auth.test.js                # login, current y logout
│   │   ├── authorization.test.js       # roles, 401 vs 403 y propiedad de recursos
│   │   └── errores.test.js
│   └── unit/                           # pruebas de la lógica por capa
│       ├── events.dao.test.js
│       ├── events.service.test.js      # incluye createEvent/updateEvent y propiedad de recursos
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

Cada capa conoce solo a la siguiente. Los eventos siguen en memoria hasta la entrega que los implemente, y ese cambio solo afectará a su DAO.

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
           └─ events.service  valida los campos y arma el evento con organizer = req.user.id
              └─ events.repository
                 └─ events.dao
```

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/api/health` | Verifica que el servidor esté activo | No |
| GET | `/api/events` | Lista de eventos | No |
| GET | `/api/events/:eid` | Detalle de un evento | No |
| POST | `/api/events` | Crea un evento nuevo | Cookie + rol `organizer` o `admin` |
| PATCH | `/api/events/:eid` | Modifica un evento (propio si es `organizer`, cualquiera si es `admin`) | Cookie + rol `organizer` o `admin` |
| POST | `/api/sessions/register` | Registra un usuario nuevo | No |
| POST | `/api/sessions/login` | Valida credenciales y entrega la cookie de sesión | No |
| GET | `/api/sessions/current` | Devuelve el usuario autenticado | Cookie `currentUser` |
| POST | `/api/sessions/logout` | Cierra la sesión y borra la cookie | No |
| GET | `/api/users` | Lista todos los usuarios registrados | Cookie + rol `admin` |

Cada ruta está documentada con su request y su response más abajo: las de sesiones en [Registro de usuarios](#registro-de-usuarios), [Autenticación centralizada con Passport](#autenticación-centralizada-con-passport) y [Autenticación con JWT y cookies](#autenticación-con-jwt-y-cookies); las de eventos y usuarios en [Roles y autorización](#roles-y-autorización); las demás en [Ejemplos de respuesta](#ejemplos-de-respuesta).

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
| Consultar eventos publicados | ✅ | ✅ | ✅ |
| Crear eventos | ❌ | ✅ | ✅ |
| Modificar/cancelar eventos propios | ❌ | ✅ | ✅ |
| Modificar cualquier evento | ❌ | ❌ | ✅ |
| Ver todos los usuarios | ❌ | ❌ | ✅ |

"Consultar eventos publicados" no exige rol porque `GET /api/events` y `GET /api/events/:eid` son públicas: la matriz no restringe esa acción a ningún rol, así que tampoco se le exige sesión iniciada.

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
| `PATCH /api/events/:eid` | Sesión válida + rol `organizer` o `admin` + ser dueño del evento (o ser `admin`) | 401 sin sesión, 403 sin rol o sin ser dueño |
| `GET /api/users` | Sesión válida + rol `admin` | 401 sin sesión, 403 con rol `user` u `organizer` |

### Propiedad de recursos

Que un `organizer` tenga el rol correcto no significa que pueda tocar cualquier evento: `authorize('organizer', 'admin')` solo verifica el rol, no de quién es el evento. Esa segunda validación (¿este evento es tuyo?) necesita el registro puntual, así que vive en `EventsService.updateEvent` (`src/services/events.service.js`), justo después de buscarlo:

```js
if (user.role !== 'admin' && String(event.organizer) !== String(user.id)) {
  throw new AppError('No podés modificar un evento que no te pertenece', 403);
}
```

Un `admin` se salta esta comparación y puede modificar cualquier evento. El `id` y el `organizer` de un evento tampoco se pueden reasignar desde el body de un `PATCH`, sin importar el rol de quien lo pida.

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
  -d '{"title":"Congreso Tech 2026","description":"Charlas de IA y cloud","venue":"Centro de Convenciones","date":"2026-11-20","capacity":100}'

# 401 sin cookie
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -d '{}'

# 200 solo si quien pide es admin
curl -b cookies.txt http://localhost:8080/api/users
```

`test/integration/authorization.test.js` automatiza exactamente estos casos (`user` vs. `organizer` vs. `admin` en `POST /api/events`, la ruta administrativa `GET /api/users`, sin cookie, y un `organizer` intentando modificar el evento de otro), sembrando los usuarios con cada rol directo en MongoDB (igual que se haría a mano).

## Seguridad de las contraseñas

Tres capas independientes evitan que la contraseña se filtre:

1. **Nunca se guarda en texto plano.** La estrategia `register` la hashea con bcrypt (`utils/hash.js`, 10 rondas de salt) antes de pasarla al repositorio.
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

## Próximos pasos

- Estrategias de Passport para providers externos (Google, GitHub, etc.), apoyadas en la estructura de `passport.config.js`.
- CRUD completo de eventos (persistencia en MongoDB, borrado, listados por organizer).
- Inscripciones y control de cupos disponibles.

## Autor

**Daniel Andrés Sánchez Botta** — Backend II, Coderhouse.
