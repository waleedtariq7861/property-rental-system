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
  owner: `tenant.dashboard.owner.${testId}@rentease.test`,
  tenant: `tenant.dashboard.${testId}@rentease.test`,
  otherTenant: `tenant.dashboard.other.${testId}@rentease.test`,
  admin: `tenant.dashboard.admin.${testId}@rentease.test`,
};
let owner;
let tenant;
let otherTenant;
let admin;
let ownerToken;
let tenantToken;
let otherTenantToken;
let adminToken;
let propertyId;
let pendingRequestId;
let acceptedRequestId;
let rejectedRequestId;
let otherTenantRequestId;

async function insertRentalRequest(tenantId, status, message) {
  const [result] = await pool.execute(
    `
      INSERT INTO rental_requests (
        property_id,
        tenant_id,
        owner_id,
        status,
        message
      ) VALUES (?, ?, ?, ?, ?)
    `,
    [propertyId, tenantId, owner.id, status, message],
  );

  return result.insertId;
}

describe('Tenant dashboard rental request API', { concurrency: false }, () => {
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
        'Tenant Dashboard Owner',
        emails.owner,
        passwordHash,
        'owner',
        'Tenant Dashboard User',
        emails.tenant,
        passwordHash,
        'tenant',
        'Other Dashboard Tenant',
        emails.otherTenant,
        passwordHash,
        'tenant',
        'Tenant Dashboard Admin',
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

    const [property] = await pool.execute(
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
          image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        owner.id,
        `Tenant Dashboard Apartment ${testId}`,
        'A property used to verify the complete tenant dashboard workflow.',
        'apartment',
        99000,
        'Islamabad',
        'E-11',
        'Street 12, E-11, Islamabad',
        2,
        2,
        'available',
        'approved',
        'https://example.test/tenant-dashboard-apartment.jpg',
      ],
    );
    propertyId = property.insertId;

    pendingRequestId = await insertRentalRequest(
      tenant.id,
      'pending',
      'Please arrange a viewing for the coming weekend.',
    );
    acceptedRequestId = await insertRentalRequest(
      tenant.id,
      'approved',
      'I am interested in a twelve-month lease.',
    );
    rejectedRequestId = await insertRentalRequest(
      tenant.id,
      'rejected',
      null,
    );
    otherTenantRequestId = await insertRentalRequest(
      otherTenant.id,
      'pending',
      'This request belongs to another tenant.',
    );
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute('DELETE FROM rental_requests WHERE owner_id = ?', [
        owner.id,
      ]);
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [owner.id]);
      await pool.execute('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [
        owner.id,
        tenant.id,
        otherTenant.id,
        admin.id,
      ]);
    }

    await pool.end();
  });

  it('protects dashboard and cancellation APIs with authentication and tenant role', async () => {
    const [unauthenticated, ownerResponse, adminResponse] = await Promise.all([
      request(app).get('/api/rental-requests/my-requests'),
      request(app)
        .get('/api/rental-requests/my-requests')
        .set('Authorization', `Bearer ${ownerToken}`),
      request(app)
        .patch(`/api/rental-requests/${pendingRequestId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    assert.equal(unauthenticated.status, 401);
    assert.equal(ownerResponse.status, 403);
    assert.equal(adminResponse.status, 403);
    assert.equal(
      ownerResponse.body.message,
      'You do not have permission to access this resource.',
    );
    assert.equal(adminResponse.body.message, ownerResponse.body.message);
  });

  it('returns only the current tenant requests with dashboard property details', async () => {
    const response = await request(app)
      .get('/api/rental-requests/my-requests')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.count, 3);
    assert.deepEqual(
      new Set(
        response.body.data.rentalRequests.map(
          (rentalRequest) => rentalRequest.status,
        ),
      ),
      new Set(['pending', 'approved', 'rejected']),
    );
    assert.ok(
      response.body.data.rentalRequests.every(
        (rentalRequest) => rentalRequest.tenantId === tenant.id,
      ),
    );
    const pendingRequest = response.body.data.rentalRequests.find(
      (rentalRequest) => rentalRequest.id === pendingRequestId,
    );
    assert.equal(
      pendingRequest.propertyTitle,
      `Tenant Dashboard Apartment ${testId}`,
    );
    assert.equal(pendingRequest.propertyCity, 'Islamabad');
    assert.equal(Number(pendingRequest.propertyPrice), 99000);
    assert.equal(pendingRequest.propertyType, 'apartment');
    assert.equal(pendingRequest.ownerName, 'Tenant Dashboard Owner');
    assert.equal(
      pendingRequest.propertyImageUrl,
      'https://example.test/tenant-dashboard-apartment.jpg',
    );
  });

  it('validates the rental request ID before cancellation', async () => {
    const response = await request(app)
      .patch('/api/rental-requests/not-a-number/cancel')
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.message, 'Validation failed');
    assert.ok(response.body.details.requestId);
  });

  it('prevents tenants from cancelling requests owned by another tenant', async () => {
    const [tenantResponse, otherTenantResponse] = await Promise.all([
      request(app)
        .patch(`/api/rental-requests/${otherTenantRequestId}/cancel`)
        .set('Authorization', `Bearer ${tenantToken}`),
      request(app)
        .patch(`/api/rental-requests/${pendingRequestId}/cancel`)
        .set('Authorization', `Bearer ${otherTenantToken}`),
    ]);

    assert.equal(tenantResponse.status, 404);
    assert.equal(otherTenantResponse.status, 404);
    assert.equal(tenantResponse.body.message, 'Rental request not found.');
    assert.equal(otherTenantResponse.body.message, tenantResponse.body.message);

    const [rows] = await pool.execute(
      'SELECT status FROM rental_requests WHERE id IN (?, ?)',
      [pendingRequestId, otherTenantRequestId],
    );
    assert.ok(rows.every((row) => row.status === 'pending'));
  });

  it('does not cancel accepted or rejected requests', async () => {
    const responses = await Promise.all([
      request(app)
        .patch(`/api/rental-requests/${acceptedRequestId}/cancel`)
        .set('Authorization', `Bearer ${tenantToken}`),
      request(app)
        .patch(`/api/rental-requests/${rejectedRequestId}/cancel`)
        .set('Authorization', `Bearer ${tenantToken}`),
    ]);

    responses.forEach((response) => {
      assert.equal(response.status, 409);
      assert.equal(
        response.body.message,
        'Only pending rental requests can be cancelled.',
      );
    });
  });

  it('cancels an owned pending request and persists the cancelled status', async () => {
    const response = await request(app)
      .patch(`/api/rental-requests/${pendingRequestId}/cancel`)
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Rental request cancelled successfully.');
    assert.equal(response.body.data.rentalRequest.id, pendingRequestId);
    assert.equal(response.body.data.rentalRequest.tenantId, tenant.id);
    assert.equal(response.body.data.rentalRequest.status, 'cancelled');

    const [rows] = await pool.execute(
      'SELECT status FROM rental_requests WHERE id = ?',
      [pendingRequestId],
    );
    assert.equal(rows[0].status, 'cancelled');
  });

  it('prevents repeat cancellation once a request is no longer pending', async () => {
    const response = await request(app)
      .patch(`/api/rental-requests/${pendingRequestId}/cancel`)
      .set('Authorization', `Bearer ${tenantToken}`);

    assert.equal(response.status, 409);
    assert.equal(
      response.body.message,
      'Only pending rental requests can be cancelled.',
    );
  });
});
