import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toUserDTO } from '../../src/dto/user.dto.js';
import { toCurrentUserDTO } from '../../src/dto/session.dto.js';
import { toEventDTO } from '../../src/dto/event.dto.js';
import { toTicketDTO } from '../../src/dto/ticket.dto.js';

describe('toUserDTO', () => {
  it('nunca expone el password, aunque venga en el documento', () => {
    const dto = toUserDTO({
      _id: '665f28f19c1d4e5f6a7b8c91',
      first_name: 'Ana',
      last_name: 'Pérez',
      email: 'ana@mail.com',
      password: '$2b$10$hashsecreto',
      role: 'user'
    });

    assert.deepEqual(Object.keys(dto).sort(), ['email', 'first_name', 'id', 'last_name', 'role']);
    assert.equal(dto.password, undefined);
  });

  it('devuelve null si no hay usuario', () => {
    assert.equal(toUserDTO(null), null);
  });
});

describe('toCurrentUserDTO', () => {
  it('devuelve solo id, email y role a partir del payload del JWT', () => {
    const dto = toCurrentUserDTO({ id: '1', email: 'ana@mail.com', role: 'user', iat: 123, exp: 456 });

    assert.deepEqual(dto, { id: '1', email: 'ana@mail.com', role: 'user' });
  });
});

describe('toEventDTO', () => {
  it('expone solo los campos conocidos del evento (allowlist)', () => {
    const dto = toEventDTO({
      _id: '665f2a3b9c1d4e5f6a7b8c9d',
      title: 'Congreso Tech',
      description: 'desc',
      category: 'tecnologia',
      location: 'Lima',
      date: new Date('2099-01-01'),
      capacity: 50,
      price: 0,
      status: 'draft',
      organizer: '665f28f19c1d4e5f6a7b8c91',
      campoInesperado: 'no deberia salir'
    });

    assert.equal(dto.id, '665f2a3b9c1d4e5f6a7b8c9d');
    assert.equal(dto.campoInesperado, undefined);
  });
});

describe('toTicketDTO', () => {
  it('con event sin popular, lo deja como id string', () => {
    const dto = toTicketDTO({
      _id: '1',
      user: '665f28f19c1d4e5f6a7b8c91',
      event: '665f2a3b9c1d4e5f6a7b8c9d',
      status: 'confirmed',
      quantity: 1,
      reservationCode: 'TCK-ABCD1234'
    });

    assert.equal(dto.event, '665f2a3b9c1d4e5f6a7b8c9d');
    assert.equal(dto.user, '665f28f19c1d4e5f6a7b8c91');
  });

  it('con event poblado, expone solo title/date/location', () => {
    const dto = toTicketDTO({
      _id: '1',
      user: '665f28f19c1d4e5f6a7b8c91',
      event: {
        title: 'Congreso Tech',
        date: new Date('2099-01-01'),
        location: 'Lima',
        capacity: 50,
        price: 0
      },
      status: 'confirmed',
      quantity: 1,
      reservationCode: 'TCK-ABCD1234'
    });

    assert.deepEqual(Object.keys(dto.event).sort(), ['date', 'location', 'title']);
  });

  it('con user poblado que trae password, nunca lo expone', () => {
    const dto = toTicketDTO({
      _id: '1',
      user: {
        _id: '665f28f19c1d4e5f6a7b8c91',
        first_name: 'Ana',
        last_name: 'Pérez',
        email: 'ana@mail.com',
        password: '$2b$10$hashsecreto',
        role: 'user'
      },
      event: '665f2a3b9c1d4e5f6a7b8c9d',
      status: 'confirmed',
      quantity: 1,
      reservationCode: 'TCK-ABCD1234'
    });

    assert.equal(dto.user.password, undefined);
    assert.equal(dto.user.email, 'ana@mail.com');
    assert.ok(!JSON.stringify(dto).includes('hashsecreto'));
  });
});
