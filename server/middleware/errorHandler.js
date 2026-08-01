function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(`${request.method} ${request.originalUrl}`, error);
  }

  const payload = {
    success: false,
    message: isServerError
      ? 'An unexpected server error occurred'
      : error.message || 'An unexpected server error occurred',
    data: null,
  };

  if (error.details && !isServerError) {
    payload.details = error.details;
  }

  return response.status(statusCode).json(payload);
}

export default errorHandler;
