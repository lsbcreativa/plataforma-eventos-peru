import mongoose from 'mongoose';

const eventCollection = 'events';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['tecnologia', 'cultura', 'gastronomia', 'deporte', 'negocios'],
      default: 'tecnologia'
    },
    city: { type: String, required: true, default: 'Lima' },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'PEN' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    status: { type: String, enum: ['borrador', 'publicado', 'cancelado'], default: 'borrador' }
  },
  { timestamps: true, versionKey: false }
);

export const Event = mongoose.model(eventCollection, eventSchema);

export default Event;
