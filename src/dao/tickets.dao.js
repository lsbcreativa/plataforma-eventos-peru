import { Ticket } from '../models/Ticket.js';

/**
 * DAO de tickets sobre MongoDB. Metodos genericos de acceso a datos: no conoce
 * conceptos de dominio (que es un ticket "activo", que pasa al cancelar, etc.);
 * esas decisiones viven en tickets.repository.js. Recibe el modelo por constructor
 * para poder sustituirlo en las pruebas.
 */
export class TicketsDao {
  constructor(model = Ticket) {
    this.model = model;
  }

  async find(filter = {}, { sort = {}, skip = 0, limit, populate } = {}) {
    let query = this.model.find(filter).sort(sort).skip(skip);
    if (limit) query = query.limit(limit);
    if (populate) query = query.populate(populate);
    return query.lean();
  }

  async findOne(filter) {
    return this.model.findOne(filter).lean();
  }

  /** Un id con formato invalido (no ObjectId) se trata igual que "no encontrado". */
  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    const created = await this.model.create(data);
    return created.toObject();
  }

  async updateById(id, changes) {
    try {
      return await this.model.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }
}

export const ticketsDao = new TicketsDao();

export default ticketsDao;
