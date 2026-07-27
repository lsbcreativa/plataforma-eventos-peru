import { eventsDao } from '../dao/events.dao.js';

class EventsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getEvents(filter) {
    return this.dao.getAll(filter);
  }

  async getEventById(id) {
    return this.dao.getById(id);
  }

  async createEvent(data) {
    return this.dao.create(data);
  }
}

export const eventsRepository = new EventsRepository(eventsDao);

export default eventsRepository;
