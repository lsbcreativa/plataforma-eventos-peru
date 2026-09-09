import mongoose from 'mongoose';
import { EVENT_STATUSES } from '../constants/event.constants.js';

const eventCollection = 'events';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: 'draft' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }
  },
  { timestamps: true, versionKey: false }
);

export const Event = mongoose.model(eventCollection, eventSchema);

export default Event;
