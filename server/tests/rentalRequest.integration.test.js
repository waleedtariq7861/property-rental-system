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
const passwordHash =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const emails = {
  owner: `request.owner.${testId}@rentease.test`,
  tenant: `request.tenant.${testId}@rentease.test`,
  otherTenant: `request.other.${testId}@rentease.test`,
  admin: `request.admin.${testId}@rentease.test`,
};
let owner;
let tenant;
let otherTenant;
let admin;
let availablePropertyId;
let unavailablePropertyId;
let ownerToken;
let tenantToken;
let otherTenantToken;
let adminToken;

describe('Rental request API', { concurrency: false }, () => {
  before(async () => {
    await pool.execute(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?),
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        'Rental Request Owner',
        emails.owner,
        passwordHash,
        'owner',
        'Rental Request Tenant',
        emails.tenant,
        passwordHash,
        'tenant',
        'Other Request Tenant',
        emails.otherTenant,
        passwordHash,
        'tenant',
        'Rental Request Admin',
        emails.admin,
        passwordHash,
        'admin',
      ],
    );

    const [users] = await pool.execute(
      `
        SELECT id, full_name AS fullName, email, role
        FROM users
        WHERE email IN (?, ?, ?, ?)
      `,
      [emails.owner, emails.tenant, emails.otherTenant, emails.admin],
    );
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    owner = usersByEmail.get(emails.owner);
    tenant = usersByEmail.get(emails.tenant);
    otherTenant = usersByEmail.get(emails.otherTenant);
    admin = usersByEmail.get(emails.admin);
    ownerToken = createAccessToken(owner);
    tenantToken = createAccessToken(tenant);
    otherTenantToken = createAccessToken(otherTenant);
    adminToken = createAccessToken(admin);

    const [availableProperty] = await pool.execute(
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
          approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        owner.id,
        `Rental Request Apartment ${testId}`,
        'An available property used to verify tenant rental requests.',
        'apartment',
        88000,
        'Islamabad',
        'G-10',
        'Street 18, G-10, Islamabad',
        2,
        2,
        'available',
        'approved',
      ],
    );
    availablePropertyId = availableProperty.insertId;

    const [unavailableProperty] = await pool.execute(
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
          approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        owner.id,
        `Unavailable Request House ${testId}`,
        'An unavailable property that must reject rental requests.',
        'house',
        110000,
        'Rawalpindi',
        'Bahria Town',
        'Phase 7, Bahria Town, Rawalpindi',
        3,
        3,
        'rented',
        'approved',
      ],
    );
    unavailablePropertyId = unavailableProperty.insertId;
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute(
        'DELETE FROM rental_requests WHERE owner_id = ?',
        [owner.id],
      );
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [owner.id]);
      await pool.execute(
        'DELETE FROM users WHERE id IN (?, ?, ?, ?)',
        [owner.id, tenant.id, otherTenant.id, admin.id],
      );
    }

    await pool.end();
  });

  it('provides the required database columns and pending default', async () => {
    const [columns] = await pool.execute(
      `
        SELECT column_name AS columnName, column_default AS columnDefault
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'rental_requests'
        ORDER BY ordinal_position
      `,
    );
    const requiredColumns = [
      'id',
      'property_id',
      'tenant_id',
      'owner_id',
      'status',
      'message',
      'created_at',
      'updated_at',
    ];

    assert.deepEqual(
      columns.map((column) => column.columnName),
      requiredColumns,
    );
    assert.equal(
      columns.find((column) => column.columnName === 'status').columnDefault,
      'pending',
    );
  });

  it('requires authentication and rejects owner or admin accounts', async () => {
    const [unauthenticated, ownerResponse, adminResponse] = await Promise.all([
      request(app)
        .post('/api/rental-requests')
        .send({ propertyId: availablePropertyId }),
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ propertyId: availablePropertyId }),
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ propertyId: availablePropertyId }),
    ]);

    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.body.message, 'Authentication token is required.');
    assert.equal(ownerResponse.status, 403);
    assert.equal(adminResponse.status, 403);
    assert.equal(
      ownerResponse.body.message,
      'You do not have permission to access this resource.',
    );
    assert.equal(adminResponse.body.message, ownerResponse.body.message);
  });

  it('validates the property ID and optional message', async () => {
    const response = await request(app)
      .post('/api/rental-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: 'invalid',
        message: 'x'.repeat(1001),
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, 'Validation failed');
    assert.ok(response.body.details.propertyId);
    assert.ok(response.body.details.message);
  });

  it('rejects missing and unavailable properties', async () => {
    const [missingResponse, unavailableResponse] = await Promise.all([
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: Number.MAX_SAFE_INTEGER }),
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ propertyId: unavailablePropertyId }),
    ]);

    assert.equal(missingResponse.status, 404);
    assert.equal(missingResponse.body.message, 'Property not found.');
    assert.equal(unavailableResponse.status, 409);
    assert.equal(
      unavailableResponse.body.message,
      'This property is not available for rental requests.',
    );
  });

  it('creates a pending request using tenant and property ownership data', async () => {
    const response = await request(app)
      .post('/api/rental-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: availablePropertyId,
        tenantId: otherTenant.id,
        ownerId: admin.id,
        status: 'approved',
        message: '  I am interested in viewing this apartment next week.  ',
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Rental request sent successfully.');
    assert.equal(response.body.data.rentalRequest.propertyId, availablePropertyId);
    assert.equal(response.body.data.rentalRequest.tenantId, tenant.id);
    assert.equal(response.body.data.rentalRequest.ownerId, owner.id);
    assert.equal(response.body.data.rentalRequest.status, 'pending');
    assert.equal(
      response.body.data.rentalRequest.message,
      'I am interested in viewing this apartment next week.',
    );

    const [rows] = await pool.execute(
      `
        SELECT property_id AS propertyId, tenant_id AS tenantId,
          owner_id AS ownerId, status, message
        FROM rental_requests
        WHERE id = ?
      `,
      [response.body.data.rentalRequest.id],
    );

    assert.equal(rows[0].propertyId, availablePropertyId);
    assert.equal(rows[0].tenantId, tenant.id);
    assert.equal(rows[0].ownerId, owner.id);
    assert.equal(rows[0].status, 'pending');
  });

  it('prevents a duplicate pending request for the same tenant and property', async () => {
    const response = await request(app)
      .post('/api/rental-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ propertyId: availablePropertyId });

    assert.equal(response.status, 409);
    assert.equal(
      response.body.message,
      'You already have a pending rental request for this property.',
    );

    const [rows] = await pool.execute(
      `
        SELECT COUNT(*) AS requestCount
        FROM rental_requests
        WHERE tenant_id = ? AND property_id = ? AND status = 'pending'
      `,
      [tenant.id, availablePropertyId],
    );
    assert.equal(rows[0].requestCount, 1);
  });

  it('serializes concurrent duplicates while allowing another tenant', async () => {
    const responses = await Promise.all([
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .send({ propertyId: availablePropertyId, message: '' }),
      request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .send({ propertyId: availablePropertyId, message: '' }),
    ]);
    const successfulResponse = responses.find(
      (response) => response.status === 201,
    );
    const duplicateResponse = responses.find(
      (response) => response.status === 409,
    );

    assert.ok(successfulResponse);
    assert.ok(duplicateResponse);
    assert.equal(
      successfulResponse.body.data.rentalRequest.tenantId,
      otherTenant.id,
    );
    assert.equal(successfulResponse.body.data.rentalRequest.message, null);
    assert.equal(
      duplicateResponse.body.message,
      'You already have a pending rental request for this property.',
    );
  });

  it('returns only the logged-in tenant rental requests', async () => {
    const response = await request(app)
      .get('/api/rental-requests/my-requests')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.count, 1);
    assert.equal(response.body.data.rentalRequests.length, 1);
    assert.equal(response.body.data.rentalRequests[0].tenantId, tenant.id);
    assert.equal(
      response.body.data.rentalRequests[0].propertyId,
      availablePropertyId,
    );
    assert.equal(
      response.body.data.rentalRequests[0].propertyTitle,
      `Rental Request Apartment ${testId}`,
    );

    const ownerResponse = await request(app)
      .get('/api/rental-requests/my-requests')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(ownerResponse.status, 403);
  });
});
