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
  owner: `decision.owner.${testId}@rentease.test`,
  otherOwner: `decision.other.owner.${testId}@rentease.test`,
  tenant: `decision.tenant.${testId}@rentease.test`,
  admin: `decision.admin.${testId}@rentease.test`,
};
let owner;
let otherOwner;
let tenant;
let admin;
let ownerToken;
let otherOwnerToken;
let tenantToken;
let adminToken;
let ownerPropertyId;
let otherOwnerPropertyId;
let acceptRequestId;
let rejectRequestId;
let approvedRequestId;
let otherOwnerRequestId;

describe('Owner rental request management API', { concurrency: false }, () => {
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
        'Owner Request Manager',
        emails.owner,
        passwordHash,
        'owner',
        'Other Property Owner',
        emails.otherOwner,
        passwordHash,
        'owner',
        'Owner Workflow Tenant',
        emails.tenant,
        passwordHash,
        'tenant',
        'Owner Workflow Admin',
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
      [emails.owner, emails.otherOwner, emails.tenant, emails.admin],
    );
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    owner = usersByEmail.get(emails.owner);
    otherOwner = usersByEmail.get(emails.otherOwner);
    tenant = usersByEmail.get(emails.tenant);
    admin = usersByEmail.get(emails.admin);
    ownerToken = createAccessToken(owner);
    otherOwnerToken = createAccessToken(otherOwner);
    tenantToken = createAccessToken(tenant);
    adminToken = createAccessToken(admin);

    const propertyValues = [
      'Owner Request Apartment',
      'A property used to test owner rental request decisions.',
      'apartment',
      95000,
      'Islamabad',
      'F-11',
      'Street 20, F-11, Islamabad',
      2,
      2,
      'available',
      'approved',
    ];
    const [ownerProperty] = await pool.execute(
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
      [owner.id, ...propertyValues],
    );
    ownerPropertyId = ownerProperty.insertId;

    const [otherOwnerProperty] = await pool.execute(
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
        otherOwner.id,
        `Other Owner House ${testId}`,
        'A separate property that must remain isolated.',
        'house',
        125000,
        'Rawalpindi',
        'Bahria Town',
        'Phase 8, Bahria Town, Rawalpindi',
        3,
        3,
        'available',
        'approved',
      ],
    );
    otherOwnerPropertyId = otherOwnerProperty.insertId;

    const [rentalRequests] = await pool.execute(
      `
        INSERT INTO rental_requests (
          property_id,
          tenant_id,
          owner_id,
          status,
          message
        ) VALUES
          (?, ?, ?, 'pending', ?),
          (?, ?, ?, 'pending', ?),
          (?, ?, ?, 'approved', ?),
          (?, ?, ?, 'pending', ?)
      `,
      [
        ownerPropertyId,
        tenant.id,
        owner.id,
        'I would like to visit the apartment on Saturday.',
        ownerPropertyId,
        tenant.id,
        owner.id,
        'Please let me know whether a long-term lease is available.',
        ownerPropertyId,
        tenant.id,
        owner.id,
        null,
        otherOwnerPropertyId,
        tenant.id,
        otherOwner.id,
        'This request belongs to another property owner.',
      ],
    );
    acceptRequestId = rentalRequests.insertId;
    rejectRequestId = acceptRequestId + 1;
    approvedRequestId = acceptRequestId + 2;
    otherOwnerRequestId = acceptRequestId + 3;
  });

  after(async () => {
    if (owner?.id && otherOwner?.id) {
      await pool.execute(
        'DELETE FROM rental_requests WHERE owner_id IN (?, ?)',
        [owner.id, otherOwner.id],
      );
      await pool.execute('DELETE FROM properties WHERE owner_id IN (?, ?)', [
        owner.id,
        otherOwner.id,
      ]);
      await pool.execute('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [
        owner.id,
        otherOwner.id,
        tenant.id,
        admin.id,
      ]);
    }

    await pool.end();
  });

  it('requires authentication and the current owner role', async () => {
    const [unauthenticated, tenantResponse, adminResponse] = await Promise.all([
      request(app).get('/api/rental-requests/owner-requests'),
      request(app)
        .get('/api/rental-requests/owner-requests')
        .set('Authorization', `Bearer ${tenantToken}`),
      request(app)
        .patch(`/api/rental-requests/${acceptRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' }),
    ]);

    assert.equal(unauthenticated.status, 401);
    assert.equal(tenantResponse.status, 403);
    assert.equal(adminResponse.status, 403);
    assert.equal(
      tenantResponse.body.message,
      'You do not have permission to access this resource.',
    );
    assert.equal(adminResponse.body.message, tenantResponse.body.message);
  });

  it('returns tenant and property details for only the current owner', async () => {
    const response = await request(app)
      .get('/api/rental-requests/owner-requests')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.count, 3);
    assert.equal(response.body.data.rentalRequests.length, 3);
    assert.ok(
      response.body.data.rentalRequests.every(
        (rentalRequest) => rentalRequest.ownerId === owner.id,
      ),
    );
    assert.ok(
      response.body.data.rentalRequests.every(
        (rentalRequest) => rentalRequest.propertyId === ownerPropertyId,
      ),
    );
    assert.equal(
      response.body.data.rentalRequests[0].tenantName,
      'Owner Workflow Tenant',
    );
    assert.equal(
      response.body.data.rentalRequests[0].propertyTitle,
      'Owner Request Apartment',
    );
    assert.equal(typeof response.body.data.rentalRequests[0].createdAt, 'string');
    assert.equal(
      response.body.data.rentalRequests.some(
        (rentalRequest) => rentalRequest.id === otherOwnerRequestId,
      ),
      false,
    );
  });

  it('validates the request ID and decision status', async () => {
    const [invalidIdResponse, invalidStatusResponse] = await Promise.all([
      request(app)
        .patch('/api/rental-requests/not-a-number/status')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'approved' }),
      request(app)
        .patch(`/api/rental-requests/${acceptRequestId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'completed' }),
    ]);

    assert.equal(invalidIdResponse.status, 400);
    assert.ok(invalidIdResponse.body.details.requestId);
    assert.equal(invalidStatusResponse.status, 400);
    assert.ok(invalidStatusResponse.body.details.status);
  });

  it('prevents an owner from managing another owner property request', async () => {
    const response = await request(app)
      .patch(`/api/rental-requests/${otherOwnerRequestId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'approved' });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Rental request not found.');

    const [rows] = await pool.execute(
      'SELECT status FROM rental_requests WHERE id = ?',
      [otherOwnerRequestId],
    );
    assert.equal(rows[0].status, 'pending');

    const otherOwnerResponse = await request(app)
      .get('/api/rental-requests/owner-requests')
      .set('Authorization', `Bearer ${otherOwnerToken}`);
    assert.equal(otherOwnerResponse.status, 200);
    assert.equal(otherOwnerResponse.body.data.count, 1);
    assert.equal(
      otherOwnerResponse.body.data.rentalRequests[0].id,
      otherOwnerRequestId,
    );
  });

  it('accepts a pending owned request and persists the approved status', async () => {
    const response = await request(app)
      .patch(`/api/rental-requests/${acceptRequestId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'approved' });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Rental request accepted successfully.');
    assert.equal(response.body.data.rentalRequest.id, acceptRequestId);
    assert.equal(response.body.data.rentalRequest.status, 'approved');
    assert.equal(response.body.data.rentalRequest.ownerId, owner.id);

    const [rows] = await pool.execute(
      'SELECT status FROM rental_requests WHERE id = ?',
      [acceptRequestId],
    );
    assert.equal(rows[0].status, 'approved');
  });

  it('rejects a pending owned request and persists the rejected status', async () => {
    const response = await request(app)
      .patch(`/api/rental-requests/${rejectRequestId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'rejected' });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Rental request rejected successfully.');
    assert.equal(response.body.data.rentalRequest.status, 'rejected');

    const [rows] = await pool.execute(
      'SELECT status FROM rental_requests WHERE id = ?',
      [rejectRequestId],
    );
    assert.equal(rows[0].status, 'rejected');
  });

  it('prevents repeat decisions on requests that are no longer pending', async () => {
    const responses = await Promise.all([
      request(app)
        .patch(`/api/rental-requests/${acceptRequestId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'rejected' }),
      request(app)
        .patch(`/api/rental-requests/${approvedRequestId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'rejected' }),
    ]);

    responses.forEach((response) => {
      assert.equal(response.status, 409);
      assert.equal(
        response.body.message,
        'Only pending rental requests can be accepted or rejected.',
      );
    });
  });
});
