/**
 * DAO de usuarios.
 * En esta etapa persiste en memoria. En la siguiente entrega se reemplaza
 * la fuente de datos por MongoDB manteniendo esta misma interfaz.
 */
class UsersDao {
  constructor() {
    this.users = [];
  }

  async getAll() {
    return this.users;
  }

  async getByEmail(email) {
    return this.users.find((user) => user.email === email) || null;
  }

  async getById(id) {
    return this.users.find((user) => user.id === id) || null;
  }

  async create(data) {
    const user = { id: String(this.users.length + 1), ...data };
    this.users.push(user);
    return user;
  }
}

export const usersDao = new UsersDao();

export default usersDao;
