import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'rentease_integration_test_secret_at_least_32_chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const [{ default: app }, { default: pool }] = await Promise.all([
  import('../app.js'),
  import('../config/database.js'),
]);

const testId = `${Date.now()}-${process.pid}`;
const tenantEmail = `jwt.tenant.${testId}@rentease.test`;
const adminEmail = `jwt.admin.${testId}@rentease.test`;
const password = 'SecurePass123!';
let tenantToken;
let adminToken;

describe('JWT authentication and role authorization', { concurrency: false }, () => {
  before(async () => {
    const passwordHash = await bcrypt.hash(password, 4);

    await pool.execute(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `,
      ['JWT Test Admin', adminEmail, passwordHash, 'admin'],
    );
  });

  after(async () => {
    await pool.execute(
      'DELETE FROM users WHERE email IN (?, ?)',
      [tenantEmail, adminEmail],
    );
    await pool.end();
  });

  it('keeps registration working for an allowed role', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: 'JWT Test Tenant',
      email: tenantEmail,
      password,
      role: 'tenant',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, tenantEmail);
    assert.equal(response.body.data.user.role, 'tenant');
    assert.equal('password' in response.body.data.user, false);
    assert.equal('passwordHash' in response.body.data.user, false);
  });

  it('logs in and returns a valid JWT with safe claims', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: tenantEmail,
      password,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.tokenType, 'Bearer');
    assert.equal(typeof response.body.data.token, 'string');

    tenantToken = response.body.data.token;
    const decodedToken = jwt.verify(tenantToken, process.env.JWT_SECRET);

    assert.equal(decodedToken.email, tenantEmail);
    assert.equal(decodedToken.role, 'tenant');
    assert.ok(decodedToken.userId);
    assert.equal('password' in decodedToken, false);
    assert.equal('passwordHash' in decodedToken, false);
  });

  it('returns the safe profile for a valid Bearer token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, tenantEmail);
    assert.equal(response.body.data.user.role, 'tenant');
    assert.equal('passwordHash' in response.body.data.user, false);
  });

  it('rejects a protected route when the token is missing', async () => {
    const response = await request(app).get('/api/auth/profile');

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Authentication token is required.');
  });

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not-a-valid-jwt');

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Authentication token is invalid.');
  });

  it('rejects an expired token', async () => {
    const decodedToken = jwt.decode(tenantToken);
    const expiredToken = jwt.sign(
      {
        userId: decodedToken.userId,
        email: decodedToken.email,
        role: decodedToken.role,
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: -1 },
    );

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Authentication token has expired.');
  });

  it('returns user not found for a valid token whose user no longer exists', async () => {
    const unknownUserToken = jwt.sign(
      {
        userId: Number.MAX_SAFE_INTEGER,
        email: 'missing.user@rentease.test',
        role: 'tenant',
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${unknownUserToken}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'User not found.');
  });

  it('rejects a normal user from the admin-only route', async () => {
    const response = await request(app)
      .get('/api/auth/admin-test')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 403);
    assert.equal(
      response.body.message,
      'You do not have permission to access this resource.',
    );
  });

  it('allows an admin to access the admin-only route', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password,
    });

    assert.equal(loginResponse.status, 200);
    adminToken = loginResponse.body.data.token;

    const response = await request(app)
      .get('/api/auth/admin-test')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Admin access confirmed.');
    assert.equal(response.body.data.user.email, adminEmail);
    assert.equal(response.body.data.user.role, 'admin');
  });
});
