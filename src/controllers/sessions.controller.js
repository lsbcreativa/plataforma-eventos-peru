import { successResponse } from '../utils/response.util.js';
import { toUserDTO } from '../dto/user.dto.js';
import { toCurrentUserDTO } from '../dto/session.dto.js';
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
  successResponse(res, toUserDTO(req.user), 201);
};

export const login = (req, res) => {
  const { _id, email, role } = req.user;
  const token = generateToken({ id: String(_id), email, role });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
  res.status(200).json({ status: 'success', message: 'Login correcto' });
};

export const current = (req, res) => {
  successResponse(res, toCurrentUserDTO(req.user));
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
