import { eventsRepository } from '../repositories/events.repository.js';
import { AppError } from '../utils/appError.js';
import { findMissingFields } from '../utils/validators.js';
import { toEventDTO } from '../dto/event.dto.js';
import { EVENT_STATUSES } from '../constants/event.constants.js';

const REQUIRED_EVENT_FIELDS = ['title', 'description', 'category', 'date', 'location', 'capacity'];
const FILTERABLE_FIELDS = ['status', 'category', 'location'];
const SORTABLE_FIELDS = ['date', 'price', 'capacity', 'createdAt'];
const DEFAULT_SORT = { date: 1 };
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const IMMUTABLE_EVENT_FIELDS = ['id', '_id', 'organizer', 'status', 'createdAt', 'updatedAt'];

const parseSort = (sortParam) => {
  if (!sortParam) return DEFAULT_SORT;
  const field = String(sortParam).replace(/^-/, '');
  const direction = String(sortParam).startsWith('-') ? -1 : 1;
  return SORTABLE_FIELDS.includes(field) ? { [field]: direction } : DEFAULT_SORT;
};

export class EventsService {
  constructor(repository) {
    this.repository = repository;
  }

  /** Lista eventos con filtros, paginacion y ordenamiento. */
  async getEvents(query = {}) {
    const filter = {};
    FILTERABLE_FIELDS.forEach((field) => {
      if (query[field]) filter[field] = query[field];
    });

    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
    }

    const page = Math.max(1, Math.trunc(Number(query.page)) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(Number(query.limit)) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const sort = parseSort(query.sort);

    const [data, total] = await Promise.all([
      this.repository.findEvents(filter, { skip, limit, sort }),
      this.repository.countEvents(filter)
    ]);

    return {
      data: data.map(toEventDTO),
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    };
  }

  async getEventById(id) {
    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new AppError('Evento no encontrado', 404);
    }

    return toEventDTO(event);
  }

  /** Crea un evento nuevo a nombre del organizador autenticado (organizer o admin). */
  async createEvent(data = {}, organizerId) {
    const missingFields = findMissingFields(data, REQUIRED_EVENT_FIELDS);
    if (missingFields.length > 0) {
      throw new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400);
    }

    const capacity = this._validateCapacity(data.capacity);
    const price = this._validatePrice(data.price ?? 0);
    const date = this._validateDate(data.date, { allowPast: false });

    const created = await this.repository.createEvent({
      title: String(data.title).trim(),
      description: String(data.description).trim(),
      category: String(data.category).trim(),
      location: String(data.location).trim(),
      date,
      capacity,
      price,
      organizer: organizerId
    });

    return toEventDTO(created);
  }

  /**
   * Reemplaza los datos de un evento existente (PUT). Un organizer solo puede tocar
   * sus propios eventos; un admin puede tocar cualquiera. Un evento cancelado no se
   * puede modificar. El id, el organizer y el status no se tocan por esta via: el
   * status tiene su propio endpoint (changeStatus) porque tiene reglas de transicion
   * propias que no tendria sentido mezclar con una actualizacion de datos general.
   */
  async updateEvent(id, changes = {}, user) {
    const event = await this._getOwnedEvent(id, user);
    this._assertNotCancelled(event);

    const allowedChanges = { ...changes };
    IMMUTABLE_EVENT_FIELDS.forEach((field) => delete allowedChanges[field]);

    if (allowedChanges.capacity !== undefined) {
      allowedChanges.capacity = this._validateCapacity(allowedChanges.capacity);
    }
    if (allowedChanges.price !== undefined) {
      allowedChanges.price = this._validatePrice(allowedChanges.price);
    }
    if (allowedChanges.date !== undefined) {
      allowedChanges.date = this._validateDate(allowedChanges.date, { allowPast: true });
    }

    return toEventDTO(await this.repository.updateEvent(id, allowedChanges));
  }

  /**
   * Cambia el status de un evento (PATCH .../status). Cancelar es la unica forma de
   * "borrar" un evento: nunca se elimina el documento. Un evento cancelado queda
   * congelado (no se le puede volver a cambiar el status), y no se puede publicar
   * un evento ya finalizado o cancelado.
   */
  async changeStatus(id, status, user) {
    if (!EVENT_STATUSES.includes(status)) {
      throw new AppError(`Estado inválido: debe ser uno de ${EVENT_STATUSES.join(', ')}`, 400);
    }

    const event = await this._getOwnedEvent(id, user);
    this._assertNotCancelled(event);

    if (status === 'published' && ['finished', 'cancelled'].includes(event.status)) {
      throw new AppError('No se puede publicar un evento finalizado o cancelado', 400);
    }

    return toEventDTO(await this.repository.updateEvent(id, { status }));
  }

  /** Busca el evento y valida que el usuario sea su dueño (o admin). Lanza 404 o 403 si no. */
  async _getOwnedEvent(id, user) {
    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new AppError('Evento no encontrado', 404);
    }

    if (user.role !== 'admin' && String(event.organizer) !== String(user.id)) {
      throw new AppError('No podés modificar un evento que no te pertenece', 403);
    }

    return event;
  }

  _assertNotCancelled(event) {
    if (event.status === 'cancelled') {
      throw new AppError('Un evento cancelado no se puede modificar', 409);
    }
  }

  _validateCapacity(value) {
    const capacity = Number(value);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new AppError('La capacidad debe ser un número entero mayor a 0', 400);
    }
    return capacity;
  }

  _validatePrice(value) {
    const price = Number(value);
    if (Number.isNaN(price) || price < 0) {
      throw new AppError('El precio no puede ser negativo', 400);
    }
    return price;
  }

  _validateDate(value, { allowPast }) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('La fecha del evento no es válida', 400);
    }
    if (!allowPast && date.getTime() < Date.now()) {
      throw new AppError('La fecha del evento no puede ser en el pasado', 400);
    }
    return date;
  }
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;
