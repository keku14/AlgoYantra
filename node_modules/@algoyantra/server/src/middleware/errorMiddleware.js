export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error.",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}
