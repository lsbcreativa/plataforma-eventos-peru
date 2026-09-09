const EVENT_FIELDS = [
  'title',
  'description',
  'category',
  'location',
  'date',
  'capacity',
  'price',
  'status',
  'organizer',
  'createdAt',
  'updatedAt'
];

/**
 * DTO de evento: arma el objeto publico campo por campo (allowlist), no por spread,
 * para que agregar un campo nuevo al modelo no se filtre a la respuesta sin revisar
 * antes si corresponde exponerlo.
 */
export const toEventDTO = (event) => {
  if (!event) return null;

  const dto = { id: String(event.id ?? event._id) };
  EVENT_FIELDS.forEach((field) => {
    if (event[field] !== undefined) dto[field] = event[field];
  });

  return dto;
};

export default toEventDTO;
