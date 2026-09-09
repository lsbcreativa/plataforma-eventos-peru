/**
 * DTO de usuario: convierte un documento de la base de datos en el objeto público
 * que viaja al cliente. Es el punto único que garantiza que la contraseña nunca
 * salga en una respuesta: arma el objeto campo por campo (allowlist), nunca por
 * spread, así que un campo nuevo que se agregue al modelo no se filtra por accidente.
 */
export const toUserDTO = (user) => {
  if (!user) return null;

  return {
    id: String(user._id ?? user.id),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
  };
};

export default toUserDTO;
