import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { isValidPassword } from '../../src/utils/hash.js';

let mongoServer;

const nuevoUsuario = {
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'Ana@Mail.com ',
  password: 'Secreta123'
};

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

describe('POST /api/sessions/register - registro exitoso', () => {
  it('responde 201 con el usuario creado', async () => {
    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(response.status, 201);
    assert.equal(response.body.status, 'success');
    assert.equal(response.body.payload.first_name, 'Ana');
    assert.equal(response.body.payload.last_name, 'Pérez');
    assert.ok(response.body.payload.id);
  });

  it('devuelve el email normalizado', async () => {
    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(response.body.payload.email, 'ana@mail.com');
  });

  it('asigna el rol user por defecto', async () => {
    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(response.body.payload.role, 'user');
  });

  it('persiste el usuario en la base de datos', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    const guardado = await User.findOne({ email: 'ana@mail.com' });

    assert.ok(guardado);
    assert.equal(guardado.first_name, 'Ana');
    assert.equal(guardado.role, 'user');
  });
});

describe('POST /api/sessions/register - proteccion de la contraseña', () => {
  it('no devuelve el campo password en la respuesta', async () => {
    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(response.body.payload.password, undefined);
  });

  it('no filtra la contraseña en ninguna parte del cuerpo de la respuesta', async () => {
    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.ok(!JSON.stringify(response.body).includes('Secreta123'));
    assert.ok(!JSON.stringify(response.body).includes('$2b$'));
  });

  it('guarda la contraseña hasheada, no en texto plano', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    const enBaseDeDatos = await mongoose.connection.collection('users').findOne({
      email: 'ana@mail.com'
    });

    assert.notEqual(enBaseDeDatos.password, 'Secreta123');
    assert.match(enBaseDeDatos.password, /^\$2[aby]\$\d{2}\$/);
  });

  it('el hash guardado corresponde a la contraseña original', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    const guardado = await User.findOne({ email: 'ana@mail.com' });

    assert.equal(await isValidPassword('Secreta123', guardado.password), true);
    assert.equal(await isValidPassword('otraClave123', guardado.password), false);
  });
});

describe('POST /api/sessions/register - el rol no se puede manipular', () => {
  it('ignora el rol admin enviado en el body', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ ...nuevoUsuario, role: 'admin' });

    assert.equal(response.body.payload.role, 'user');

    const guardado = await User.findOne({ email: 'ana@mail.com' });
    assert.equal(guardado.role, 'user');
  });

  it('ignora tambien el rol organizer enviado en el body', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ ...nuevoUsuario, role: 'organizer' });

    assert.equal(response.body.payload.role, 'user');
  });
});

describe('POST /api/sessions/register - validaciones', () => {
  it('responde 400 cuando faltan campos obligatorios', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ email: 'ana@mail.com', password: 'Secreta123' });

    assert.equal(response.status, 400);
    assert.equal(response.body.status, 'error');
    assert.match(response.body.message, /Faltan campos obligatorios/);
  });

  it('responde 400 con el body vacio', async () => {
    const response = await request(app).post('/api/sessions/register').send({});

    assert.equal(response.status, 400);
    assert.match(response.body.message, /Faltan campos obligatorios/);
  });

  it('responde 400 cuando el email tiene formato invalido', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ ...nuevoUsuario, email: 'correo-sin-arroba' });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /formato del email/);
  });

  it('responde 400 cuando la contraseña es demasiado corta', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ ...nuevoUsuario, password: 'corta' });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /al menos 8 caracteres/);
  });

  it('no crea ningun usuario cuando la validacion falla', async () => {
    await request(app).post('/api/sessions/register').send({ email: 'ana@mail.com' });

    assert.equal(await User.countDocuments(), 0);
  });
});

describe('POST /api/sessions/register - email duplicado', () => {
  it('responde 409 si el email ya esta registrado', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    const response = await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(response.status, 409);
    assert.equal(response.body.status, 'error');
    assert.match(response.body.message, /El email ya está registrado/);
  });

  it('detecta el duplicado aunque el email venga con otra combinacion de mayusculas', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    const response = await request(app)
      .post('/api/sessions/register')
      .send({ ...nuevoUsuario, email: '  ANA@MAIL.COM  ' });

    assert.equal(response.status, 409);
  });

  it('no duplica el usuario en la base de datos', async () => {
    await request(app).post('/api/sessions/register').send(nuevoUsuario);
    await request(app).post('/api/sessions/register').send(nuevoUsuario);

    assert.equal(await User.countDocuments({ email: 'ana@mail.com' }), 1);
  });
});
