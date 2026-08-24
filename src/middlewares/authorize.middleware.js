import { AppError } from '../utils/appError.js';

const FORBIDDEN_MESSAGE = 'No tenés permisos para realizar esta acción';

/**
 * Compara req.user.role contra los roles permitidos para la ruta.
 * Debe ejecutarse siempre despues de un middleware de autenticacion que pueble req.user;
 * si no hay usuario o su rol no esta en la lista, responde 403 (no 401: ya esta autenticado).
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user?.role)) {
    return next(new AppError(FORBIDDEN_MESSAGE, 403));
  }
  next();
};

export default authorize;
