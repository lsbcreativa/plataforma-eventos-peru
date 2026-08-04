import { User } from '../models/User.js';

/**
 * DAO de usuarios sobre MongoDB.
 * Recibe el modelo por constructor para poder sustituirlo en las pruebas.
 */
export class UsersDao {
  constructor(model = User) {
    this.model = model;
  }

  async getAll() {
    return this.model.find().lean();
  }

  async getByEmail(email) {
    return this.model.findOne({ email }).lean();
  }

  async getById(id) {
    return this.model.findById(id).lean();
  }

  async create(data) {
    const created = await this.model.create(data);
    return created.toObject();
  }
}

export const usersDao = new UsersDao();

export default usersDao;
