import bcrypt from 'bcrypt';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import {
  validateLoginPayload,
  validateRegisterPayload,
} from '../utils/authValidation.js';
import {
  createUser,
  findPublicUserById,
  findUserByEmail,
  toPublicUser,
} from '../services/authService.js';
import { createAccessToken } from '../services/tokenService.js';

const SALT_ROUNDS = 10;

export async function registerUser(request, response) {
  const { fullName, email, password, role, phone } = validateRegisterPayload(request.body);
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let insertedUserId;

  try {
    insertedUserId = await createUser({
      fullName,
      email,
      phone,
      passwordHash,
      role,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    throw error;
  }

  const createdUser = await findPublicUserById(insertedUserId);

  if (!createdUser) {
    throw new ApiError(500, 'Registration completed, but the user record could not be loaded.');
  }

  return response.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      user: toPublicUser(createdUser),
    },
  });
}

export async function loginUser(request, response) {
  const { email, password } = validateLoginPayload(request.body);
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.accountStatus !== 'active') {
    throw new ApiError(403, 'Your account is not active.');
  }

  const token = createAccessToken(user);

  return response.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: toPublicUser(user),
      token,
      tokenType: 'Bearer',
      expiresIn: env.jwt.expiresIn,
    },
  });
}

export function getAuthenticatedProfile(request, response) {
  return response.status(200).json({
    success: true,
    message: 'Authenticated user profile retrieved successfully.',
    data: {
      user: request.user,
    },
  });
}

export function getOwnerTest(request, response) {
  return response.status(200).json({
    success: true,
    message: 'Property owner access confirmed.',
    data: {
      user: request.user,
    },
  });
}

export function getAdminTest(request, response) {
  return response.status(200).json({
    success: true,
    message: 'Admin access confirmed.',
    data: {
      user: request.user,
    },
  });
}
