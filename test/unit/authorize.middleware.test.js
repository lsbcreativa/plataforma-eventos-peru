import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../../src/middlewares/authorize.middleware.js';

describe('authorize', () => {
  it('deja pasar cuando el rol de req.user esta permitido', () => {
    const req = { user: { role: 'admin' } };
    let siguiente = false;

    authorize('organizer', 'admin')(req, {}, () => {
      siguiente = true;
    });

    assert.equal(siguiente, true);
  });

  it('rechaza con 403 cuando el rol no esta permitido', () => {
    const req = { user: { role: 'user' } };
    let error;

    authorize('organizer', 'admin')(req, {}, (err) => {
      error = err;
    });

    assert.equal(error.status, 403);
    assert.equal(error.message, 'No tienes permisos para realizar esta acción');
  });

  it('rechaza con 403 si no hay usuario en la request', () => {
    const req = {};
    let error;

    authorize('admin')(req, {}, (err) => {
      error = err;
    });

    assert.equal(error.status, 403);
  });
});
