import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { usersRepository } from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { AppError } from '../utils/appError.js';
import { config } from './env.config.js';
import {
  MIN_PASSWORD_LENGTH,
  findMissingFields,
  hasValidPasswordLength,
  isValidEmail,
  normalizeEmail
} from '../utils/validators.js';

export const COOKIE_NAME = 'currentUser';

const REGISTER_FIELDS = ['first_name', 'last_name', 'email', 'password'];
const LOGIN_FIELDS = ['email', 'password'];
const DUPLICATE_KEY_ERROR = 11000;
const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas';

const cookieExtractor = (req) => req?.cookies?.[COOKIE_NAME] || null;

/**
 * Verificador de la estrategia 'register'. Recibe el repositorio por parametro
 * para poder probarlo con un repositorio falso, sin depender de MongoDB.
 */
export const registerVerify = (repository) => async (req, done) => {
  try {
    const data = req.body || {};
    const missingFields = findMissingFields(data, REGISTER_FIELDS);
    if (missingFields.length > 0) {
      return done(new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400));
    }

    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) {
      return done(new AppError('El formato del email no es valido', 400));
    }

    if (!hasValidPasswordLength(data.password)) {
      return done(
        new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400)
      );
    }

    const existingUser = await repository.getUserByEmail(email);
    if (existingUser) {
      return done(new AppError('El email ya está registrado', 409));
    }

    const newUser = {
      first_name: String(data.first_name).trim(),
      last_name: String(data.last_name).trim(),
      email,
      password: await createHash(data.password)
    };

    const createdUser = await repository.createUser(newUser);
    return done(null, createdUser);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      return done(new AppError('El email ya está registrado', 409));
    }
    return done(error);
  }
};

/**
 * Verificador de la estrategia 'login'. Responde el mismo mensaje genérico
 * tanto si el email no existe como si la contraseña no coincide.
 */
export const loginVerify = (repository) => async (req, done) => {
  try {
    const data = req.body || {};
    const missingFields = findMissingFields(data, LOGIN_FIELDS);
    if (missingFields.length > 0) {
      return done(new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400));
    }

    const user = await repository.getUserByEmail(normalizeEmail(data.email));
    if (!user || !(await isValidPassword(data.password, user.password))) {
      return done(new AppError(INVALID_CREDENTIALS_MESSAGE, 401));
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

passport.use('register', new CustomStrategy(registerVerify(usersRepository)));
passport.use('login', new CustomStrategy(loginVerify(usersRepository)));

/**
 * Estrategia 'current': lee el JWT desde la cookie httpOnly y deja su payload en req.user.
 * Nuevas estrategias (Google, GitHub, etc.) se agregan aca mismo, sin tocar app.js.
 */
passport.use(
  'current',
  new JwtStrategy({ jwtFromRequest: cookieExtractor, secretOrKey: config.jwtSecret }, (payload, done) =>
    done(null, payload)
  )
);

export default passport;
