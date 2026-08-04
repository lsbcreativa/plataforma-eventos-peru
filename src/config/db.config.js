import mongoose from 'mongoose';
import { config } from './env.config.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  if (!config.mongoUrl) {
    logger.error('MONGO_URL no esta definida. El registro de usuarios no va a funcionar.');
    return null;
  }

  try {
    const connection = await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB conectado: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`No se pudo conectar a MongoDB: ${error.message}`);
    logger.error('Revisa el valor de MONGO_URL en tu archivo .env');
    return null;
  }
};

export default connectDB;
