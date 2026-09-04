import { ticketsDao } from '../dao/tickets.dao.js';

export class TicketsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async createTicket(data) {
    return this.dao.create(data);
  }

  async findActiveByUserAndEvent(userId, eventId) {
    return this.dao.findActiveByUserAndEvent(userId, eventId);
  }

  async findActiveByEvent(eventId) {
    return this.dao.findActiveByEvent(eventId);
  }

  async findByEvent(eventId) {
    return this.dao.findByEvent(eventId);
  }

  async findByUser(userId) {
    return this.dao.findByUser(userId);
  }

  async getTicketById(id) {
    return this.dao.getById(id);
  }

  async cancelTicket(id) {
    return this.dao.cancel(id);
  }
}

export const ticketsRepository = new TicketsRepository(ticketsDao);

export default ticketsRepository;
