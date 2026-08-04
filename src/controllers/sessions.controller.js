import { sessionsService } from '../services/sessions.service.js';
import { successResponse } from '../utils/response.util.js';

const pendingImplementation = (res, accion) =>
  res.status(501).json({
    status: 'error',
    message: `${accion} disponible en la proxima entrega (autenticacion con JWT y Passport)`
  });

export const register = async (req, res, next) => {
  try {
    const user = await sessionsService.register(req.body);
    successResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
};

export const login = (req, res) => pendingImplementation(res, 'Inicio de sesion');

export const current = (req, res) => pendingImplementation(res, 'Usuario autenticado');

export const logout = (req, res) => pendingImplementation(res, 'Cierre de sesion');
