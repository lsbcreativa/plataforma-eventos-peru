import { eventsDao } from '../dao/events.dao.js';

export class EventsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async findEvents(filter, options) {
    return this.dao.find(filter, options);
  }

  async countEvents(filter) {
    return this.dao.count(filter);
  }

  async getEventById(id) {
    return this.dao.getById(id);
  }

  async createEvent(data) {
    return this.dao.create(data);
  }

  async updateEvent(id, changes) {
    return this.dao.update(id, changes);
  }
}

export const eventsRepository = new EventsRepository(eventsDao);

export default eventsRepository;
