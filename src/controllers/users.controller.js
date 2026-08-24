import { usersService } from '../services/users.service.js';
import { successResponse } from '../utils/response.util.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getUsers();
    successResponse(res, users);
  } catch (error) {
    next(error);
  }
};
