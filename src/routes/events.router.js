import { Router } from 'express';
import { getEvents, getEventById } from '../controllers/events.controller.js';

const router = Router();

router.get('/', getEvents);
router.get('/:eid', getEventById);

export default router;
