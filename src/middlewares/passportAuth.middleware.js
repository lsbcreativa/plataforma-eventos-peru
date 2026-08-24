import passport from '../config/passport.config.js';
import { AppError } from '../utils/appError.js';

/**
 * Ejecuta una estrategia de Passport sin sesiones y homogeneiza cualquier fallo
 * como un AppError, para que el errorHandler existente responda siempre igual
 * sin importar la causa puntual (token ausente, invalido, expirado, etc.).
 */
export const authenticate = (strategy, failureMessage, failureStatus = 401) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (error, user) => {
    if (error) return next(error);
    if (!user) return next(new AppError(failureMessage, failureStatus));

    req.user = user;
    next();
  })(req, res, next);
};

/** Middleware reutilizable: exige una sesion valida (cookie con JWT) sin restringir por rol. */
export const requireAuth = authenticate('current', 'No autenticado', 401);

export default authenticate;
