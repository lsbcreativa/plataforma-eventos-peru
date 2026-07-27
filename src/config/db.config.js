import mongoose from 'mongoose';
import { config } from './env.config.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  if (!config.mongoUrl) {
    logger.warn('MONGO_URL no definida. El servidor inicia sin conexion a la base de datos.');
    return null;
  }

  try {
    const connection = await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB conectado: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`No se pudo conectar a MongoDB: ${error.message}`);
    return null;
  }
};

export default connectDB;
