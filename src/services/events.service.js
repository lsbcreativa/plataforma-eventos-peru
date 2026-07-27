import { eventsRepository } from '../repositories/events.repository.js';

class EventsService {
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
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;
