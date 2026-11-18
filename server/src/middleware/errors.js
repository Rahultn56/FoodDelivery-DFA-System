export function notFound(req, res) {
  res.status(404).json({
    message: `No API route for ${req.method} ${req.path}. Check the API documentation.`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/auth/demo-credentials',
      'GET /api/foods',
      'POST /api/foods (admin)',
      'PATCH /api/foods/:id (admin)',
      'DELETE /api/foods/:id (admin)',
      'POST /api/orders',
      'GET /api/orders/mine',
      'GET /api/orders (admin)',
      'GET /api/orders/:id',
      'PATCH /api/orders/:id/transition',
      'GET /api/dfa/info',
      'POST /api/dfa/simulate',
      'POST /api/dfa/test-step',
      'GET /api/network-info/stats'
    ]
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: errors.join(', ') });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  // CastError (invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ID format: ${err.value}` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication token is invalid or expired. Please sign in again.' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  if (status >= 500) {
    console.error(`[Server Error] ${req.method} ${req.path}: ${message}`, err.stack);
  }

  res.status(status).json({ message });
}
