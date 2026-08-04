import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';

describe('Rutas de sessions pendientes de implementar', () => {
  const endpoints = [
    { method: 'post', path: '/api/sessions/login' },
    { method: 'get', path: '/api/sessions/current' },
    { method: 'post', path: '/api/sessions/logout' }
  ];

  for (const endpoint of endpoints) {
    it(`${endpoint.method.toUpperCase()} ${endpoint.path} existe y responde 501`, async () => {
      const response = await request(app)[endpoint.method](endpoint.path);

      assert.equal(response.status, 501);
      assert.equal(response.body.status, 'error');
      assert.match(response.body.message, /proxima entrega/);
    });
  }

  it('el login todavia no devuelve token ni cookies', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({ email: 'usuario@correo.pe', password: 'Secreta123' });

    assert.equal(response.status, 501);
    assert.equal(response.body.token, undefined);
    assert.equal(response.headers['set-cookie'], undefined);
  });
});

describe('La ruta de registro esta publicada', () => {
  it('POST /api/sessions/register no responde 404 ni 501', async () => {
    const response = await request(app).post('/api/sessions/register').send({});

    assert.notEqual(response.status, 404);
    assert.notEqual(response.status, 501);
  });
});
