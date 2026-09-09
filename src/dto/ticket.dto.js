import { toUserDTO } from './user.dto.js';

const TICKET_FIELDS = ['status', 'quantity', 'reservationCode', 'cancelledAt', 'createdAt', 'updatedAt'];
const EVENT_SUMMARY_FIELDS = ['title', 'date', 'location'];

/**
 * Un ObjectId sin popular (post .lean()) sigue siendo un objeto (tiene su propio
 * `buffer` interno), asi que no alcanza con mirar si tiene keys. Se distingue por
 * duck-typing: solo un documento poblado va a traer alguno de sus campos de dominio.
 */
const isPopulatedEvent = (value) => Boolean(value) && typeof value === 'object' && 'title' in value;
const isPopulatedUser = (value) =>
  Boolean(value) && typeof value === 'object' && ('email' in value || 'first_name' in value);

/** Resumen minimo de un evento poblado dentro de un ticket: solo lo que pide el enunciado. */
const toEventSummaryDTO = (event) => {
  const dto = {};
  EVENT_SUMMARY_FIELDS.forEach((field) => {
    if (event[field] !== undefined) dto[field] = event[field];
  });
  return dto;
};

/**
 * DTO de ticket: allowlist explicita, igual que event.dto.js y user.dto.js. Si `event`
 * o `user` vienen poblados (populate), tambien se filtran de forma explicita en vez de
 * reexportar el sub-documento tal cual — asi, si en el futuro se amplia un populate en
 * el DAO/repository, este DTO sigue sin poder filtrar un password por accidente.
 */
export const toTicketDTO = (ticket) => {
  if (!ticket) return null;

  const dto = { id: String(ticket.id ?? ticket._id) };
  TICKET_FIELDS.forEach((field) => {
    if (ticket[field] !== undefined) dto[field] = ticket[field];
  });

  dto.event = isPopulatedEvent(ticket.event) ? toEventSummaryDTO(ticket.event) : String(ticket.event);
  dto.user = isPopulatedUser(ticket.user) ? toUserDTO(ticket.user) : String(ticket.user);

  return dto;
};

export default toTicketDTO;
