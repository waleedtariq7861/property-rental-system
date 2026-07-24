import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function parsePort(value, fallback) {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured in the environment.`);
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

const env = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parsePort(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'rentease_db',
  },
  jwt: {
    secret: requireEnvironmentVariable('JWT_SECRET'),
    expiresIn: requireEnvironmentVariable('JWT_EXPIRES_IN'),
  },
});

export default env;
