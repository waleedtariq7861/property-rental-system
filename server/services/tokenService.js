import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const JWT_ALGORITHM = 'HS256';

export function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: env.jwt.expiresIn,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, {
    algorithms: [JWT_ALGORITHM],
  });
}
