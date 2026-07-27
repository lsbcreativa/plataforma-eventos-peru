export const notFound = (req, res) => {
  res.status(404).json({
    status: 'error',
    error: `La ruta ${req.method} ${req.originalUrl} no existe en esta API`
  });
};

export default notFound;
