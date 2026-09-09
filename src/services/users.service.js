import { usersRepository } from '../repositories/users.repository.js';
import { toUserDTO } from '../dto/user.dto.js';

export class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  /** Lista todos los usuarios en su forma publica, sin exponer el password. */
  async getUsers() {
    const users = await this.repository.getUsers();
    return users.map(toUserDTO);
  }
}

export const usersService = new UsersService(usersRepository);

export default usersService;
