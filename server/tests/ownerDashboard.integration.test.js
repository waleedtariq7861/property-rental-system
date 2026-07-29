import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'rentease_integration_test_secret_at_least_32_chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const [
  { default: app },
  { default: pool },
  { createAccessToken },
] = await Promise.all([
  import('../app.js'),
  import('../config/database.js'),
  import('../services/tokenService.js'),
]);

const testId = `${Date.now()}-${process.pid}`;
const ownerEmail = `dashboard.owner.${testId}@rentease.test`;
const otherOwnerEmail = `dashboard.other-owner.${testId}@rentease.test`;
const tenantEmail = `dashboard.tenant.${testId}@rentease.test`;
const passwordHash =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
let owner;
let otherOwner;
let tenant;
let ownerToken;
let otherOwnerToken;
let tenantToken;
let otherOwnerPropertyId;

async function createDashboardProperty({
  ownerId,
  title,
  approvalStatus,
  availabilityStatus,
  createdAt,
  propertyType = 'apartment',
}) {
  const [result] = await pool.execute(
    `
      INSERT INTO properties (
        owner_id,
        title,
        description,
        property_type,
        price,
        city,
        area,
        address,
        bedrooms,
        bathrooms,
        availability_status,
        approval_status,
        image_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      ownerId,
      title,
      'Owner dashboard integration test property.',
      propertyType,
      87500,
      'Islamabad',
      'F-11',
      'Street 12, F-11, Islamabad',
      2,
      2,
      availabilityStatus,
      approvalStatus,
      'https://example.test/dashboard-property.jpg',
      createdAt,
    ],
  );

  return result.insertId;
}

describe('Owner dashboard API', { concurrency: false }, () => {
  before(async () => {
    await pool.execute(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        'Dashboard Test Owner',
        ownerEmail,
        passwordHash,
        'owner',
        'Other Dashboard Owner',
        otherOwnerEmail,
        passwordHash,
        'owner',
        'Dashboard Test Tenant',
        tenantEmail,
        passwordHash,
        'tenant',
      ],
    );

    const [createdUsers] = await pool.execute(
      `
        SELECT
          id,
          full_name AS fullName,
          email,
          role
        FROM users
        WHERE email IN (?, ?, ?)
      `,
      [ownerEmail, otherOwnerEmail, tenantEmail],
    );
    const usersByEmail = new Map(
      createdUsers.map((user) => [user.email, user]),
    );

    owner = usersByEmail.get(ownerEmail);
    otherOwner = usersByEmail.get(otherOwnerEmail);
    tenant = usersByEmail.get(tenantEmail);

    ownerToken = createAccessToken(owner);
    otherOwnerToken = createAccessToken(otherOwner);
    tenantToken = createAccessToken(tenant);

    await createDashboardProperty({
      ownerId: owner.id,
      title: `Active Recent Apartment ${testId}`,
      approvalStatus: 'approved',
      availabilityStatus: 'available',
      createdAt: new Date(),
    });
    await createDashboardProperty({
      ownerId: owner.id,
      title: `Pending Recent House ${testId}`,
      approvalStatus: 'pending',
      availabilityStatus: 'available',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      propertyType: 'house',
    });
    await createDashboardProperty({
      ownerId: owner.id,
      title: `Active Older Villa ${testId}`,
      approvalStatus: 'approved',
      availabilityStatus: 'available',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      propertyType: 'villa',
    });
    otherOwnerPropertyId = await createDashboardProperty({
      ownerId: otherOwner.id,
      title: `Other Owner Property ${testId}`,
      approvalStatus: 'approved',
      availabilityStatus: 'available',
      createdAt: new Date(),
    });
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute(
        'DELETE FROM properties WHERE owner_id IN (?, ?)',
        [owner.id, otherOwner.id],
      );
      await pool.execute(
        'DELETE FROM users WHERE id IN (?, ?, ?)',
        [owner.id, otherOwner.id, tenant.id],
      );
    }

    await pool.end();
  });

  it('rejects a dashboard request without a JWT', async () => {
    const response = await request(app).get('/api/owner/dashboard');

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Authentication token is required.');
    assert.equal(response.body.data, null);
  });

  it('rejects an invalid dashboard JWT', async () => {
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', 'Bearer invalid-owner-dashboard-token');

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Authentication token is invalid.');
  });

  it('rejects a tenant from the owner dashboard', async () => {
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 403);
    assert.equal(
      response.body.message,
      'You do not have permission to access this resource.',
    );
  });

  it('uses the current database role instead of a spoofed token role', async () => {
    const spoofedRoleToken = createAccessToken({
      ...tenant,
      role: 'owner',
    });
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${spoofedRoleToken}`);

    assert.equal(response.status, 403);
  });

  it('returns dynamic statistics and only the authenticated owner properties', async () => {
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Owner dashboard retrieved successfully.');
    assert.equal(response.body.data.owner.id, owner.id);
    assert.equal(response.body.data.owner.email, ownerEmail);
    assert.equal(response.body.data.owner.role, 'owner');
    assert.deepEqual(response.body.data.statistics, {
      totalProperties: 3,
      activeListings: 2,
      recentlyAddedProperties: 2,
    });
    assert.equal(response.body.data.properties.length, 3);
    assert.equal(
      response.body.data.properties.every(
        (property) => property.ownerId === owner.id,
      ),
      true,
    );
    assert.equal(
      response.body.data.properties.some(
        (property) => property.id === otherOwnerPropertyId,
      ),
      false,
    );
    assert.equal(response.body.data.properties[0].currentStatus, 'active');
    assert.equal(response.body.data.properties[1].currentStatus, 'pending');
    assert.equal(response.body.data.properties[2].currentStatus, 'active');
  });

  it('returns an independent dashboard for another owner', async () => {
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${otherOwnerToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.statistics, {
      totalProperties: 1,
      activeListings: 1,
      recentlyAddedProperties: 1,
    });
    assert.deepEqual(
      response.body.data.properties.map((property) => property.id),
      [otherOwnerPropertyId],
    );
  });
});
