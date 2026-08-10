import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

/** Firma un JWT con la clave y la expiración definidas por variables de entorno. */
export const generateToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/** Verifica un JWT y devuelve su payload. Lanza si es inválido o está expirado. */
export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
