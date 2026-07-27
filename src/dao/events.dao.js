/**
 * DAO de eventos.
 * En esta etapa persiste en memoria. En la siguiente entrega se reemplaza
 * la fuente de datos por MongoDB manteniendo esta misma interfaz.
 */
class EventsDao {
  constructor() {
    this.events = [];
  }

  async getAll(filter = {}) {
    const keys = Object.keys(filter);
    if (keys.length === 0) return this.events;
    return this.events.filter((event) => keys.every((key) => event[key] === filter[key]));
  }

  async getById(id) {
    return this.events.find((event) => event.id === id) || null;
  }

  async create(data) {
    const event = { id: String(this.events.length + 1), ...data };
    this.events.push(event);
    return event;
  }
}

export const eventsDao = new EventsDao();

export default eventsDao;
