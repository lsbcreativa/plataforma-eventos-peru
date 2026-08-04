/**
 * Convierte un usuario de la base de datos en el objeto público que viaja al cliente.
 * Es el punto único que garantiza que la contraseña nunca salga en una respuesta.
 */
export const toPublicUser = (user) => {
  if (!user) return null;

  return {
    id: String(user._id ?? user.id),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
  };
};
