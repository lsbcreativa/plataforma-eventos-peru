import mongoose from 'mongoose';
import { TICKET_STATUSES } from '../constants/ticket.constants.js';

const ticketCollection = 'tickets';

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'events', required: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'confirmed' },
    quantity: { type: Number, required: true, min: 1 },
    reservationCode: { type: String, required: true, unique: true },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

/**
 * Un usuario no puede tener dos inscripciones activas para el mismo evento.
 * Filtro parcial: solo aplica a tickets que no esten cancelados, asi que cancelar
 * y volver a inscribirse no choca contra este indice.
 */
ticketSchema.index(
  { user: 1, event: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

export const Ticket = mongoose.model(ticketCollection, ticketSchema);

export default Ticket;
