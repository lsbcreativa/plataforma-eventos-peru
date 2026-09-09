import { usersDao } from '../dao/users.dao.js';

export class UsersRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getUsers() {
    return this.dao.find({});
  }

  async getUserByEmail(email) {
    return this.dao.findOne({ email });
  }

  async getUserById(id) {
    return this.dao.findById(id);
  }

  async createUser(data) {
    return this.dao.create(data);
  }
}

export const usersRepository = new UsersRepository(usersDao);

export default usersRepository;
