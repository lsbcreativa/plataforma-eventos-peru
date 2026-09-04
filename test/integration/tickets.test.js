import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/User.js');
const { Event } = await import('../../src/models/Event.js');
const { Ticket } = await import('../../src/models/Ticket.js');
const { createHash } = await import('../../src/utils/hash.js');

let mongoServer;
let hash;

const PASSWORD = 'Secreta123';

const crearUsuario = (role, email) =>
  User.create({ first_name: 'Test', last_name: role, email, password: hash, role });

const loginComo = async (email) => {
  const agent = request.agent(app);
  const login = await agent.post('/api/sessions/login').send({ email, password: PASSWORD });
  assert.equal(login.status, 200, `login fallo para ${email}: ${JSON.stringify(login.body)}`);
  return agent;
};

/** Crea un evento publicado con la capacidad indicada, usando al agent organizador dado. */
const crearEventoPublicado = async (agentOrganizer, overrides = {}) => {
  const creado = await agentOrganizer.post('/api/events').send({
    title: 'Congreso Tech 2026',
    description: 'Charlas de IA y cloud',
    category: 'tecnologia',
    location: 'Centro de Convenciones de Lima',
    date: '2099-11-20',
    capacity: 2,
    ...overrides
  });
  const eventId = creado.body.payload.id;
  await agentOrganizer.patch(`/api/events/${eventId}/status`).send({ status: 'published' });
  return eventId;
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
  hash = await createHash(PASSWORD);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await Ticket.deleteMany({});
});

