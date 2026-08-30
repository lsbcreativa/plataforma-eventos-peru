import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventsDao } from '../../src/dao/events.dao.js';

describe('EventsDao', () => {
  let dao;

  beforeEach(() => {
    dao = new EventsDao();
  });

  it('arranca sin eventos cargados', async () => {
    assert.deepEqual(await dao.getAll(), []);
  });

  it('crea un evento y le asigna un id', async () => {
    const creado = await dao.create({ title: 'Congreso Tech Lima', city: 'Lima' });

    assert.ok(creado.id);
    assert.equal(creado.title, 'Congreso Tech Lima');
    assert.equal((await dao.getAll()).length, 1);
  });

  it('recupera un evento por su id', async () => {
    const creado = await dao.create({ title: 'Feria Gastronomica', city: 'Arequipa' });

    assert.deepEqual(await dao.getById(creado.id), creado);
  });

  it('devuelve null cuando el id no existe', async () => {
    assert.equal(await dao.getById('999'), null);
  });

  it('filtra los eventos por los campos recibidos', async () => {
    await dao.create({ title: 'Congreso Tech', city: 'Lima', category: 'tecnologia' });
    await dao.create({ title: 'Festival Inti Raymi', city: 'Cusco', category: 'cultura' });

    const enLima = await dao.getAll({ city: 'Lima' });

    assert.equal(enLima.length, 1);
    assert.equal(enLima[0].city, 'Lima');
  });

  it('devuelve todos los eventos cuando no se pasa filtro', async () => {
    await dao.create({ title: 'Evento A', city: 'Lima' });
    await dao.create({ title: 'Evento B', city: 'Cusco' });

    assert.equal((await dao.getAll()).length, 2);
  });

  it('actualiza un evento existente', async () => {
    const creado = await dao.create({ title: 'Original', city: 'Lima' });

    const actualizado = await dao.update(creado.id, { title: 'Actualizado' });

    assert.equal(actualizado.title, 'Actualizado');
    assert.equal(actualizado.city, 'Lima');
    assert.equal((await dao.getById(creado.id)).title, 'Actualizado');
  });

  it('devuelve null al actualizar un id inexistente', async () => {
    assert.equal(await dao.update('999', { title: 'x' }), null);
  });

  it('elimina un evento existente y lo devuelve', async () => {
    const creado = await dao.create({ title: 'A borrar', city: 'Lima' });

    const eliminado = await dao.remove(creado.id);

    assert.equal(eliminado.title, 'A borrar');
    assert.equal(await dao.getById(creado.id), null);
    assert.equal((await dao.getAll()).length, 0);
  });

  it('devuelve null al eliminar un id inexistente', async () => {
    assert.equal(await dao.remove('999'), null);
  });

  it('eliminar un evento no afecta a los demas', async () => {
    const uno = await dao.create({ title: 'Uno' });
    const dos = await dao.create({ title: 'Dos' });

    await dao.remove(uno.id);

    assert.deepEqual(await dao.getAll(), [dos]);
  });
});
