export const successResponse = (res, payload, statusCode = 200) =>
  res.status(statusCode).json({ status: 'success', payload });

export const errorResponse = (res, error, statusCode = 500) =>
  res.status(statusCode).json({ status: 'error', error });
