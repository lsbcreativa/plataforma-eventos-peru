import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/User.js');
const { createHash } = await import('../../src/utils/hash.js');

let mongoServer;

const PASSWORD = 'Secreta123';

const nuevoEvento = {
  title: 'Congreso Tech 2026',
  description: 'Congreso de tecnologia en Lima',
  venue: 'Centro de Convenciones de Lima',
  date: '2026-11-20',
  capacity: 100
};

const crearUsuario = (role, email) =>
  User.create({
    first_name: 'Test',
    last_name: role,
    email,
    password: hash,
    role
  });

let hash;

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
});

describe('Autorizacion por roles: POST /api/events', () => {
  it('con rol user responde 403', async () => {
    await crearUsuario('user', 'user@mail.com');
    const agent = await loginComo('user@mail.com');

    const response = await agent.post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, {
      status: 'error',
      message: 'No tenés permisos para realizar esta acción'
    });
  });

  it('con rol organizer responde 201', async () => {
    await crearUsuario('organizer', 'organizer@mail.com');
    const agent = await loginComo('organizer@mail.com');

    const response = await agent.post('/api/events').send(nuevoEvento);

    assert.equal(response.status, 201);
    assert.equal(response.body.status, 'success');
    assert.equal(response.body.payload.title, nuevoEvento.title);
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

  it('con un token manipulado responde 401, no 403', async () => {
    const response = await request(app)
      .post('/api/events')
      .set('Cookie', ['currentUser=token.completamente.invalido'])
      .send(nuevoEvento);

    assert.equal(response.status, 401);
  });
});

describe('Propiedad de recursos: PATCH /api/events/:eid', () => {
  it('el organizer dueño puede modificar su propio evento', async () => {
    await crearUsuario('organizer', 'dueno@mail.com');
    const agent = await loginComo('dueno@mail.com');
    const creado = await agent.post('/api/events').send(nuevoEvento);

    const response = await agent
      .patch(`/api/events/${creado.body.payload.id}`)
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
      .patch(`/api/events/${creado.body.payload.id}`)
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
      .patch(`/api/events/${creado.body.payload.id}`)
      .send({ status: 'cancelado' });

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.status, 'cancelado');
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
    await crearUsuario('admin', 'admin3@mail.com');
    const agent = await loginComo('admin3@mail.com');

    const response = await agent.get('/api/users');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.payload));
    assert.ok(response.body.payload.length >= 1);
    assert.ok(!JSON.stringify(response.body).includes(PASSWORD));
    assert.ok(!JSON.stringify(response.body).includes('$2b$'));
  });
});