describe('POST /api/events/:id/tickets - inscripcion', () => {
  it('sin cookie responde 401', async () => {
    await crearUsuario('organizer', 'org1@mail.com');
    const organizer = await loginComo('org1@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    const response = await request(app).post(`/api/events/${eventId}/tickets`).send({});

    assert.equal(response.status, 401);
  });

  it('a un evento inexistente responde 404', async () => {
    await crearUsuario('user', 'asistente1@mail.com');
    const asistente = await loginComo('asistente1@mail.com');
    const idInexistente = new mongoose.Types.ObjectId();

    const response = await asistente.post(`/api/events/${idInexistente}/tickets`).send({});

    assert.equal(response.status, 404);
  });

  it('a un evento en borrador responde error de negocio (no 500)', async () => {
    await crearUsuario('organizer', 'org2@mail.com');
    const organizer = await loginComo('org2@mail.com');
    const creado = await organizer.post('/api/events').send({
      title: 'Sin publicar',
      description: 'desc',
      category: 'tecnologia',
      location: 'Lima',
      date: '2099-11-20',
      capacity: 5
    });

    await crearUsuario('user', 'asistente2@mail.com');
    const asistente = await loginComo('asistente2@mail.com');
    const response = await asistente.post(`/api/events/${creado.body.payload.id}/tickets`).send({});

    assert.equal(response.status, 409);
    assert.equal(response.body.status, 'error');
    assert.notEqual(response.status, 500);
  });

  it('a un evento cancelado responde error de negocio', async () => {
    await crearUsuario('organizer', 'org3@mail.com');
    const organizer = await loginComo('org3@mail.com');
    const eventId = await crearEventoPublicado(organizer);
    await organizer.patch(`/api/events/${eventId}/status`).send({ status: 'cancelled' });

    await crearUsuario('user', 'asistente3@mail.com');
    const asistente = await loginComo('asistente3@mail.com');
    const response = await asistente.post(`/api/events/${eventId}/tickets`).send({});

    assert.equal(response.status, 409);
  });

  it('exitosa responde 201 con reservationCode y status confirmed', async () => {
    await crearUsuario('organizer', 'org4@mail.com');
    const organizer = await loginComo('org4@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'asistente4@mail.com');
    const asistente = await loginComo('asistente4@mail.com');
    const response = await asistente.post(`/api/events/${eventId}/tickets`).send({ quantity: 1 });

    assert.equal(response.status, 201);
    assert.equal(response.body.payload.status, 'confirmed');
    assert.ok(response.body.payload.reservationCode.startsWith('TCK-'));
    assert.equal(response.body.payload.event, eventId);
  });

  it('duplicada (mismo usuario, mismo evento) responde error', async () => {
    await crearUsuario('organizer', 'org5@mail.com');
    const organizer = await loginComo('org5@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'asistente5@mail.com');
    const asistente = await loginComo('asistente5@mail.com');
    await asistente.post(`/api/events/${eventId}/tickets`).send({});

    const response = await asistente.post(`/api/events/${eventId}/tickets`).send({});

    assert.equal(response.status, 409);
  });

  it('sin cupo suficiente responde error con mensaje claro', async () => {
    await crearUsuario('organizer', 'org6@mail.com');
    const organizer = await loginComo('org6@mail.com');
    const eventId = await crearEventoPublicado(organizer, { capacity: 1 });

    await crearUsuario('user', 'asistente6a@mail.com');
    const primero = await loginComo('asistente6a@mail.com');
    await primero.post(`/api/events/${eventId}/tickets`).send({});

    await crearUsuario('user', 'asistente6b@mail.com');
    const segundo = await loginComo('asistente6b@mail.com');
    const response = await segundo.post(`/api/events/${eventId}/tickets`).send({});

    assert.equal(response.status, 409);
    assert.match(response.body.message, /cupos suficientes/);
  });
});

describe('GET /api/tickets/my-tickets', () => {
  it('devuelve solo los tickets propios, con datos del evento via populate', async () => {
    await crearUsuario('organizer', 'org7@mail.com');
    const organizer = await loginComo('org7@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'asistente7a@mail.com');
    const asistente1 = await loginComo('asistente7a@mail.com');
    await asistente1.post(`/api/events/${eventId}/tickets`).send({});

    await crearUsuario('user', 'asistente7b@mail.com');
    const asistente2 = await loginComo('asistente7b@mail.com');
    await asistente2.post(`/api/events/${eventId}/tickets`).send({});

    const response = await asistente1.get('/api/tickets/my-tickets');

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.length, 1);
    assert.equal(response.body.payload[0].event.title, 'Congreso Tech 2026');
    assert.ok(response.body.payload[0].event.date);
    assert.ok(response.body.payload[0].event.location);
    assert.ok(!JSON.stringify(response.body).includes('asistente7b@mail.com'));
  });

  it('sin cookie responde 401', async () => {
    const response = await request(app).get('/api/tickets/my-tickets');

    assert.equal(response.status, 401);
  });
});

describe('GET /api/events/:id/tickets', () => {
  it('como user comun responde 403', async () => {
    await crearUsuario('organizer', 'org8@mail.com');
    const organizer = await loginComo('org8@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'asistente8@mail.com');
    const asistente = await loginComo('asistente8@mail.com');
    const response = await asistente.get(`/api/events/${eventId}/tickets`);

    assert.equal(response.status, 403);
  });

  it('como organizer de otro evento responde 403', async () => {
    await crearUsuario('organizer', 'org9a@mail.com');
    const organizerDueno = await loginComo('org9a@mail.com');
    const eventId = await crearEventoPublicado(organizerDueno);

    await crearUsuario('organizer', 'org9b@mail.com');
    const otroOrganizer = await loginComo('org9b@mail.com');
    const response = await otroOrganizer.get(`/api/events/${eventId}/tickets`);

    assert.equal(response.status, 403);
  });

  it('como organizer dueño del evento responde 200 con las inscripciones', async () => {
    await crearUsuario('organizer', 'org10@mail.com');
    const organizer = await loginComo('org10@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'asistente10@mail.com');
    const asistente = await loginComo('asistente10@mail.com');
    await asistente.post(`/api/events/${eventId}/tickets`).send({});

    const response = await organizer.get(`/api/events/${eventId}/tickets`);

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.length, 1);
  });

  it('como admin responde 200 sin importar quien organiza', async () => {
    await crearUsuario('organizer', 'org11@mail.com');
    const organizer = await loginComo('org11@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('admin', 'admin11@mail.com');
    const admin = await loginComo('admin11@mail.com');
    const response = await admin.get(`/api/events/${eventId}/tickets`);

    assert.equal(response.status, 200);
  });
});

describe('PATCH /api/tickets/:tid/cancel', () => {
  it('el dueño puede cancelar su propio ticket y libera el cupo', async () => {
    await crearUsuario('organizer', 'org12@mail.com');
    const organizer = await loginComo('org12@mail.com');
    const eventId = await crearEventoPublicado(organizer, { capacity: 1 });

    await crearUsuario('user', 'asistente12a@mail.com');
    const primero = await loginComo('asistente12a@mail.com');
    const ticket = await primero.post(`/api/events/${eventId}/tickets`).send({});

    const cancelacion = await primero.patch(`/api/tickets/${ticket.body.payload.id}/cancel`);
    assert.equal(cancelacion.status, 200);
    assert.equal(cancelacion.body.payload.status, 'cancelled');
    assert.ok(cancelacion.body.payload.cancelledAt);

    await crearUsuario('user', 'asistente12b@mail.com');
    const segundo = await loginComo('asistente12b@mail.com');
    const nuevaInscripcion = await segundo.post(`/api/events/${eventId}/tickets`).send({});

    assert.equal(nuevaInscripcion.status, 201);
  });

  it('cancelar un ticket ajeno como user responde 403', async () => {
    await crearUsuario('organizer', 'org13@mail.com');
    const organizer = await loginComo('org13@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'dueno13@mail.com');
    const dueno = await loginComo('dueno13@mail.com');
    const ticket = await dueno.post(`/api/events/${eventId}/tickets`).send({});

    await crearUsuario('user', 'intruso13@mail.com');
    const intruso = await loginComo('intruso13@mail.com');
    const response = await intruso.patch(`/api/tickets/${ticket.body.payload.id}/cancel`);

    assert.equal(response.status, 403);
  });

  it('un admin puede cancelar el ticket de cualquiera', async () => {
    await crearUsuario('organizer', 'org14@mail.com');
    const organizer = await loginComo('org14@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'dueno14@mail.com');
    const dueno = await loginComo('dueno14@mail.com');
    const ticket = await dueno.post(`/api/events/${eventId}/tickets`).send({});

    await crearUsuario('admin', 'admin14@mail.com');
    const admin = await loginComo('admin14@mail.com');
    const response = await admin.patch(`/api/tickets/${ticket.body.payload.id}/cancel`);

    assert.equal(response.status, 200);
  });

  it('cancelar un ticket ya cancelado responde error', async () => {
    await crearUsuario('organizer', 'org15@mail.com');
    const organizer = await loginComo('org15@mail.com');
    const eventId = await crearEventoPublicado(organizer);

    await crearUsuario('user', 'dueno15@mail.com');
    const dueno = await loginComo('dueno15@mail.com');
    const ticket = await dueno.post(`/api/events/${eventId}/tickets`).send({});
    await dueno.patch(`/api/tickets/${ticket.body.payload.id}/cancel`);

    const response = await dueno.patch(`/api/tickets/${ticket.body.payload.id}/cancel`);

    assert.equal(response.status, 409);
  });

  it('cancelar un ticket inexistente responde 404', async () => {
    await crearUsuario('user', 'dueno16@mail.com');
    const dueno = await loginComo('dueno16@mail.com');
    const idInexistente = new mongoose.Types.ObjectId();

    const response = await dueno.patch(`/api/tickets/${idInexistente}/cancel`);

    assert.equal(response.status, 404);
  });

  it('sin cookie responde 401', async () => {
    const idInexistente = new mongoose.Types.ObjectId();

    const response = await request(app).patch(`/api/tickets/${idInexistente}/cancel`);

    assert.equal(response.status, 401);
  });
});
