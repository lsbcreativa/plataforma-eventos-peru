import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent } from '../controllers/events.controller.js';
import { requireAuth } from '../middlewares/passportAuth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:eid', getEventById);
router.post('/', requireAuth, authorize('organizer', 'admin'), createEvent);
router.patch('/:eid', requireAuth, authorize('organizer', 'admin'), updateEvent);

export default router;
