import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'clave-de-prueba-para-los-tests';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../../src/app.js');
const { Event } = await import('../../src/models/Event.js');

let mongoServer;
let organizerId;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  organizerId = new mongoose.Types.ObjectId();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Event.deleteMany({});
});

const crearEvento = (overrides = {}) =>
  Event.create({
    title: 'Congreso Tech',
    description: 'Charlas de tecnologia',
    category: 'tecnologia',
    location: 'Lima',
    date: new Date('2099-01-01'),
    capacity: 50,
    organizer: organizerId,
    ...overrides
  });

describe('GET /api/events', () => {
  it('responde 200 con data, page, limit, total y totalPages', async () => {
    const response = await request(app).get('/api/events');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'success');
    assert.deepEqual(response.body.payload, { data: [], page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it('lista los eventos creados', async () => {
    await crearEvento({ title: 'Uno' });
    await crearEvento({ title: 'Dos' });

    const response = await request(app).get('/api/events');

    assert.equal(response.body.payload.total, 2);
    assert.equal(response.body.payload.data.length, 2);
  });

  it('filtra por category', async () => {
    await crearEvento({ category: 'tecnologia' });
    await crearEvento({ category: 'cultura' });

    const response = await request(app).get('/api/events?category=cultura');

    assert.equal(response.body.payload.total, 1);
    assert.equal(response.body.payload.data[0].category, 'cultura');
  });

  it('filtra por status', async () => {
    await crearEvento({ status: 'published' });
    await crearEvento({ status: 'draft' });

    const response = await request(app).get('/api/events?status=published');

    assert.equal(response.body.payload.total, 1);
    assert.equal(response.body.payload.data[0].status, 'published');
  });

  it('filtra por location', async () => {
    await crearEvento({ location: 'Lima' });
    await crearEvento({ location: 'Cusco' });

    const response = await request(app).get('/api/events?location=Cusco');

    assert.equal(response.body.payload.total, 1);
  });

  it('filtra por rango de fechas', async () => {
    await crearEvento({ date: new Date('2099-01-01') });
    await crearEvento({ date: new Date('2099-06-01') });

    const response = await request(app).get('/api/events?dateFrom=2099-03-01');

    assert.equal(response.body.payload.total, 1);
  });

  it('combina varios filtros con page y limit, como pide el enunciado', async () => {
    await crearEvento({ category: 'workshop', status: 'published' });
    await crearEvento({ category: 'workshop', status: 'draft' });
    await crearEvento({ category: 'otra', status: 'published' });

    const response = await request(app).get('/api/events?status=published&category=workshop&page=1&limit=5');

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.total, 1);
    assert.equal(response.body.payload.page, 1);
    assert.equal(response.body.payload.limit, 5);
  });

  it('pagina y ordena los resultados', async () => {
    for (let i = 1; i <= 7; i += 1) {
      await crearEvento({ title: `Evento ${i}`, date: new Date(`2099-0${i}-01`) });
    }

    const response = await request(app).get('/api/events?page=2&limit=5&sort=date');

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.page, 2);
    assert.equal(response.body.payload.limit, 5);
    assert.equal(response.body.payload.total, 7);
    assert.equal(response.body.payload.totalPages, 2);
    assert.equal(response.body.payload.data.length, 2);
    assert.equal(response.body.payload.data[0].title, 'Evento 6');
  });
});

describe('GET /api/events/:id', () => {
  it('devuelve el evento por id', async () => {
    const creado = await crearEvento();

    const response = await request(app).get(`/api/events/${creado._id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.payload.title, 'Congreso Tech');
  });

  it('responde 404 cuando el evento no existe (id con formato valido)', async () => {
    const idInexistente = new mongoose.Types.ObjectId();

    const response = await request(app).get(`/api/events/${idInexistente}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.status, 'error');
    assert.equal(response.body.message, 'Evento no encontrado');
  });

  it('responde 404 cuando el id no tiene formato valido', async () => {
    const response = await request(app).get('/api/events/inexistente');

    assert.equal(response.status, 404);
  });
});
