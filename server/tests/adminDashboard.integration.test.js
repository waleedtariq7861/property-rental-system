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
  admin: `dashboard.admin.${testId}@rentease.test`,
  owner: `dashboard.owner.${testId}@rentease.test`,
  tenant: `dashboard.tenant.${testId}@rentease.test`,
};
let admin;
let owner;
let tenant;
let adminToken;
let ownerToken;
let tenantToken;
let spoofedAdminToken;
let availablePropertyId;
let rentedPropertyId;
let pendingRequestId;
let approvedRequestId;
let baselineCounts;

describe('Admin dashboard read-only API', { concurrency: false }, () => {
  before(async () => {
    const [[counts]] = await pool.execute(
      `
        SELECT
          (SELECT COUNT(*) FROM users) AS totalUsers,
          (SELECT COUNT(*) FROM users WHERE role = 'owner') AS totalOwners,
          (SELECT COUNT(*) FROM users WHERE role = 'tenant') AS totalTenants,
          (SELECT COUNT(*) FROM properties) AS totalProperties,
          (SELECT COUNT(*) FROM rental_requests) AS totalRentalRequests
      `,
    );
    baselineCounts = counts;

    await pool.execute(
      `
        INSERT INTO users (full_name, email, phone, password_hash, role)
        VALUES
          (?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?)
      `,
      [
        'Day Four Administrator',
        emails.admin,
        '+92-300-4400001',
        passwordHash,
        'admin',
        'Day Four Property Owner',
        emails.owner,
        '+92-300-4400002',
        passwordHash,
        'owner',
        'Day Four Tenant',
        emails.tenant,
        '+92-300-4400003',
        passwordHash,
        'tenant',
      ],
    );

    const [users] = await pool.execute(
      `
        SELECT id, full_name AS fullName, email, role
        FROM users
        WHERE email IN (?, ?, ?)
      `,
      [emails.admin, emails.owner, emails.tenant],
    );
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    admin = usersByEmail.get(emails.admin);
    owner = usersByEmail.get(emails.owner);
    tenant = usersByEmail.get(emails.tenant);
    adminToken = createAccessToken(admin);
    ownerToken = createAccessToken(owner);
    tenantToken = createAccessToken(tenant);
    spoofedAdminToken = createAccessToken({ ...owner, role: 'admin' });

    const [availableProperty] = await pool.execute(
      `
        INSERT INTO properties (
          owner_id,
          title,
          description,
          property_type,
          property_category,
          price,
          security_deposit,
          city,
          area,
          address,
          bedrooms,
          bathrooms,
          property_size,
          size_unit,
          furnished_status,
          parking_available,
          availability_status,
          approval_status,
          image_url,
          contact_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        owner.id,
        `Admin Dashboard Apartment ${testId}`,
        'A complete property record for the Day 4 administrator dashboard.',
        'apartment',
        'residential',
        97500,
        195000,
        'Islamabad',
        'F-10',
        'Street 16, F-10, Islamabad',
        2,
        2,
        1250,
        'sq_ft',
        'furnished',
        true,
        'available',
        'approved',
        'https://example.test/admin-dashboard-apartment.jpg',
        '+92-300-4400002',
      ],
    );
    availablePropertyId = availableProperty.insertId;

    const [rentedProperty] = await pool.execute(
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
        `Admin Dashboard House ${testId}`,
        'A second property with a different listing status.',
        'house',
        155000,
        'Rawalpindi',
        'Bahria Town',
        'Phase 7, Bahria Town, Rawalpindi',
        4,
        3,
        'rented',
        'approved',
      ],
    );
    rentedPropertyId = rentedProperty.insertId;

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
          (?, ?, ?, 'approved', ?)
      `,
      [
        availablePropertyId,
        tenant.id,
        owner.id,
        'Please arrange a viewing for the apartment.',
        rentedPropertyId,
        tenant.id,
        owner.id,
        'This request has already been accepted.',
      ],
    );
    pendingRequestId = rentalRequests.insertId;
    approvedRequestId = pendingRequestId + 1;
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute('DELETE FROM rental_requests WHERE owner_id = ?', [
        owner.id,
      ]);
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [owner.id]);
      await pool.execute('DELETE FROM users WHERE id IN (?, ?, ?)', [
        admin.id,
        owner.id,
        tenant.id,
      ]);
    }

    await pool.end();
  });

  it('requires authentication and the current admin database role', async () => {
    const responses = await Promise.all([
      request(app).get('/api/admin/dashboard'),
      request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${ownerToken}`),
      request(app)
        .get('/api/admin/properties')
        .set('Authorization', `Bearer ${tenantToken}`),
      request(app)
        .get('/api/admin/rental-requests')
        .set('Authorization', `Bearer ${spoofedAdminToken}`),
    ]);

    assert.equal(responses[0].status, 401);
    responses.slice(1).forEach((response) => {
      assert.equal(response.status, 403);
      assert.equal(
        response.body.message,
        'You do not have permission to access this resource.',
      );
    });
  });

  it('returns complete statistics and recent platform activity', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.admin.id, admin.id);
    assert.equal(response.body.data.admin.role, 'admin');
    assert.equal(
      response.body.data.statistics.totalUsers,
      Number(baselineCounts.totalUsers) + 3,
    );
    assert.equal(
      response.body.data.statistics.totalOwners,
      Number(baselineCounts.totalOwners) + 1,
    );
    assert.equal(
      response.body.data.statistics.totalTenants,
      Number(baselineCounts.totalTenants) + 1,
    );
    assert.equal(
      response.body.data.statistics.totalProperties,
      Number(baselineCounts.totalProperties) + 2,
    );
    assert.equal(
      response.body.data.statistics.totalRentalRequests,
      Number(baselineCounts.totalRentalRequests) + 2,
    );
    assert.ok(response.body.data.recentUsers.length <= 5);
    assert.ok(response.body.data.recentProperties.length <= 5);
    assert.ok(response.body.data.recentRequests.length <= 5);
    assert.ok(
      response.body.data.recentUsers.some((user) => user.id === admin.id),
    );
    assert.ok(
      response.body.data.recentProperties.some(
        (property) => property.id === availablePropertyId,
      ),
    );
    assert.ok(
      response.body.data.recentRequests.some(
        (rentalRequest) => rentalRequest.id === pendingRequestId,
      ),
    );
  });

  it('returns all users with safe account details only', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.count, response.body.data.users.length);
    const returnedTenant = response.body.data.users.find(
      (user) => user.id === tenant.id,
    );
    assert.equal(returnedTenant.fullName, 'Day Four Tenant');
    assert.equal(returnedTenant.email, emails.tenant);
    assert.equal(returnedTenant.phone, '+92-300-4400003');
    assert.equal(returnedTenant.role, 'tenant');
    assert.equal(returnedTenant.accountStatus, 'active');
    assert.equal(typeof returnedTenant.createdAt, 'string');
    assert.equal('passwordHash' in returnedTenant, false);
    assert.equal('password_hash' in returnedTenant, false);
  });

  it('returns all properties with owner and complete listing details', async () => {
    const response = await request(app)
      .get('/api/admin/properties')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.count, response.body.data.properties.length);
    const property = response.body.data.properties.find(
      (item) => item.id === availablePropertyId,
    );
    assert.equal(property.ownerId, owner.id);
    assert.equal(property.ownerName, 'Day Four Property Owner');
    assert.equal(property.ownerEmail, emails.owner);
    assert.equal(property.propertyType, 'apartment');
    assert.equal(property.propertyCategory, 'residential');
    assert.equal(Number(property.price), 97500);
    assert.equal(Number(property.securityDeposit), 195000);
    assert.equal(property.city, 'Islamabad');
    assert.equal(Number(property.propertySize), 1250);
    assert.equal(property.furnishedStatus, 'furnished');
    assert.equal(property.availabilityStatus, 'available');
    assert.equal(property.approvalStatus, 'approved');
  });

  it('returns all rental requests with tenant, owner, property, and status details', async () => {
    const response = await request(app)
      .get('/api/admin/rental-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(response.status, 200);
    assert.equal(
      response.body.data.count,
      response.body.data.rentalRequests.length,
    );
    const pendingRequest = response.body.data.rentalRequests.find(
      (rentalRequest) => rentalRequest.id === pendingRequestId,
    );
    const approvedRequest = response.body.data.rentalRequests.find(
      (rentalRequest) => rentalRequest.id === approvedRequestId,
    );
    assert.equal(
      pendingRequest.propertyTitle,
      `Admin Dashboard Apartment ${testId}`,
    );
    assert.equal(pendingRequest.tenantName, 'Day Four Tenant');
    assert.equal(pendingRequest.tenantEmail, emails.tenant);
    assert.equal(pendingRequest.ownerName, 'Day Four Property Owner');
    assert.equal(pendingRequest.ownerEmail, emails.owner);
    assert.equal(pendingRequest.status, 'pending');
    assert.equal(approvedRequest.status, 'approved');
  });
});
