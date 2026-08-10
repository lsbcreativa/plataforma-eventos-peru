import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/User.js');

let mongoServer;

const credenciales = { email: 'ana@mail.com', password: 'Secreta123' };

const nuevoUsuario = {
  first_name: 'Ana',
  last_name: 'Pérez',
  ...credenciales
};

const registrarUsuario = () => request(app).post('/api/sessions/register').send(nuevoUsuario);

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Flujo completo: registro, login, current y logout', () => {
  it('recorre todo el ciclo y termina con 401 despues del logout', async () => {
    const agent = request.agent(app);

    const registro = await agent.post('/api/sessions/register').send(nuevoUsuario);
    assert.equal(registro.status, 201);

    const login = await agent.post('/api/sessions/login').send(credenciales);
    assert.equal(login.status, 200);
    assert.deepEqual(login.body, { status: 'success', message: 'Login correcto' });

    const conSesion = await agent.get('/api/sessions/current');
    assert.equal(conSesion.status, 200);
    assert.equal(conSesion.body.payload.email, 'ana@mail.com');

    const logout = await agent.post('/api/sessions/logout');
    assert.equal(logout.status, 200);
    assert.deepEqual(logout.body, { status: 'success', message: 'Sesión cerrada' });

    const sinSesion = await agent.get('/api/sessions/current');
    assert.equal(sinSesion.status, 401);
    assert.deepEqual(sinSesion.body, { status: 'error', message: 'No autenticado' });
  });
});

describe('POST /api/sessions/login', () => {
  beforeEach(registrarUsuario);

  it('responde 200 y deja la cookie currentUser', async () => {
    const response = await request(app).post('/api/sessions/login').send(credenciales);

    assert.equal(response.status, 200);
    assert.ok(response.headers['set-cookie'][0].startsWith('currentUser='));
  });

  it('marca la cookie como httpOnly, sameSite lax y una hora de vida', async () => {
    const response = await request(app).post('/api/sessions/login').send(credenciales);
    const cookie = response.headers['set-cookie'][0];

    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Max-Age=3600/i);
  });

  it('no marca la cookie como secure fuera de produccion', async () => {
    const response = await request(app).post('/api/sessions/login').send(credenciales);

    assert.ok(!/Secure/i.test(response.headers['set-cookie'][0]));
  });

  it('firma un token con id, email y role, sin la contraseña', async () => {
    const response = await request(app).post('/api/sessions/login').send(credenciales);
    const token = response.headers['set-cookie'][0].split('currentUser=')[1].split(';')[0];
    const payload = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);

    assert.ok(payload.id);
    assert.equal(payload.email, 'ana@mail.com');
    assert.equal(payload.role, 'user');
    assert.equal(payload.password, undefined);
  });

  it('responde 401 generico si el email no existe', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'noexiste@mail.com', password: 'Secreta123' });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'Credenciales inválidas' });
  });

  it('responde 401 generico si la contraseña es incorrecta', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'ana@mail.com', password: 'ClaveEquivocada' });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'Credenciales inválidas' });
  });

  it('usa el mismo mensaje en los dos casos, sin revelar cual fallo', async () => {
    const emailMal = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'noexiste@mail.com', password: 'Secreta123' });
    const claveMal = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'ana@mail.com', password: 'ClaveEquivocada' });

    assert.deepEqual(emailMal.body, claveMal.body);
    assert.equal(emailMal.status, claveMal.status);
  });

  it('no deja cookie cuando las credenciales fallan', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'ana@mail.com', password: 'ClaveEquivocada' });

    assert.equal(response.headers['set-cookie'], undefined);
  });

  it('responde 400 si faltan email o password', async () => {
    const response = await request(app).post('/api/sessions/login').send({});

    assert.equal(response.status, 400);
    assert.match(response.body.message, /Faltan campos obligatorios/);
  });
});

describe('GET /api/sessions/current', () => {
  beforeEach(registrarUsuario);

  it('responde 401 sin cookie', async () => {
    const response = await request(app).get('/api/sessions/current');

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'No autenticado' });
  });

  it('responde 401 con un token manipulado', async () => {
    const response = await request(app)
      .get('/api/sessions/current')
      .set('Cookie', ['currentUser=token.completamente.invalido']);

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'No autenticado' });
  });

  it('responde 401 con un token firmado con otra clave', async () => {
    const intruso = jwt.sign({ id: '1', email: 'ana@mail.com', role: 'admin' }, 'otra-clave');

    const response = await request(app)
      .get('/api/sessions/current')
      .set('Cookie', [`currentUser=${intruso}`]);

    assert.equal(response.status, 401);
  });

  it('responde 401 con un token expirado', async () => {
    const expirado = jwt.sign({ id: '1', email: 'ana@mail.com', role: 'user' }, process.env.JWT_SECRET, {
      expiresIn: '-10s'
    });

    const response = await request(app)
      .get('/api/sessions/current')
      .set('Cookie', [`currentUser=${expirado}`]);

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { status: 'error', message: 'No autenticado' });
  });

  it('devuelve solo id, email y role', async () => {
    const agent = request.agent(app);
    await agent.post('/api/sessions/login').send(credenciales);

    const response = await agent.get('/api/sessions/current');

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body.payload).sort(), ['email', 'id', 'role']);
    assert.ok(!JSON.stringify(response.body).includes('Secreta123'));
  });
});

describe('POST /api/sessions/logout', () => {
  beforeEach(registrarUsuario);

  it('borra la cookie currentUser', async () => {
    const agent = request.agent(app);
    await agent.post('/api/sessions/login').send(credenciales);

    const response = await agent.post('/api/sessions/logout');

    assert.equal(response.status, 200);
    assert.match(response.headers['set-cookie'][0], /currentUser=;/);
  });

  it('responde con la confirmacion aunque no hubiera sesion abierta', async () => {
    const response = await request(app).post('/api/sessions/logout');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'success', message: 'Sesión cerrada' });
  });
});
