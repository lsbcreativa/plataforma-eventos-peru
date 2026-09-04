import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  changeEventStatus
} from '../controllers/events.controller.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';
import { requireAuth } from '../middlewares/passportAuth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireAuth, authorize('organizer', 'admin'), createEvent);
router.put('/:id', requireAuth, authorize('organizer', 'admin'), updateEvent);
router.patch('/:id/status', requireAuth, authorize('organizer', 'admin'), changeEventStatus);
router.post('/:id/tickets', requireAuth, createTicket);
router.get('/:id/tickets', requireAuth, authorize('organizer', 'admin'), getEventTickets);

export default router;
