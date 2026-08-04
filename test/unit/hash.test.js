import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, isValidPassword } from '../../src/utils/hash.js';

describe('createHash', () => {
  it('nunca devuelve la contraseña en texto plano', async () => {
    const password = 'Secreta123';
    const hash = await createHash(password);

    assert.notEqual(hash, password);
    assert.ok(!hash.includes(password));
  });

  it('genera un hash con el formato de bcrypt', async () => {
    const hash = await createHash('Secreta123');

    assert.match(hash, /^\$2[aby]\$\d{2}\$/);
  });

  it('produce hashes distintos para la misma contraseña por el salt aleatorio', async () => {
    const [primero, segundo] = await Promise.all([createHash('Secreta123'), createHash('Secreta123')]);

    assert.notEqual(primero, segundo);
  });
});

describe('isValidPassword', () => {
  it('reconoce la contraseña correcta contra su hash', async () => {
    const hash = await createHash('Secreta123');

    assert.equal(await isValidPassword('Secreta123', hash), true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await createHash('Secreta123');

    assert.equal(await isValidPassword('otraClave123', hash), false);
  });

  it('devuelve false si falta alguno de los dos valores', async () => {
    assert.equal(await isValidPassword('', 'hash'), false);
    assert.equal(await isValidPassword('Secreta123', ''), false);
  });
});
