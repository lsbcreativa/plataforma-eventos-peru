import { usersRepository } from '../repositories/users.repository.js';

/**
 * Servicio de sesiones. La logica de registro, login y JWT se implementa
 * en la proxima entrega; aqui queda definida la capa y sus dependencias.
 */
class SessionsService {
  constructor(repository) {
    this.repository = repository;
  }

  async findUserByEmail(email) {
    return this.repository.getUserByEmail(email);
  }
}

export const sessionsService = new SessionsService(usersRepository);

export default sessionsService;
