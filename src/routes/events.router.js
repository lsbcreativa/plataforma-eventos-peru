import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/events.controller.js';
import { requireAuth } from '../middlewares/passportAuth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:eid', getEventById);
router.post('/', requireAuth, authorize('organizer', 'admin'), createEvent);
router.patch('/:eid', requireAuth, authorize('organizer', 'admin'), updateEvent);
router.delete('/:eid', requireAuth, authorize('organizer', 'admin'), deleteEvent);

export default router;
