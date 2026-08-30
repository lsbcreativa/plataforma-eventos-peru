import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventsService } from '../../src/services/events.service.js';

const eventoValido = {
  title: 'Congreso Tech',
  description: 'Un congreso de tecnologia',
  category: 'tecnologia',
  location: 'Centro de convenciones',
  date: '2099-11-20',
  capacity: 50
};

/** Repositorio en memoria que imita el contrato real, para probar la logica aislada. */
const crearRepositorioFalso = (eventosIniciales = []) => {
  const eventos = eventosIniciales.map((evento, index) => ({ id: String(index + 1), ...evento }));

  const aplicaFiltro = (evento, filter) =>
    Object.entries(filter).every(([key, value]) => {
      if (key === 'date' && value && typeof value === 'object') {
        const fecha = new Date(evento.date).getTime();
        if (value.$gte && fecha < new Date(value.$gte).getTime()) return false;
        if (value.$lte && fecha > new Date(value.$lte).getTime()) return false;
        return true;
      }
      return evento[key] === value;
    });

  return {
    eventos,
    findEvents: async (filter = {}, { skip = 0, limit = 10 } = {}) =>
      eventos.filter((evento) => aplicaFiltro(evento, filter)).slice(skip, skip + limit),
    countEvents: async (filter = {}) => eventos.filter((evento) => aplicaFiltro(evento, filter)).length,
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

describe('EventsService.getEvents', () => {
  let service;

  beforeEach(() => {
    service = new EventsService(
      crearRepositorioFalso([
        { title: 'A', category: 'tecnologia', location: 'Lima', status: 'published', date: '2099-01-10' },
        { title: 'B', category: 'cultura', location: 'Cusco', status: 'draft', date: '2099-02-10' },
        { title: 'C', category: 'tecnologia', location: 'Lima', status: 'published', date: '2099-03-10' }
      ])
    );
  });

  it('devuelve data, page, limit, total y totalPages', async () => {
    const resultado = await service.getEvents();

    assert.equal(resultado.data.length, 3);
    assert.equal(resultado.page, 1);
    assert.equal(resultado.limit, 10);
    assert.equal(resultado.total, 3);
    assert.equal(resultado.totalPages, 1);
  });

  it('filtra por status', async () => {
    const resultado = await service.getEvents({ status: 'published' });

    assert.equal(resultado.total, 2);
    assert.ok(resultado.data.every((evento) => evento.status === 'published'));
  });

  it('filtra por category y location combinados', async () => {
    const resultado = await service.getEvents({ category: 'tecnologia', location: 'Lima' });

    assert.equal(resultado.total, 2);
  });

  it('pagina los resultados', async () => {
    const pagina1 = await service.getEvents({ limit: 2, page: 1 });
    const pagina2 = await service.getEvents({ limit: 2, page: 2 });

    assert.equal(pagina1.data.length, 2);
    assert.equal(pagina2.data.length, 1);
    assert.equal(pagina1.totalPages, 2);
  });

  it('devuelve totalPages en 0 cuando no hay resultados', async () => {
    const resultado = await service.getEvents({ category: 'inexistente' });

    assert.deepEqual(resultado.data, []);
    assert.equal(resultado.totalPages, 0);
  });

  it('ignora parametros de query que no son filtros validos', async () => {
    const resultado = await service.getEvents({ hackeo: 'x' });

    assert.equal(resultado.total, 3);
  });
});

describe('EventsService.createEvent', () => {
  let service;

  beforeEach(() => {
    service = new EventsService(crearRepositorioFalso());
  });

  it('crea el evento asignando el organizer recibido y status draft por defecto del modelo', async () => {
    const evento = await service.createEvent(eventoValido, 'organizer-1');

    assert.equal(evento.organizer, 'organizer-1');
    assert.equal(evento.title, 'Congreso Tech');
    assert.equal(evento.price, 0);
    assert.equal(evento.status, undefined); // el status por defecto lo asigna el modelo de Mongoose, no el service
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

  it('rechaza con 400 un precio negativo', async () => {
    await assert.rejects(
      () => service.createEvent({ ...eventoValido, price: -10 }, 'organizer-1'),
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

  it('rechaza con 400 una fecha pasada', async () => {
    await assert.rejects(
      () => service.createEvent({ ...eventoValido, date: '2000-01-01' }, 'organizer-1'),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /pasado/);
        return true;
      }
    );
  });

  it('ignora el organizer que venga en el body: usa el recibido por parametro', async () => {
    const evento = await service.createEvent({ ...eventoValido, organizer: 'inyectado' }, 'organizer-1');

    assert.equal(evento.organizer, 'organizer-1');
  });
});

describe('EventsService.updateEvent', () => {
  let service;
  let repositorio;

  beforeEach(() => {
    repositorio = crearRepositorioFalso([
      { title: 'Original', organizer: 'organizer-1', status: 'draft', capacity: 10, price: 0 }
    ]);
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

  it('no permite reasignar el organizer, el id ni el status del evento', async () => {
    const actualizado = await service.updateEvent(
      '1',
      { organizer: 'otro-id', id: '999', status: 'cancelled' },
      { id: 'organizer-1', role: 'organizer' }
    );

    assert.equal(actualizado.organizer, 'organizer-1');
    assert.equal(actualizado.id, '1');
    assert.equal(actualizado.status, 'draft');
  });

  it('rechaza con 400 una capacidad invalida', async () => {
    await assert.rejects(
      () => service.updateEvent('1', { capacity: -1 }, { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 409 si el evento ya esta cancelado', async () => {
    repositorio.eventos[0].status = 'cancelled';

    await assert.rejects(
      () => service.updateEvent('1', { title: 'Intento' }, { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });
});

describe('EventsService.changeStatus', () => {
  let service;
  let repositorio;

  beforeEach(() => {
    repositorio = crearRepositorioFalso([{ title: 'Evento', organizer: 'organizer-1', status: 'draft' }]);
    service = new EventsService(repositorio);
  });

  it('permite al dueño publicar su propio evento en borrador', async () => {
    const actualizado = await service.changeStatus('1', 'published', { id: 'organizer-1', role: 'organizer' });

    assert.equal(actualizado.status, 'published');
  });

  it('rechaza con 403 si el organizer no es el dueño', async () => {
    await assert.rejects(
      () => service.changeStatus('1', 'published', { id: 'organizer-2', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 403);
        return true;
      }
    );
  });

  it('permite al admin cambiar el status de cualquier evento', async () => {
    const actualizado = await service.changeStatus('1', 'cancelled', { id: 'admin-1', role: 'admin' });

    assert.equal(actualizado.status, 'cancelled');
  });

  it('rechaza con 400 un status que no existe', async () => {
    await assert.rejects(
      () => service.changeStatus('1', 'archivado', { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 400 publicar un evento finalizado', async () => {
    repositorio.eventos[0].status = 'finished';

    await assert.rejects(
      () => service.changeStatus('1', 'published', { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 409 cambiar el status de un evento ya cancelado', async () => {
    repositorio.eventos[0].status = 'cancelled';

    await assert.rejects(
      () => service.changeStatus('1', 'finished', { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });

  it('rechaza con 404 si el evento no existe', async () => {
    await assert.rejects(
      () => service.changeStatus('999', 'published', { id: 'organizer-1', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 404);
        return true;
      }
    );
  });
});
