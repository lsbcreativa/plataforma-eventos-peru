import { usersRepository } from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { toPublicUser } from '../utils/user.mapper.js';
import { AppError } from '../utils/appError.js';
import {
  MIN_PASSWORD_LENGTH,
  findMissingFields,
  hasValidPasswordLength,
  isValidEmail,
  normalizeEmail
} from '../utils/validators.js';

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password'];
const LOGIN_FIELDS = ['email', 'password'];
const DUPLICATE_KEY_ERROR = 11000;

export class SessionsService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Registra un usuario nuevo.
   * Solo se toman los campos permitidos del body: el rol no es asignable desde
   * el registro público y siempre queda con el valor por defecto del modelo.
   */
  async register(data = {}) {
    const missingFields = findMissingFields(data, REQUIRED_FIELDS);
    if (missingFields.length > 0) {
      throw new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400);
    }

    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) {
      throw new AppError('El formato del email no es valido', 400);
    }

    if (!hasValidPasswordLength(data.password)) {
      throw new AppError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        400
      );
    }

    const existingUser = await this.repository.getUserByEmail(email);
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    const newUser = {
      first_name: String(data.first_name).trim(),
      last_name: String(data.last_name).trim(),
      email,
      password: await createHash(data.password)
    };

    try {
      return toPublicUser(await this.repository.createUser(newUser));
    } catch (error) {
      if (error.code === DUPLICATE_KEY_ERROR) {
        throw new AppError('El email ya está registrado', 409);
      }
      throw error;
    }
  }

  /**
   * Verifica las credenciales y devuelve un JWT.
   * Tanto si el email no existe como si la contraseña no coincide se responde
   * lo mismo, para no revelar cuál de los dos datos es el incorrecto.
   */
  async login(data = {}) {
    const missingFields = findMissingFields(data, LOGIN_FIELDS);
    if (missingFields.length > 0) {
      throw new AppError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400);
    }

    const user = await this.repository.getUserByEmail(normalizeEmail(data.email));
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!(await isValidPassword(data.password, user.password))) {
      throw new AppError('Credenciales inválidas', 401);
    }

    return generateToken({ id: String(user._id), email: user.email, role: user.role });
  }

  async findUserByEmail(email) {
    return this.repository.getUserByEmail(normalizeEmail(email));
  }
}

export const sessionsService = new SessionsService(usersRepository);

export default sessionsService;
