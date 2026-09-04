import nodemailer from 'nodemailer';
import { config } from '../config/env.config.js';
import { logger } from './logger.js';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: { user: config.mail.user, pass: config.mail.pass }
    });
  }
  return transporter;
};

/**
 * Envia un email con Nodemailer. Si MAIL_HOST no esta configurado (desarrollo local
 * sin credenciales, o la suite de tests) no intenta conectarse: solo lo avisa por log,
 * para no bloquear ni fallar el flujo que dispara el envio.
 */
export const sendMail = async (options) => {
  if (!config.mail.host) {
    logger.warn('MAIL_HOST no esta configurado: se omite el envio de email');
    return null;
  }

  return getTransporter().sendMail({ from: config.mail.from, ...options });
};

export default { sendMail };
