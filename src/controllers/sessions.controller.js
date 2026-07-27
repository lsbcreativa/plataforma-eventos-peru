const pendingImplementation = (res, accion) =>
  res.status(501).json({
    status: 'error',
    error: `${accion} disponible en la proxima entrega (autenticacion con JWT y Passport)`
  });

export const register = (req, res) => pendingImplementation(res, 'Registro de usuarios');

export const login = (req, res) => pendingImplementation(res, 'Inicio de sesion');

export const current = (req, res) => pendingImplementation(res, 'Usuario autenticado');

export const logout = (req, res) => pendingImplementation(res, 'Cierre de sesion');
