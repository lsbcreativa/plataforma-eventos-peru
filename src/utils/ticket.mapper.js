/**
 * Convierte un ticket de la base de datos en el objeto público que viaja al cliente,
 * exponiendo `id` en vez del `_id` nativo de Mongo (misma convencion que los otros mappers).
 */
export const toPublicTicket = (ticket) => {
  if (!ticket) return null;

  const { _id, id, __v, ...rest } = ticket;
  return { id: String(id ?? _id), ...rest };
};
