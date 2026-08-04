import { logger } from '../utils/logger.js';

export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const ruta = `${req.method} ${req.originalUrl}`;

  if (status >= 500) {
    logger.error(`${ruta} - ${error.stack || error.message}`);
    return res.status(status).json({ status: 'error', message: 'Error interno del servidor' });
  }

  logger.warn(`${ruta} - ${status} - ${error.message}`);
  res.status(status).json({ status: 'error', message: error.message });
};

export default errorHandler;
