/**
 * Convierte un evento de la base de datos en el objeto público que viaja al cliente,
 * exponiendo `id` en vez del `_id` nativo de Mongo (misma convencion que user.mapper.js).
 */
export const toPublicEvent = (event) => {
  if (!event) return null;

  const { _id, id, __v, ...rest } = event;
  return { id: String(id ?? _id), ...rest };
};
