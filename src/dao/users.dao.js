import { User } from '../models/User.js';

/**
 * DAO de usuarios sobre MongoDB. Metodos genericos de acceso a datos, sin logica de
 * dominio (buscar "por email" es solo un filtro mas; la decision de que eso signifique
 * "el usuario ya existe" vive en el service). Recibe el modelo por constructor para
 * poder sustituirlo en las pruebas.
 */
export class UsersDao {
  constructor(model = User) {
    this.model = model;
  }

  async find(filter = {}) {
    return this.model.find(filter).lean();
  }

  async findOne(filter) {
    return this.model.findOne(filter).lean();
  }

  /** Un id con formato invalido (no ObjectId) se trata igual que "no encontrado". */
  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    const created = await this.model.create(data);
    return created.toObject();
  }

  async updateById(id, changes) {
    try {
      return await this.model.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).lean();
    } catch (error) {
      if (error.name === 'CastError') return null;
      throw error;
    }
  }
}

export const usersDao = new UsersDao();

export default usersDao;
