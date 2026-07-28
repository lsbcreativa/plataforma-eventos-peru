import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventsService } from '../../src/services/events.service.js';
import { EventsRepository } from '../../src/repositories/events.repository.js';
import { EventsDao } from '../../src/dao/events.dao.js';

describe('EventsService con las capas reales', () => {
  let service;
  let dao;

  beforeEach(async () => {
    dao = new EventsDao();
    service = new EventsService(new EventsRepository(dao));

    await dao.create({ title: 'Congreso Tech', city: 'Lima', category: 'tecnologia' });
    await dao.create({ title: 'Mistura', city: 'Lima', category: 'gastronomia' });
    await dao.create({ title: 'Inti Raymi', city: 'Cusco', category: 'cultura' });
  });

  it('devuelve todos los eventos cuando no hay query', async () => {
    assert.equal((await service.getEvents()).length, 3);
  });

  it('filtra por ciudad', async () => {
    const resultado = await service.getEvents({ city: 'Lima' });

    assert.equal(resultado.length, 2);
    assert.ok(resultado.every((evento) => evento.city === 'Lima'));
  });

  it('filtra por categoria', async () => {
    const resultado = await service.getEvents({ category: 'cultura' });

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].title, 'Inti Raymi');
  });

  it('combina ciudad y categoria', async () => {
    const resultado = await service.getEvents({ city: 'Lima', category: 'gastronomia' });

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].title, 'Mistura');
  });

  it('devuelve lista vacia si ningun evento coincide', async () => {
    assert.deepEqual(await service.getEvents({ city: 'Trujillo' }), []);
  });
});

describe('EventsService con un repositorio simulado', () => {
  it('ignora los parametros de query que no son filtros validos', async () => {
    let filtroRecibido;
    const repositorioFalso = {
      getEvents: async (filter) => {
        filtroRecibido = filter;
        return [];
      }
    };
    const service = new EventsService(repositorioFalso);

    await service.getEvents({ city: 'Lima', limit: '10', hackeo: 'x' });

    assert.deepEqual(filtroRecibido, { city: 'Lima' });
  });

  it('delega la busqueda por id en el repositorio', async () => {
    let idRecibido;
    const repositorioFalso = {
      getEventById: async (id) => {
        idRecibido = id;
        return null;
      }
    };
    const service = new EventsService(repositorioFalso);

    await service.getEventById('42');

    assert.equal(idRecibido, '42');
  });
});
