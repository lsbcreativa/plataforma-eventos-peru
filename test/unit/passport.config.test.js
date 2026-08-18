import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerVerify, loginVerify } from '../../src/config/passport.config.js';
import { isValidPassword } from '../../src/utils/hash.js';

const datosValidos = {
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'Ana@Mail.com ',
  password: 'Secreta123'
};

/** Repositorio en memoria que imita el contrato del repositorio real. */
const crearRepositorioFalso = () => {
  const guardados = [];

  return {
    guardados,
    getUserByEmail: async (email) => guardados.find((user) => user.email === email) || null,
    createUser: async (data) => {
      const creado = { _id: `id-${guardados.length + 1}`, role: 'user', ...data };
      guardados.push(creado);
      return creado;
    }
  };
};

/** Ejecuta un verificador de Passport y resuelve con lo que reciba su callback `done`. */
const ejecutarVerify = (verify, body) =>
  new Promise((resolve) => {
    verify({ body }, (error, user) => resolve({ error, user }));
  });

describe('registerVerify', () => {
  let repositorio;
  let verify;

  beforeEach(() => {
    repositorio = crearRepositorioFalso();
    verify = registerVerify(repositorio);
  });

  it('crea el usuario y lo pasa a done sin error', async () => {
    const { error, user } = await ejecutarVerify(verify, datosValidos);

    assert.equal(error, null);
    assert.equal(user.first_name, 'Ana');
    assert.equal(user.role, 'user');
  });

  it('normaliza el email antes de guardarlo', async () => {
    const { user } = await ejecutarVerify(verify, datosValidos);

    assert.equal(user.email, 'ana@mail.com');
    assert.equal(repositorio.guardados[0].email, 'ana@mail.com');
  });

  it('guarda la contraseña hasheada y no en texto plano', async () => {
    await ejecutarVerify(verify, datosValidos);
    const guardado = repositorio.guardados[0];

    assert.notEqual(guardado.password, 'Secreta123');
    assert.match(guardado.password, /^\$2[aby]\$\d{2}\$/);
    assert.equal(await isValidPassword('Secreta123', guardado.password), true);
  });

  it('ignora el rol que venga en el body', async () => {
    const { user } = await ejecutarVerify(verify, { ...datosValidos, role: 'admin' });

    assert.equal(user.role, 'user');
    assert.equal(repositorio.guardados[0].role, 'user');
  });

  it('rechaza con 400 cuando faltan campos obligatorios', async () => {
    const { error } = await ejecutarVerify(verify, { email: 'ana@mail.com' });

    assert.equal(error.status, 400);
    assert.match(error.message, /Faltan campos obligatorios/);
  });

  it('indica cuales son los campos que faltan', async () => {
    const { error } = await ejecutarVerify(verify, { first_name: 'Ana', last_name: 'Pérez' });

    assert.match(error.message, /email, password/);
  });

  it('rechaza con 400 un email con formato invalido', async () => {
    const { error } = await ejecutarVerify(verify, { ...datosValidos, email: 'correo-invalido' });

    assert.equal(error.status, 400);
    assert.match(error.message, /formato del email/);
  });

  it('rechaza con 400 una contraseña demasiado corta', async () => {
    const { error } = await ejecutarVerify(verify, { ...datosValidos, password: 'corta' });

    assert.equal(error.status, 400);
    assert.match(error.message, /al menos 8 caracteres/);
  });

  it('rechaza con 409 un email ya registrado', async () => {
    await ejecutarVerify(verify, datosValidos);
    const { error } = await ejecutarVerify(verify, datosValidos);

    assert.equal(error.status, 409);
    assert.match(error.message, /El email ya está registrado/);
  });

  it('detecta el email duplicado aunque venga escrito distinto', async () => {
    await ejecutarVerify(verify, datosValidos);
    const { error } = await ejecutarVerify(verify, { ...datosValidos, email: '  ANA@MAIL.COM  ' });

    assert.equal(error.status, 409);
  });
});

describe('loginVerify', () => {
  let repositorio;
  let registrar;
  let verify;

  const credenciales = { email: 'ana@mail.com', password: 'Secreta123' };

  beforeEach(async () => {
    repositorio = crearRepositorioFalso();
    registrar = registerVerify(repositorio);
    verify = loginVerify(repositorio);
    await ejecutarVerify(registrar, { ...datosValidos, email: credenciales.email });
  });

  it('devuelve el usuario cuando las credenciales son correctas', async () => {
    const { error, user } = await ejecutarVerify(verify, credenciales);

    assert.equal(error, null);
    assert.equal(user.email, credenciales.email);
  });

  it('rechaza con 401 generico si el email no existe', async () => {
    const { error } = await ejecutarVerify(verify, { email: 'noexiste@mail.com', password: 'Secreta123' });

    assert.equal(error.status, 401);
    assert.match(error.message, /Credenciales inválidas/);
  });

  it('rechaza con 401 generico si la contraseña es incorrecta', async () => {
    const { error } = await ejecutarVerify(verify, { ...credenciales, password: 'ClaveEquivocada' });

    assert.equal(error.status, 401);
    assert.match(error.message, /Credenciales inválidas/);
  });

  it('rechaza con 400 cuando faltan campos obligatorios', async () => {
    const { error } = await ejecutarVerify(verify, {});

    assert.equal(error.status, 400);
    assert.match(error.message, /Faltan campos obligatorios/);
  });
});
