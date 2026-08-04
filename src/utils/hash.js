import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Genera el hash de una contraseña en texto plano.
 * Cada llamada produce un hash distinto porque bcrypt incorpora un salt aleatorio.
 */
export const createHash = async (password) => bcrypt.hash(String(password), SALT_ROUNDS);

/**
 * Compara una contraseña en texto plano contra un hash almacenado.
 * Se usará en el login de la próxima entrega.
 */
export const isValidPassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(String(password), hashedPassword);
};
