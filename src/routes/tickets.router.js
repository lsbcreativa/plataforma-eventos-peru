import { Router } from 'express';
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js';
import { requireAuth } from '../middlewares/passportAuth.middleware.js';

const router = Router();

router.get('/my-tickets', requireAuth, getMyTickets);
router.patch('/:tid/cancel', requireAuth, cancelTicket);

export default router;
