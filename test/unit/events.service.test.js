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

/** Repositorio en memoria que imita el contrato real, para probar create/update aislado. */
const crearRepositorioFalso = (eventosIniciales = []) => {
  const eventos = [...eventosIniciales];

  return {
    eventos,
    createEvent: async (data) => {
      const creado = { id: String(eventos.length + 1), ...data };
      eventos.push(creado);
      return creado;
    },
    getEventById: async (id) => eventos.find((evento) => evento.id === id) || null,
    updateEvent: async (id, changes) => {
      const index = eventos.findIndex((evento) => evento.id === id);
      if (index === -1) return null;
      eventos[index] = { ...eventos[index], ...changes };
      return eventos[index];
    }
  };
};

describe('EventsService.createEvent', () => {
  let service;

  const eventoValido = {
    title: 'Congreso Tech',
    description: 'Un congreso de tecnologia',
    venue: 'Centro de convenciones',
    date: '2026-11-20',
    capacity: 50
  };

  beforeEach(() => {
    service = new EventsService(crearRepositorioFalso());
  });

  it('crea el evento asignando el organizer recibido', async () => {
    const evento = await service.createEvent(eventoValido, 'organizer-1');

    assert.equal(evento.organizer, 'organizer-1');
    assert.equal(evento.title, 'Congreso Tech');
    assert.equal(evento.status, 'publicado');
    assert.equal(evento.availableSeats, 50);
  });

  it('rechaza con 400 cuando faltan campos obligatorios', async () => {
    await assert.rejects(
      () => service.createEvent({ title: 'Solo titulo' }, 'organizer-1'),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /Faltan campos obligatorios/);
        return true;
      }
    );
  });

  it('rechaza con 400 una capacidad invalida', async () => {
    await assert.rejects(
      () => service.createEvent({ ...eventoValido, capacity: 0 }, 'organizer-1'),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 400 una fecha invalida', async () => {
    await assert.rejects(
      () => service.createEvent({ ...eventoValido, date: 'no-es-una-fecha' }, 'organizer-1'),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });
});

describe('EventsService.updateEvent', () => {
  let service;
  let repositorio;

  beforeEach(() => {
    repositorio = crearRepositorioFalso([{ id: '1', title: 'Original', organizer: 'organizer-1' }]);
    service = new EventsService(repositorio);
  });

  it('permite al dueño modificar su propio evento', async () => {
    const actualizado = await service.updateEvent('1', { title: 'Nuevo' }, {
      id: 'organizer-1',
      role: 'organizer'
    });

    assert.equal(actualizado.title, 'Nuevo');
  });

  it('rechaza con 403 si el organizer no es el dueño', async () => {
    await assert.rejects(
      () => service.updateEvent('1', { title: 'Hackeado' }, { id: 'organizer-2', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 403);
        return true;
      }
    );
  });

  it('permite al admin modificar cualquier evento', async () => {
    const actualizado = await service.updateEvent('1', { title: 'Editado por admin' }, {
      id: 'admin-1',
      role: 'admin'
    });

    assert.equal(actualizado.title, 'Editado por admin');
  });

  it('rechaza con 404 si el evento no existe', async () => {
    await assert.rejects(
      () => service.updateEvent('999', {}, { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 404);
        return true;
      }
    );
  });

  it('no permite reasignar el organizer del evento', async () => {
    const actualizado = await service.updateEvent('1', { organizer: 'otro-id' }, {
      id: 'organizer-1',
      role: 'organizer'
    });

    assert.equal(actualizado.organizer, 'organizer-1');
  });
});
