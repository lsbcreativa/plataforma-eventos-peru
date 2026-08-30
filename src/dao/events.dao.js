import { Event } from '../models/Event.js';

/**
 * DAO de eventos sobre MongoDB.
 * Recibe el modelo por constructor para poder sustituirlo en las pruebas.
 */
export class EventsDao {
  constructor(model = Event) {
    this.model = model;
  }

  async find(filter, { skip = 0, limit = 10, sort = {} } = {}) {
    return this.model.find(filter).sort(sort).skip(skip).limit(limit).lean();
  }

  async count(filter) {
    return this.model.countDocuments(filter);
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

  async create(data) {
    const created = await this.model.create(data);
    return created.toObject();
  }

  async update(id, changes) {
    try {
      return await this.model.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }
}

export const eventsDao = new EventsDao();

export default eventsDao;
