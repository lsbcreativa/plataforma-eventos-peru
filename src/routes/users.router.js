import { Router } from 'express';
import { getUsers } from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/passportAuth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', requireAuth, authorize('admin'), getUsers);

export default router;
