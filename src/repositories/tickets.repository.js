import { ticketsDao } from '../dao/tickets.dao.js';

const ACTIVE_FILTER = { status: { $ne: 'cancelled' } };
const MY_TICKETS_POPULATE = { path: 'event', select: 'title date location -_id' };

export class TicketsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async createTicket(data) {
    return this.dao.create(data);
  }

  /** Un ticket "activo" es cualquiera que no este cancelado (confirmed o pending). */
  async findActiveByUserAndEvent(userId, eventId) {
    return this.dao.findOne({ user: userId, event: eventId, ...ACTIVE_FILTER });
  }

  /** Cupos ocupados: suma de quantity de los tickets activos de un evento. */
  async countActiveTickets(eventId) {
    const activeTickets = await this.dao.find({ event: eventId, ...ACTIVE_FILTER });
    return activeTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }

  async findByEvent(eventId) {
    return this.dao.find({ event: eventId }, { sort: { createdAt: -1 } });
  }

  /** Los tickets de un usuario, con los datos del evento (solo title/date/location). */
  async findByUser(userId) {
    return this.dao.find({ user: userId }, { sort: { createdAt: -1 }, populate: MY_TICKETS_POPULATE });
  }

  async getTicketById(id) {
    return this.dao.findById(id);
  }

  /** Cancelar: cambia el status y sella cancelledAt. Nunca borra el documento. */
  async cancelTicket(id) {
    return this.dao.updateById(id, { status: 'cancelled', cancelledAt: new Date() });
  }
}

export const ticketsRepository = new TicketsRepository(ticketsDao);

export default ticketsRepository;
