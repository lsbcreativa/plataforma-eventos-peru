import app from './app.js';
import { config } from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import { logger } from './utils/logger.js';

await connectDB();

app.listen(config.port, () => {
  logger.info(`Servidor escuchando en http://localhost:${config.port} [${config.nodeEnv}]`);
});
