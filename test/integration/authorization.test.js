import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/User.js');
const { Event } = await import('../../src/models/Event.js');
const { createHash } = await import('../../src/utils/hash.js');

let mongoServer;

const PASSWORD = 'Secreta123';

const nuevoEvento = {
  title: 'Congreso Tech 2026',
  description: 'Congreso de tecnologia en Lima',
  category: 'tecnologia',
  location: 'Centro de Convenciones de Lima',
  date: '2099-11-20',
  capacity: 100
};

let hash;

const crearUsuario = (role, email) =>
  User.create({
    first_name: 'Test',
    last_name: role,
    email,
    password: hash,
    role
  });

const loginComo = async (email) => {
  const agent = request.agent(app);
  const login = await agent.post('/api/sessions/login').send({ email, password: PASSWORD });
  assert.equal(login.status, 200, `login fallo para ${email}: ${JSON.stringify(login.body)}`);
  return agent;
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
  hash = await createHash(PASSWORD);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
});

describe('Autorizacion por roles: POST /api/events', () => {
  it('con rol user responde 403', async () => {
    await crearUsuario('user', 'user@mail.com');
    const agent = await loginComo('user@mail.com');

    const response = await agent.post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, {
      status: 'error',
      message: 'No tienes permisos para realizar esta acción'
    });
  });

  it('con rol organizer responde 201', async () => {
    await crearUsuario('organizer', 'organizer@mail.com');
    const agent = await loginComo('organizer@mail.com');

    const response = await agent.post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 201);
    assert.equal(response.body.status, 'success');
    assert.equal(response.body.payload.title, nuevoEvento.title);
    assert.equal(response.body.payload.status, 'draft');
    assert.ok(response.body.payload.organizer);
  });

  it('con rol admin responde 201', async () => {
    await crearUsuario('admin', 'admin@mail.com');
    const agent = await loginComo('admin@mail.com');

    const response = await agent.post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 201);
  });

  it('sin cookie responde 401', async () => {
    const response = await request(app).post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'No autenticado' });
  });

  it('con fecha pasada responde 400', async () => {
    await crearUsuario('organizer', 'organizer1b@mail.com');
    const agent = await loginComo('organizer1b@mail.com');

    const response = await agent.post('/api/events').send({ ...nuevoEvento, date: '2000-01-01' });

    assert.equal(response.status, 400);
  });

  it('con capacity 0 responde 400', async () => {
    await crearUsuario('organizer', 'organizer1c@mail.com');
    const agent = await loginComo('organizer1c@mail.com');

    const response = await agent.post('/api/events').send({ ...nuevoEvento, capacity: 0 });

    assert.equal(response.status, 400);
  });

  it('ignora el organizer que venga en el body: siempre es el usuario autenticado', async () => {
    const organizador = await crearUsuario('organizer', 'organizer1d@mail.com');
    const otroId = new mongoose.Types.ObjectId();
    const agent = await loginComo('organizer1d@mail.com');

    const response = await agent.post('/api/events').send({ ...nuevoEvento, organizer: otroId.toString() });

    assert.equal(response.body.payload.organizer, String(organizador._id));
  });
});

