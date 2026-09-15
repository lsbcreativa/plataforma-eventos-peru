import crypto from 'node:crypto';
import { ticketsRepository } from '../repositories/tickets.repository.js';
import { eventsRepository } from '../repositories/events.repository.js';
import { AppError } from '../utils/appError.js';
import { toTicketDTO } from '../dto/ticket.dto.js';
import { sendMail } from '../utils/mailer.js';
import { logger } from '../utils/logger.js';

const DUPLICATE_KEY_ERROR = 11000;
const MAX_RESERVATION_CODE_ATTEMPTS = 3;

const generateReservationCode = () => `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export class TicketsService {
  constructor(repository, eventsRepo = eventsRepository, mailer = { sendMail }) {
    this.repository = repository;
    this.eventsRepo = eventsRepo;
    this.mailer = mailer;
  }

  /**
   * Inscribe al usuario autenticado a un evento. Todas las reglas de negocio
   * (existencia y estado del evento, cantidad, cupos, inscripcion duplicada)
   * viven aca, no en la ruta ni en el controller.
   */
  async createTicket(eventId, data = {}, user) {
    const event = await this.eventsRepo.getEventById(eventId);
    if (!event) {
      throw new AppError('Evento no encontrado', 404);
    }

    this._assertEventIsOpenForEnrollment(event);

    const quantity = this._validateQuantity(data.quantity);

    const existing = await this.repository.findActiveByUserAndEvent(user.id, eventId);
    if (existing) {
      throw new AppError('Ya tienes una inscripción activa para este evento', 409);
    }

    await this._assertCapacityAvailable(event, eventId, quantity);

    const created = await this._createWithUniqueCode({ user: user.id, event: eventId, quantity });

    await this.mailer
      .sendMail(this._buildConfirmationEmail(user, event, created))
      .catch((error) => logger.warn(`No se pudo enviar el email de confirmación: ${error.message}`));

    return toTicketDTO(created);
  }

  async getMyTickets(userId) {
    const tickets = await this.repository.findByUser(userId);
    return tickets.map(toTicketDTO);
  }

  /** Lista las inscripciones de un evento: solo el organizer dueño o un admin. */
  async getEventTickets(eventId, user) {
    const event = await this.eventsRepo.getEventById(eventId);
    if (!event) {
      throw new AppError('Evento no encontrado', 404);
    }

    if (user.role !== 'admin' && String(event.organizer) !== String(user.id)) {
      throw new AppError('No tienes permisos para ver las inscripciones de este evento', 403);
    }

    const tickets = await this.repository.findByEvent(eventId);
    return tickets.map(toTicketDTO);
  }

  /** Cancela un ticket: cambia el status, nunca borra el documento. Libera el cupo. */
  async cancelTicket(ticketId, user) {
    const ticket = await this.repository.getTicketById(ticketId);
    if (!ticket) {
      throw new AppError('Ticket no encontrado', 404);
    }

    if (user.role !== 'admin' && String(ticket.user) !== String(user.id)) {
      throw new AppError('No puedes cancelar un ticket que no te pertenece', 403);
    }

    if (ticket.status === 'cancelled') {
      throw new AppError('El ticket ya está cancelado', 409);
    }

    return toTicketDTO(await this.repository.cancelTicket(ticketId));
  }

  _assertEventIsOpenForEnrollment(event) {
    if (event.status === 'cancelled') {
      throw new AppError('No puedes inscribirte a un evento cancelado', 409);
    }
    if (event.status === 'finished') {
      throw new AppError('No puedes inscribirte a un evento que ya finalizó', 409);
    }
    if (event.status !== 'published') {
      throw new AppError('El evento todavía no está publicado', 409);
    }
  }

  _validateQuantity(value) {
    const quantity = Number(value ?? 1);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError('La cantidad debe ser un número entero mayor a 0', 400);
    }
    return quantity;
  }

  async _assertCapacityAvailable(event, eventId, quantity) {
    const occupied = await this.repository.countActiveTickets(eventId);
    const available = event.capacity - occupied;

    if (available < quantity) {
      throw new AppError(`No hay cupos suficientes: quedan ${available} de ${event.capacity}`, 409);
    }
  }

  /** Reintenta si el codigo de reserva colisiona; deja pasar cualquier otro error tal cual. */
  async _createWithUniqueCode(baseData) {
    for (let attempt = 1; attempt <= MAX_RESERVATION_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.repository.createTicket({
          ...baseData,
          reservationCode: generateReservationCode()
        });
      } catch (error) {
        if (error.code !== DUPLICATE_KEY_ERROR) throw error;

        if (error.keyPattern?.user) {
          throw new AppError('Ya tienes una inscripción activa para este evento', 409);
        }
        if (!error.keyPattern?.reservationCode || attempt === MAX_RESERVATION_CODE_ATTEMPTS) {
          throw error;
        }
      }
    }
    return undefined;
  }

  _buildConfirmationEmail(user, event, ticket) {
    return {
      to: user.email,
      subject: `Inscripción confirmada: ${event.title}`,
      text:
        `Hola ${user.first_name},\n\n` +
        `Tu inscripción a "${event.title}" quedó confirmada.\n` +
        `Fecha: ${new Date(event.date).toLocaleDateString('es-PE')}\n` +
        `Lugar: ${event.location}\n` +
        `Cantidad: ${ticket.quantity}\n` +
        `Código de reserva: ${ticket.reservationCode}`
    };
  }
}

export const ticketsService = new TicketsService(ticketsRepository);

export default ticketsService;
