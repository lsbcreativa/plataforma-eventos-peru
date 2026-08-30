import { eventsRepository } from '../repositories/events.repository.js';
import { AppError } from '../utils/appError.js';
import { findMissingFields } from '../utils/validators.js';

const REQUIRED_EVENT_FIELDS = ['title', 'description', 'venue', 'date', 'capacity'];
const IMMUTABLE_EVENT_FIELDS = ['id', 'organizer'];

export class EventsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getEvents(query = {}) {
    const filter = {};
    if (query.city) filter.city = query.city;
    if (query.category) filter.category = query.category;
    return this.repository.getEvents(filter);
  }

  async getEventById(id) {
    return this.repository.getEventById(id);
  }

  /** Crea un evento nuevo a nombre del organizador autenticado (organizer o admin). */
  async createEvent(data = {}, organizerId) {
    const missingFields = findMissingFields(data, REQUIRED_EVENT_FIELDS);
    if (missingFields.length > 0) {
      throw new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400);
    }

    const capacity = Number(data.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new AppError('La capacidad debe ser un número entero mayor a 0', 400);
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('La fecha del evento no es válida', 400);
    }

    const newEvent = {
      title: String(data.title).trim(),
      description: String(data.description).trim(),
      venue: String(data.venue).trim(),
      city: data.city ? String(data.city).trim() : 'Lima',
      category: data.category || 'tecnologia',
      date,
      capacity,
      availableSeats: capacity,
      price: data.price ? Number(data.price) : 0,
      currency: data.currency || 'PEN',
      organizer: organizerId,
      status: 'publicado'
    };

    return this.repository.createEvent(newEvent);
  }

  /**
   * Modifica un evento existente. Un organizer solo puede tocar sus propios eventos;
   * un admin puede tocar cualquiera. El id y el organizer del evento no se pueden reasignar.
   */
  async updateEvent(id, changes = {}, user) {
    const event = await this._getOwnedEvent(id, user);

    const allowedChanges = { ...changes };
    IMMUTABLE_EVENT_FIELDS.forEach((field) => delete allowedChanges[field]);

    return this.repository.updateEvent(id, allowedChanges);
  }

  /**
   * Elimina un evento existente con la misma regla de propiedad que updateEvent:
   * un organizer solo puede borrar sus propios eventos; un admin, cualquiera.
   */
  async deleteEvent(id, user) {
    const event = await this._getOwnedEvent(id, user);

    return this.repository.deleteEvent(event.id);
  }

  /** Busca el evento y valida que el usuario sea su dueño (o admin). Lanza 404 o 403 si no. */
  async _getOwnedEvent(id, user) {
    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new AppError('Evento no encontrado', 404);
    }

    if (user.role !== 'admin' && String(event.organizer) !== String(user.id)) {
      throw new AppError('No podés modificar ni eliminar un evento que no te pertenece', 403);
    }

    return event;
  }
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;
