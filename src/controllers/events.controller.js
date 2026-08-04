import { eventsService } from '../services/events.service.js';
import { successResponse } from '../utils/response.util.js';
import { AppError } from '../utils/appError.js';

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
      throw new AppError('Evento no encontrado', 404);
    }
    successResponse(res, event);
  } catch (error) {
    next(error);
  }
};
