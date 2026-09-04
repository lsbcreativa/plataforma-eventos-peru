import { ticketsService } from '../services/tickets.service.js';
import { successResponse } from '../utils/response.util.js';

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.createTicket(req.params.id, req.body, req.user);
    successResponse(res, ticket, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user.id);
    successResponse(res, tickets);
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getEventTickets(req.params.id, req.user);
    successResponse(res, tickets);
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.cancelTicket(req.params.tid, req.user);
    successResponse(res, ticket);
  } catch (error) {
    next(error);
  }
};
