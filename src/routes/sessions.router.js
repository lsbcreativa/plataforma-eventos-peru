import { Router } from 'express';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { authenticate } from '../middlewares/passportAuth.middleware.js';

const router = Router();

router.post('/register', authenticate('register', 'Faltan campos obligatorios', 400), register);
router.post('/login', authenticate('login', 'Faltan campos obligatorios', 400), login);
router.get('/current', authenticate('current', 'No autenticado', 401), current);
router.post('/logout', logout);

export default router;
