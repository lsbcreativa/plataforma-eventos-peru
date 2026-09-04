import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TicketsService } from '../../src/services/tickets.service.js';

const eventoPublicado = {
  organizer: 'organizer-1',
  status: 'published',
  capacity: 5,
  title: 'Congreso Tech',
  date: '2099-11-20',
  location: 'Lima'
};

/** Repositorio de tickets en memoria que imita el contrato real. */
const crearRepositorioFalso = (ticketsIniciales = []) => {
  const tickets = ticketsIniciales.map((ticket, index) => ({
    id: String(index + 1),
    status: 'confirmed',
    ...ticket
  }));

  return {
    tickets,
    createTicket: async (data) => {
      const creado = { id: String(tickets.length + 1), status: 'confirmed', ...data };
      tickets.push(creado);
      return creado;
    },
    findActiveByUserAndEvent: async (userId, eventId) =>
      tickets.find((t) => t.user === userId && t.event === eventId && t.status !== 'cancelled') || null,
    findActiveByEvent: async (eventId) => tickets.filter((t) => t.event === eventId && t.status !== 'cancelled'),
    findByEvent: async (eventId) => tickets.filter((t) => t.event === eventId),
    findByUser: async (userId) => tickets.filter((t) => t.user === userId),
    getTicketById: async (id) => tickets.find((t) => t.id === id) || null,
    cancelTicket: async (id) => {
      const index = tickets.findIndex((t) => t.id === id);
      if (index === -1) return null;
      tickets[index] = { ...tickets[index], status: 'cancelled', cancelledAt: new Date() };
      return tickets[index];
    }
  };
};

/** eventsRepository simulado: siempre devuelve el mismo evento salvo que se indique otro. */
const crearEventsRepoFalso = (evento = eventoPublicado) => ({
  getEventById: async () => evento
});

/** mailer simulado que registra los envios sin tocar la red. */
const crearMailerFalso = () => {
  const enviados = [];
  return { enviados, sendMail: async (options) => enviados.push(options) };
};

const usuario = { id: 'user-1', email: 'ana@mail.com', first_name: 'Ana', role: 'user' };

