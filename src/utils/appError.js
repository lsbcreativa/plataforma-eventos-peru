/**
 * Error de aplicación con código HTTP asociado.
 * Permite que los servicios definan el resultado sin conocer a Express:
 * el middleware de errores lee `status` y arma la respuesta.
 */
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export default AppError;
