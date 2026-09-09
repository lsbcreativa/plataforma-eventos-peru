import { eventsService } from '../services/events.service.js';
import { successResponse } from '../utils/response.util.js';

export const getEvents = async (req, res, next) => {
  try {
    const result = await eventsService.getEvents(req.query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    successResponse(res, event);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body, req.user.id);
    successResponse(res, event, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body, req.user);
    successResponse(res, event);
  } catch (error) {
    next(error);
  }
};

export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventsService.changeStatus(req.params.id, req.body.status, req.user);
    successResponse(res, event);
  } catch (error) {
    next(error);
  }
};
