import { sessionsService } from '../services/sessions.service.js';
import { successResponse } from '../utils/response.util.js';
import { COOKIE_NAME } from '../middlewares/auth.middleware.js';
import { config } from '../config/env.config.js';

const COOKIE_MAX_AGE = 3600000;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction
};

export const register = async (req, res, next) => {
  try {
    const user = await sessionsService.register(req.body);
    successResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const token = await sessionsService.login(req.body);

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
    res.status(200).json({ status: 'success', message: 'Login correcto' });
  } catch (error) {
    next(error);
  }
};

export const current = (req, res) => {
  const { id, email, role } = req.user;
  successResponse(res, { id, email, role });
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
