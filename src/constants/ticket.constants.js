/**
 * Vocabulario de dominio del status de un ticket. Misma razon que event.constants.js:
 * un lugar neutral que el modelo y (a futuro) los services puedan importar por igual.
 */
export const TICKET_STATUSES = ['confirmed', 'pending', 'cancelled'];

export default TICKET_STATUSES;
