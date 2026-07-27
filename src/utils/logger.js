const timestamp = () => new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

export const logger = {
  info: (message) => console.log(`[INFO] ${timestamp()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${timestamp()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${timestamp()} - ${message}`)
};

export default logger;
