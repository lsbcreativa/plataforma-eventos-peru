import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { successResponse, errorResponse } from '../../src/utils/response.util.js';

const crearRespuestaFalsa = () => {
  const res = {};
  res.status = (codigo) => {
    res.statusCode = codigo;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

describe('successResponse', () => {
  it('responde 200 por defecto con el formato { status, payload }', () => {
    const res = crearRespuestaFalsa();

    successResponse(res, []);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { status: 'success', payload: [] });
  });

  it('permite indicar otro codigo de estado', () => {
    const res = crearRespuestaFalsa();

    successResponse(res, { id: '1' }, 201);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { status: 'success', payload: { id: '1' } });
  });
});

describe('errorResponse', () => {
  it('responde 500 por defecto con el formato { status, error }', () => {
    const res = crearRespuestaFalsa();

    errorResponse(res, 'Fallo inesperado');

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { status: 'error', error: 'Fallo inesperado' });
  });

  it('permite indicar otro codigo de estado', () => {
    const res = crearRespuestaFalsa();

    errorResponse(res, 'No encontrado', 404);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { status: 'error', error: 'No encontrado' });
  });
});
