import { eventsService } from '../services/events.service.js';
import { successResponse } from '../utils/response.util.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getEvents(req.query);
    successResponse(res, events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.eid);
    if (!event) {
      return res.status(404).json({ status: 'error', error: 'Evento no encontrado' });
    }
    successResponse(res, event);
  } catch (error) {
    next(error);
  }
};
