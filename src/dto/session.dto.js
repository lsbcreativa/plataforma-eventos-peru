/**
 * DTO de la sesion actual (GET /api/sessions/current). A diferencia de user.dto.js,
 * no recibe un documento de Mongo sino el payload ya verificado del JWT (req.user,
 * poblado por la estrategia 'current' de Passport), que nunca llevo password porque
 * se firmo solo con { id, email, role } en el login. Igual pasa por un DTO explicito
 * en vez de armarse a mano en el controller, para no romper el punto unico de salida.
 */
export const toCurrentUserDTO = (payload) => {
  if (!payload) return null;

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role
  };
};

export default toCurrentUserDTO;
