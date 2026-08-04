import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_PASSWORD_LENGTH,
  findMissingFields,
  hasValidPasswordLength,
  isValidEmail,
  normalizeEmail
} from '../../src/utils/validators.js';

describe('normalizeEmail', () => {
  it('quita espacios y pasa todo a minusculas', () => {
    assert.equal(normalizeEmail('  Ana@Mail.com '), 'ana@mail.com');
  });

  it('deja igual un email que ya viene normalizado', () => {
    assert.equal(normalizeEmail('ana@mail.com'), 'ana@mail.com');
  });
});

describe('isValidEmail', () => {
  it('acepta emails con formato correcto', () => {
    assert.equal(isValidEmail('daniel@correo.pe'), true);
    assert.equal(isValidEmail('nombre.apellido@empresa.com.pe'), true);
  });

  it('rechaza emails con formato invalido', () => {
    const invalidos = ['sin-arroba.com', '@sinusuario.com', 'sin@dominio', 'con espacio@mail.com', ''];

    for (const email of invalidos) {
      assert.equal(isValidEmail(email), false, `deberia rechazar: ${email}`);
    }
  });
});

describe('hasValidPasswordLength', () => {
  it(`acepta contraseñas de ${MIN_PASSWORD_LENGTH} caracteres o mas`, () => {
    assert.equal(hasValidPasswordLength('Secreta123'), true);
    assert.equal(hasValidPasswordLength('a'.repeat(MIN_PASSWORD_LENGTH)), true);
  });

  it('rechaza contraseñas demasiado cortas', () => {
    assert.equal(hasValidPasswordLength('a'.repeat(MIN_PASSWORD_LENGTH - 1)), false);
  });
});

describe('findMissingFields', () => {
  const requeridos = ['first_name', 'last_name', 'email', 'password'];

  it('devuelve una lista vacia cuando estan todos los campos', () => {
    const completo = { first_name: 'Ana', last_name: 'Perez', email: 'a@b.pe', password: 'Secreta123' };

    assert.deepEqual(findMissingFields(completo, requeridos), []);
  });

  it('detecta campos ausentes', () => {
    assert.deepEqual(findMissingFields({ first_name: 'Ana' }, requeridos), [
      'last_name',
      'email',
      'password'
    ]);
  });

  it('trata los campos vacios o con solo espacios como faltantes', () => {
    const incompleto = { first_name: '   ', last_name: '', email: 'a@b.pe', password: 'Secreta123' };

    assert.deepEqual(findMissingFields(incompleto, requeridos), ['first_name', 'last_name']);
  });

  it('no falla si no se recibe ningun objeto', () => {
    assert.deepEqual(findMissingFields(undefined, requeridos), requeridos);
  });
});
