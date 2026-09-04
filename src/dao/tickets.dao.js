import { Ticket } from '../models/Ticket.js';

/**
 * DAO de tickets sobre MongoDB.
 * Recibe el modelo por constructor para poder sustituirlo en las pruebas.
 */
export class TicketsDao {
  constructor(model = Ticket) {
    this.model = model;
  }

  async create(data) {
    const created = await this.model.create(data);
    return created.toObject();
  }

  async findActiveByUserAndEvent(userId, eventId) {
    return this.model.findOne({ user: userId, event: eventId, status: { $ne: 'cancelled' } }).lean();
  }

  /** Todos los tickets activos (no cancelados) de un evento: son los que ocupan cupo. */
  async findActiveByEvent(eventId) {
    return this.model.find({ event: eventId, status: { $ne: 'cancelled' } }).lean();
  }

  async findByEvent(eventId) {
    return this.model.find({ event: eventId }).sort({ createdAt: -1 }).lean();
  }

  async findByUser(userId) {
    return this.model
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('event', 'title date location -_id')
      .lean();
  }

  /** Un id con formato invalido (no ObjectId) se trata igual que "no encontrado". */
  async getById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }

  async cancel(id) {
    try {
      return await this.model
        .findByIdAndUpdate(id, { status: 'cancelled', cancelledAt: new Date() }, { new: true })
        .lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }
}

export const ticketsDao = new TicketsDao();

export default ticketsDao;
