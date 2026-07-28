import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/events', () => {
  it('responde 200 con el formato { status, payload }', async () => {
    const response = await request(app).get('/api/events');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'success');
    assert.ok(Array.isArray(response.body.payload));
  });

  it('devuelve una lista vacia mientras no haya eventos cargados', async () => {
    const response = await request(app).get('/api/events');

    assert.deepEqual(response.body, { status: 'success', payload: [] });
  });

  it('acepta filtros por query string sin romperse', async () => {
    const response = await request(app).get('/api/events?city=Lima&category=tecnologia');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.payload, []);
  });
});

describe('GET /api/events/:eid', () => {
  it('responde 404 cuando el evento no existe', async () => {
    const response = await request(app).get('/api/events/inexistente');

    assert.equal(response.status, 404);
    assert.equal(response.body.status, 'error');
    assert.equal(response.body.error, 'Evento no encontrado');
  });
});
