import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';

export const COOKIE_NAME = 'currentUser';

/**
 * Lee el JWT de la cookie, lo verifica y deja el payload en req.user.
 * Responde 401 si no hay cookie o el token es inválido o está expirado.
 */
export const auth = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return next(new AppError('No autenticado', 401));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('No autenticado', 401));
  }
};

export default auth;
