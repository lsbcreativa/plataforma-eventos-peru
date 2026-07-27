import { usersDao } from '../dao/users.dao.js';

class UsersRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getUsers() {
    return this.dao.getAll();
  }

  async getUserByEmail(email) {
    return this.dao.getByEmail(email);
  }

  async getUserById(id) {
    return this.dao.getById(id);
  }

  async createUser(data) {
    return this.dao.create(data);
  }
}

export const usersRepository = new UsersRepository(usersDao);

export default usersRepository;
