import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { generateToken, verifyToken } = await import('../../src/utils/jwt.js');

const payload = { id: '665f2a3b9c1d4e5f6a7b8c9d', email: 'ana@mail.com', role: 'user' };

describe('generateToken', () => {
  it('devuelve un token con las tres partes del formato JWT', () => {
    const token = generateToken(payload);

    assert.equal(token.split('.').length, 3);
  });

  it('incluye id, email y role en el payload', () => {
    const decodificado = jwt.decode(generateToken(payload));

    assert.equal(decodificado.id, payload.id);
    assert.equal(decodificado.email, payload.email);
    assert.equal(decodificado.role, payload.role);
  });

  it('le pone fecha de expiracion', () => {
    const decodificado = jwt.decode(generateToken(payload));

    assert.ok(decodificado.exp > decodificado.iat);
  });

  it('firma con la clave de las variables de entorno', () => {
    const token = generateToken(payload);

    assert.doesNotThrow(() => jwt.verify(token, process.env.JWT_SECRET));
    assert.throws(() => jwt.verify(token, 'otra-clave'));
  });
});

describe('verifyToken', () => {
  it('devuelve el payload de un token valido', () => {
    const resultado = verifyToken(generateToken(payload));

    assert.equal(resultado.email, 'ana@mail.com');
    assert.equal(resultado.role, 'user');
  });

  it('lanza si el token esta manipulado', () => {
    assert.throws(() => verifyToken('token.completamente.invalido'));
  });

  it('lanza si el token esta expirado', () => {
    const expirado = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-10s' });

    assert.throws(() => verifyToken(expirado), /expired/);
  });

  it('lanza si el token fue firmado con otra clave', () => {
    const ajeno = jwt.sign(payload, 'clave-de-un-atacante');

    assert.throws(() => verifyToken(ajeno));
  });
});
