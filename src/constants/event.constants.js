/**
 * Vocabulario de dominio del status de un evento. Vive fuera de src/models para que
 * tanto el modelo (enum de Mongoose) como el service (validaciones de negocio) lo
 * importen del mismo lugar neutral, sin que el service dependa de src/models.
 */
export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'finished'];

export default EVENT_STATUSES;
