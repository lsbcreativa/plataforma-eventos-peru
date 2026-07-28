import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/health', () => {
  it('responde 200 con el estado del servidor', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok', message: 'Servidor activo' });
  });

  it('devuelve el contenido en formato JSON', async () => {
    const response = await request(app).get('/api/health');

    assert.match(response.headers['content-type'], /application\/json/);
  });
});
