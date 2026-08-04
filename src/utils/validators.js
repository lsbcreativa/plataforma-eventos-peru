const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;

/** Deja el email listo para guardar: sin espacios sobrantes y en minúsculas. */
export const normalizeEmail = (email) => String(email).trim().toLowerCase();

export const isValidEmail = (email) => EMAIL_PATTERN.test(String(email));

export const hasValidPasswordLength = (password) => String(password).length >= MIN_PASSWORD_LENGTH;

/** Devuelve los nombres de los campos obligatorios que llegaron vacíos o ausentes. */
export const findMissingFields = (source, requiredFields) =>
  requiredFields.filter((field) => {
    const value = source?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
