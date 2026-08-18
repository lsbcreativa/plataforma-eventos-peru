import { successResponse } from '../utils/response.util.js';
import { toPublicUser } from '../utils/user.mapper.js';
import { generateToken } from '../utils/jwt.js';
import { COOKIE_NAME } from '../config/passport.config.js';
import { config } from '../config/env.config.js';

const COOKIE_MAX_AGE = 3600000;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction
};

export const register = (req, res) => {
  successResponse(res, toPublicUser(req.user), 201);
};

export const login = (req, res) => {
  const { _id, email, role } = req.user;
  const token = generateToken({ id: String(_id), email, role });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
  res.status(200).json({ status: 'success', message: 'Login correcto' });
};

export const current = (req, res) => {
  const { id, email, role } = req.user;
  successResponse(res, { id, email, role });
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