describe('TicketsService.createTicket', () => {
  let repositorio;
  let mailer;
  let service;

  beforeEach(() => {
    repositorio = crearRepositorioFalso();
    mailer = crearMailerFalso();
    service = new TicketsService(repositorio, crearEventsRepoFalso(), mailer);
  });

  it('crea el ticket confirmado y envia el email de confirmacion', async () => {
    const ticket = await service.createTicket('event-1', { quantity: 2 }, usuario);

    assert.equal(ticket.status, 'confirmed');
    assert.equal(ticket.quantity, 2);
    assert.ok(ticket.reservationCode.startsWith('TCK-'));
    assert.equal(mailer.enviados.length, 1);
    assert.equal(mailer.enviados[0].to, usuario.email);
  });

  it('usa quantity 1 por defecto si no se envia', async () => {
    const ticket = await service.createTicket('event-1', {}, usuario);

    assert.equal(ticket.quantity, 1);
  });

  it('rechaza con 404 si el evento no existe', async () => {
    service = new TicketsService(repositorio, { getEventById: async () => null }, mailer);

    await assert.rejects(
      () => service.createTicket('event-x', {}, usuario),
      (error) => {
        assert.equal(error.status, 404);
        return true;
      }
    );
  });

  it('rechaza con 409 si el evento esta cancelado', async () => {
    service = new TicketsService(repositorio, crearEventsRepoFalso({ ...eventoPublicado, status: 'cancelled' }), mailer);

    await assert.rejects(
      () => service.createTicket('event-1', {}, usuario),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });

  it('rechaza con 409 si el evento ya finalizo', async () => {
    service = new TicketsService(repositorio, crearEventsRepoFalso({ ...eventoPublicado, status: 'finished' }), mailer);

    await assert.rejects(
      () => service.createTicket('event-1', {}, usuario),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });

  it('rechaza con 409 si el evento todavia no esta publicado', async () => {
    service = new TicketsService(repositorio, crearEventsRepoFalso({ ...eventoPublicado, status: 'draft' }), mailer);

    await assert.rejects(
      () => service.createTicket('event-1', {}, usuario),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });

  it('rechaza con 400 una quantity invalida', async () => {
    await assert.rejects(
      () => service.createTicket('event-1', { quantity: 0 }, usuario),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 400 una quantity no numerica', async () => {
    await assert.rejects(
      () => service.createTicket('event-1', { quantity: 'muchas' }, usuario),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      }
    );
  });

  it('rechaza con 409 una inscripcion duplicada activa', async () => {
    await service.createTicket('event-1', {}, usuario);

    await assert.rejects(
      () => service.createTicket('event-1', {}, usuario),
      (error) => {
        assert.equal(error.status, 409);
        assert.match(error.message, /ya tenés/i);
        return true;
      }
    );
  });

  it('permite volver a inscribirse despues de cancelar', async () => {
    const primero = await service.createTicket('event-1', {}, usuario);
    await service.cancelTicket(primero.id, usuario);

    const segundo = await service.createTicket('event-1', {}, usuario);

    assert.equal(segundo.status, 'confirmed');
  });

  it('rechaza con 409 cuando no hay cupos suficientes', async () => {
    await service.createTicket('event-1', { quantity: 5 }, usuario);

    await assert.rejects(
      () => service.createTicket('event-1', { quantity: 1 }, { ...usuario, id: 'user-2', email: 'otro@mail.com' }),
      (error) => {
        assert.equal(error.status, 409);
        assert.match(error.message, /cupos suficientes/);
        return true;
      }
    );
  });

  it('un ticket cancelado no ocupa cupo para el calculo de disponibilidad', async () => {
    const primero = await service.createTicket('event-1', { quantity: 5 }, usuario);
    await service.cancelTicket(primero.id, usuario);

    const segundo = await service.createTicket(
      'event-1',
      { quantity: 5 },
      { ...usuario, id: 'user-2', email: 'otro@mail.com' }
    );

    assert.equal(segundo.status, 'confirmed');
  });

  it('la falla del mailer no rompe la creacion del ticket', async () => {
    const mailerRoto = { sendMail: async () => { throw new Error('SMTP caido'); } };
    service = new TicketsService(repositorio, crearEventsRepoFalso(), mailerRoto);

    const ticket = await service.createTicket('event-1', {}, usuario);

    assert.equal(ticket.status, 'confirmed');
  });
});

describe('TicketsService.getMyTickets', () => {
  it('devuelve solo los tickets del usuario pedido', async () => {
    const repositorio = crearRepositorioFalso([
      { user: 'user-1', event: 'event-1' },
      { user: 'user-2', event: 'event-1' }
    ]);
    const service = new TicketsService(repositorio, crearEventsRepoFalso());

    const tickets = await service.getMyTickets('user-1');

    assert.equal(tickets.length, 1);
    assert.equal(tickets[0].user, 'user-1');
  });
});

describe('TicketsService.getEventTickets', () => {
  let repositorio;

  beforeEach(() => {
    repositorio = crearRepositorioFalso([
      { user: 'user-1', event: 'event-1' },
      { user: 'user-2', event: 'event-1' }
    ]);
  });

  it('el organizer dueño del evento puede listar sus inscripciones', async () => {
    const service = new TicketsService(repositorio, crearEventsRepoFalso());

    const tickets = await service.getEventTickets('event-1', { id: 'organizer-1', role: 'organizer' });

    assert.equal(tickets.length, 2);
  });

  it('un organizer que no es dueño del evento recibe 403', async () => {
    const service = new TicketsService(repositorio, crearEventsRepoFalso());

    await assert.rejects(
      () => service.getEventTickets('event-1', { id: 'organizer-2', role: 'organizer' }),
      (error) => {
        assert.equal(error.status, 403);
        return true;
      }
    );
  });

  it('un admin puede listar las inscripciones de cualquier evento', async () => {
    const service = new TicketsService(repositorio, crearEventsRepoFalso());

    const tickets = await service.getEventTickets('event-1', { id: 'admin-1', role: 'admin' });

    assert.equal(tickets.length, 2);
  });

  it('rechaza con 404 si el evento no existe', async () => {
    const service = new TicketsService(repositorio, { getEventById: async () => null });

    await assert.rejects(
      () => service.getEventTickets('event-x', { id: 'admin-1', role: 'admin' }),
      (error) => {
        assert.equal(error.status, 404);
        return true;
      }
    );
  });
});

describe('TicketsService.cancelTicket', () => {
  let repositorio;
  let service;

  beforeEach(() => {
    repositorio = crearRepositorioFalso([{ user: 'user-1', event: 'event-1' }]);
    service = new TicketsService(repositorio, crearEventsRepoFalso());
  });

  it('el dueño puede cancelar su propio ticket', async () => {
    const cancelado = await service.cancelTicket('1', { id: 'user-1', role: 'user' });

    assert.equal(cancelado.status, 'cancelled');
    assert.ok(cancelado.cancelledAt);
  });

  it('un admin puede cancelar el ticket de cualquiera', async () => {
    const cancelado = await service.cancelTicket('1', { id: 'admin-1', role: 'admin' });

    assert.equal(cancelado.status, 'cancelled');
  });

  it('rechaza con 403 si no es el dueño ni admin', async () => {
    await assert.rejects(
      () => service.cancelTicket('1', { id: 'user-2', role: 'user' }),
      (error) => {
        assert.equal(error.status, 403);
        return true;
      }
    );
  });

  it('rechaza con 404 si el ticket no existe', async () => {
    await assert.rejects(
      () => service.cancelTicket('999', { id: 'user-1', role: 'user' }),
      (error) => {
        assert.equal(error.status, 404);
        return true;
      }
    );
  });

  it('rechaza con 409 si el ticket ya esta cancelado', async () => {
    await service.cancelTicket('1', { id: 'user-1', role: 'user' });

    await assert.rejects(
      () => service.cancelTicket('1', { id: 'user-1', role: 'user' }),
      (error) => {
        assert.equal(error.status, 409);
        return true;
      }
    );
  });
});
