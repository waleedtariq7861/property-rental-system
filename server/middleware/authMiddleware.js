import { findPublicUserById, toPublicUser } from '../services/authService.js';
import { verifyAccessToken } from '../services/tokenService.js';
import ApiError from '../utils/ApiError.js';

export const USER_ROLES = Object.freeze({
  TENANT: 'tenant',
  OWNER: 'owner',
  ADMIN: 'admin',
});

const KNOWN_ROLES = new Set(Object.values(USER_ROLES));

function readBearerToken(request) {
  const authorizationHeader = request.get('authorization');

  if (!authorizationHeader) {
    throw new ApiError(401, 'Authentication token is required.');
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    throw new ApiError(401, 'Authorization header must use the Bearer token format.');
  }

  return token;
}

function hasRequiredClaims(payload) {
  const hasUserId =
    (typeof payload?.userId === 'number' && Number.isSafeInteger(payload.userId)) ||
    (typeof payload?.userId === 'string' && payload.userId.length > 0);

  return (
    hasUserId &&
    typeof payload.email === 'string' &&
    payload.email.length > 0 &&
    typeof payload.role === 'string' &&
    KNOWN_ROLES.has(payload.role)
  );
}

export async function authenticate(request, response, next) {
  try {
    const token = readBearerToken(request);
    const payload = verifyAccessToken(token);

    if (!hasRequiredClaims(payload)) {
      throw new ApiError(401, 'Authentication token is invalid.');
    }

    const user = await findPublicUserById(payload.userId);

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    request.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    request.user = toPublicUser(user);

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authentication token has expired.'));
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return next(new ApiError(401, 'Authentication token is invalid.'));
    }

    return next(error);
  }
}

export function authorizeRoles(...allowedRoles) {
  if (
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => !KNOWN_ROLES.has(role))
  ) {
    throw new Error('Authorization middleware received an unsupported role.');
  }

  return function authorizeAuthenticatedRole(request, response, next) {
    if (!request.user) {
      return next(new ApiError(401, 'Authentication is required.'));
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.'));
    }

    return next();
  };
}
