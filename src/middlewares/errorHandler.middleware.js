import { logger } from '../utils/logger.js';

export const errorHandler = (error, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`);

  res.status(error.status || 500).json({
    status: 'error',
    error: error.message || 'Error interno del servidor'
  });
};

export default errorHandler;
