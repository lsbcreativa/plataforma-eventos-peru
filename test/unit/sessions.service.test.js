import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SessionsService } from '../../src/services/sessions.service.js';
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

describe('SessionsService.register', () => {
  let repositorio;
  let service;

  beforeEach(() => {
    repositorio = crearRepositorioFalso();
    service = new SessionsService(repositorio);
  });

  it('registra un usuario y devuelve sus datos publicos', async () => {
    const resultado = await service.register(datosValidos);

    assert.deepEqual(Object.keys(resultado).sort(), ['email', 'first_name', 'id', 'last_name', 'role']);
    assert.equal(resultado.first_name, 'Ana');
    assert.equal(resultado.role, 'user');
  });

  it('nunca devuelve la contraseña en la respuesta', async () => {
    const resultado = await service.register(datosValidos);

    assert.equal(resultado.password, undefined);
    assert.ok(!JSON.stringify(resultado).includes('Secreta123'));
  });

  it('normaliza el email antes de guardarlo', async () => {
    const resultado = await service.register(datosValidos);

    assert.equal(resultado.email, 'ana@mail.com');
    assert.equal(repositorio.guardados[0].email, 'ana@mail.com');
  });

  it('guarda la contraseña hasheada y no en texto plano', async () => {
    await service.register(datosValidos);
    const guardado = repositorio.guardados[0];

    assert.notEqual(guardado.password, 'Secreta123');
    assert.match(guardado.password, /^\$2[aby]\$\d{2}\$/);
    assert.equal(await isValidPassword('Secreta123', guardado.password), true);
  });

  it('ignora el rol que venga en el body', async () => {
    const resultado = await service.register({ ...datosValidos, role: 'admin' });

    assert.equal(resultado.role, 'user');
    assert.equal(repositorio.guardados[0].role, 'user');
  });

  it('ignora cualquier campo extra que llegue en el body', async () => {
    await service.register({ ...datosValidos, isAdmin: true, _id: 'inyectado' });

    assert.equal(repositorio.guardados[0].isAdmin, undefined);
    assert.notEqual(repositorio.guardados[0]._id, 'inyectado');
  });
});

describe('SessionsService.register - validaciones', () => {
  let service;

  beforeEach(() => {
    service = new SessionsService(crearRepositorioFalso());
  });

  const esperarError = async (data, status, patron) => {
    await assert.rejects(
      () => service.register(data),
      (error) => {
        assert.equal(error.status, status);
        assert.match(error.message, patron);
        return true;
      }
    );
  };

  it('rechaza con 400 cuando faltan campos obligatorios', async () => {
    await esperarError({ email: 'ana@mail.com' }, 400, /Faltan campos obligatorios/);
  });

  it('indica cuales son los campos que faltan', async () => {
    await esperarError({ first_name: 'Ana', last_name: 'Pérez' }, 400, /email, password/);
  });

  it('rechaza con 400 un email con formato invalido', async () => {
    await esperarError({ ...datosValidos, email: 'correo-invalido' }, 400, /formato del email/);
  });

  it('rechaza con 400 una contraseña demasiado corta', async () => {
    await esperarError({ ...datosValidos, password: 'corta' }, 400, /al menos 8 caracteres/);
  });

  it('rechaza con 409 un email ya registrado', async () => {
    await service.register(datosValidos);

    await esperarError(datosValidos, 409, /El email ya está registrado/);
  });

  it('detecta el email duplicado aunque venga escrito distinto', async () => {
    await service.register(datosValidos);

    await esperarError({ ...datosValidos, email: '  ANA@MAIL.COM  ' }, 409, /ya está registrado/);
  });

  it('no falla si se llama sin ningun dato', async () => {
    await esperarError(undefined, 400, /Faltan campos obligatorios/);
  });
});