describe('Propiedad de recursos: PUT /api/events/:id', () => {
  it('el organizer dueño puede modificar su propio evento', async () => {
    await crearUsuario('organizer', 'dueno@mail.com');
    const agent = await loginComo('dueno@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);

    const response = await agent
      .put(`/api/events/${creado.body.payload.id}`)
      .send({ title: 'Congreso Tech 2026 - Actualizado' });

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.title, 'Congreso Tech 2026 - Actualizado');
  });

  it('un organizer no puede modificar el evento de otro organizer', async () => {
    await crearUsuario('organizer', 'dueno2@mail.com');
    await crearUsuario('organizer', 'intruso@mail.com');

    const dueno = await loginComo('dueno2@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const intruso = await loginComo('intruso@mail.com');
    const response = await intruso
      .put(`/api/events/${creado.body.payload.id}`)
      .send({ title: 'Intento de modificacion ajena' });

    assert.equal(response.status, 403);
    assert.equal(response.body.status, 'error');
  });

  it('un admin puede modificar el evento de cualquier organizer', async () => {
    await crearUsuario('organizer', 'dueno3@mail.com');
    await crearUsuario('admin', 'admin2@mail.com');

    const dueno = await loginComo('dueno3@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const admin = await loginComo('admin2@mail.com');
    const response = await admin
      .put(`/api/events/${creado.body.payload.id}`)
      .send({ capacity: 200 });

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.capacity, 200);
  });

  it('sin cookie responde 401', async () => {
    await crearUsuario('organizer', 'dueno3b@mail.com');
    const dueno = await loginComo('dueno3b@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const response = await request(app).put(`/api/events/${creado.body.payload.id}`).send({ title: 'x' });

    assert.equal(response.status, 401);
  });

  it('no permite modificar un evento cancelado', async () => {
    await crearUsuario('organizer', 'dueno3c@mail.com');
    const agent = await loginComo('dueno3c@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);
    await agent.patch(`/api/events/${creado.body.payload.id}/status`).send({ status: 'published' });
    await agent.patch(`/api/events/${creado.body.payload.id}/status`).send({ status: 'cancelled' });

    const response = await agent.put(`/api/events/${creado.body.payload.id}`).send({ title: 'x' });

    assert.equal(response.status, 409);
  });
});

describe('Cambio de estado: PATCH /api/events/:id/status', () => {
  it('el organizer dueño puede publicar su propio evento', async () => {
    await crearUsuario('organizer', 'dueno4@mail.com');
    const agent = await loginComo('dueno4@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);

    const response = await agent
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'published' });

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.status, 'published');
  });

  it('un organizer no puede cambiar el status de un evento ajeno', async () => {
    await crearUsuario('organizer', 'dueno5@mail.com');
    await crearUsuario('organizer', 'intruso2@mail.com');

    const dueno = await loginComo('dueno5@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const intruso = await loginComo('intruso2@mail.com');
    const response = await intruso
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'cancelled' });

    assert.equal(response.status, 403);
  });

  it('un admin puede cambiar el status de cualquier evento (cancelar = no se borra)', async () => {
    await crearUsuario('organizer', 'dueno6@mail.com');
    await crearUsuario('admin', 'admin3@mail.com');

    const dueno = await loginComo('dueno6@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const admin = await loginComo('admin3@mail.com');
    const response = await admin
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'cancelled' });

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.status, 'cancelled');

    const sigueExistiendo = await request(app).get(`/api/events/${creado.body.payload.id}`);
    assert.equal(sigueExistiendo.status, 200);
  });

  it('cambiar el status de un evento cancelado responde error (no 200)', async () => {
    await crearUsuario('organizer', 'dueno7@mail.com');
    const agent = await loginComo('dueno7@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);
    await agent.patch(`/api/events/${creado.body.payload.id}/status`).send({ status: 'cancelled' });

    const response = await agent
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'published' });

    assert.equal(response.status, 409);
    assert.equal(response.body.status, 'error');
  });

  it('no permite publicar un evento ya finalizado', async () => {
    await crearUsuario('admin', 'admin4@mail.com');
    const admin = await loginComo('admin4@mail.com');
    const creado = await admin.post('/api/events').send(nuevoEvento);
    await admin.patch(`/api/events/${creado.body.payload.id}/status`).send({ status: 'finished' });

    const response = await admin
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'published' });

    assert.equal(response.status, 400);
  });

  it('rechaza un status que no existe', async () => {
    await crearUsuario('organizer', 'dueno8@mail.com');
    const agent = await loginComo('dueno8@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);

    const response = await agent
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'archivado' });

    assert.equal(response.status, 400);
  });

  it('sin cookie responde 401', async () => {
    await crearUsuario('organizer', 'dueno9@mail.com');
    const dueno = await loginComo('dueno9@mail.com');
    const creado = await dueno.post('/api/events').send(nuevoEvento);

    const response = await request(app)
      .patch(`/api/events/${creado.body.payload.id}/status`)
      .send({ status: 'published' });

    assert.equal(response.status, 401);
  });
});

describe('Ruta administrativa: GET /api/users', () => {
  it('sin cookie responde 401', async () => {
    const response = await request(app).get('/api/users');

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'No autenticado' });
  });

  it('con rol organizer responde 403', async () => {
    await crearUsuario('organizer', 'organizer2@mail.com');
    const agent = await loginComo('organizer2@mail.com');

    const response = await agent.get('/api/users');

    assert.equal(response.status, 403);
  });

  it('con rol admin responde 200 y no expone el password', async () => {
    await crearUsuario('admin', 'admin5@mail.com');
    const agent = await loginComo('admin5@mail.com');

    const response = await agent.get('/api/users');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.payload));
    assert.ok(response.body.payload.length >= 1);
    assert.ok(!JSON.stringify(response.body).includes(PASSWORD));
    assert.ok(!JSON.stringify(response.body).includes('$2b$'));
  });
});
