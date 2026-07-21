import ApiError from '../utils/ApiError.js';

function notFound(request, response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export default notFound;
