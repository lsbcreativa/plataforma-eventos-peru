import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';

describe('Manejo centralizado de errores', () => {
  it('responde 404 con un mensaje claro ante una ruta inexistente', async () => {
    const response = await request(app).get('/api/ruta-que-no-existe');

    assert.equal(response.status, 404);
    assert.equal(response.body.status, 'error');
    assert.match(response.body.message, /no existe en esta API/);
  });

  it('incluye el metodo y la ruta solicitada en el mensaje', async () => {
    const response = await request(app).post('/api/otra');

    assert.match(response.body.message, /POST/);
    assert.match(response.body.message, /\/api\/otra/);
  });

  it('responde 400 cuando el body JSON esta malformado', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .set('Content-Type', 'application/json')
      .send('{"email": roto}');

    assert.equal(response.status, 400);
    assert.equal(response.body.status, 'error');
  });
});

describe('Configuracion de Express', () => {
  it('parsea el body en formato JSON y el servicio lee sus campos', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send({ first_name: 'Daniel', last_name: 'Sánchez' });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /email, password/);
  });
});
