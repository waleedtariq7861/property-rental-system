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
  admin: `management.admin.${testId}@rentease.test`,
  owner: `management.owner.${testId}@rentease.test`,
  tenant: `management.tenant.${testId}@rentease.test`,
  deletable: `management.deletable.${testId}@rentease.test`,
};

let admin;
let owner;
let tenant;
let deletableUser;
let adminToken;
let ownerToken;
let tenantToken;
let spoofedAdminToken;
let protectedPropertyId;
let removablePropertyId;

describe('Admin management API', { concurrency: false }, () => {
  before(async () => {
    await pool.execute(
      `
        INSERT INTO users (full_name, email, phone, password_hash, role)
        VALUES
          (?, ?, ?, ?, 'admin'),
          (?, ?, ?, ?, 'owner'),
          (?, ?, ?, ?, 'tenant'),
          (?, ?, ?, ?, 'tenant')
      `,
      [
        'Day Five Administrator',
        emails.admin,
        '+92-300-5500001',
        passwordHash,
        'Day Five Property Owner',
        emails.owner,
        '+92-300-5500002',
        passwordHash,
        'Day Five Tenant',
        emails.tenant,
        '+92-300-5500003',
        passwordHash,
        'Day Five New Tenant',
        emails.deletable,
        '+92-300-5500004',
        passwordHash,
      ],
    );

    const [users] = await pool.execute(
      `
        SELECT id, full_name AS fullName, email, role
        FROM users
        WHERE email IN (?, ?, ?, ?)
      `,
      [emails.admin, emails.owner, emails.tenant, emails.deletable],
    );
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    admin = usersByEmail.get(emails.admin);
    owner = usersByEmail.get(emails.owner);
    tenant = usersByEmail.get(emails.tenant);
    deletableUser = usersByEmail.get(emails.deletable);
    adminToken = createAccessToken(admin);
    ownerToken = createAccessToken(owner);
    tenantToken = createAccessToken(tenant);
    spoofedAdminToken = createAccessToken({ ...owner, role: 'admin' });

    const [protectedProperty] = await pool.execute(
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
        ) VALUES (?, ?, ?, 'apartment', 90000, 'Islamabad', 'G-11', ?, 2, 2, 'available', 'approved')
      `,
      [
        owner.id,
        `Protected Admin Listing ${testId}`,
        'A listing with rental history that must be preserved.',
        'Street 12, G-11, Islamabad',
      ],
    );
    protectedPropertyId = protectedProperty.insertId;

    const [removableProperty] = await pool.execute(
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
        ) VALUES (?, ?, ?, 'studio', 45000, 'Lahore', 'Gulberg', ?, 1, 1, 'available', 'pending')
      `,
      [
        owner.id,
        `Removable Admin Listing ${testId}`,
        'An unreviewed listing with no rental history.',
        'Main Boulevard, Gulberg, Lahore',
      ],
    );
    removablePropertyId = removableProperty.insertId;

    await pool.execute(
      `
        INSERT INTO rental_requests (
          property_id,
          tenant_id,
          owner_id,
          status,
          message
        ) VALUES (?, ?, ?, 'pending', ?)
      `,
      [
        protectedPropertyId,
        tenant.id,
        owner.id,
        'Please preserve this rental history.',
      ],
    );
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute('DELETE FROM rental_requests WHERE owner_id = ?', [
        owner.id,
      ]);
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [owner.id]);
    }

    await pool.execute(
      'DELETE FROM users WHERE email IN (?, ?, ?, ?)',
      [emails.admin, emails.owner, emails.tenant, emails.deletable],
    );
    await pool.end();
  });

  it('secures every management action with authentication and the current admin role', async () => {
    const responses = await Promise.all([
      request(app)
        .patch(`/api/admin/users/${tenant.id}/status`)
        .send({ accountStatus: 'deactivated' }),
      request(app)
        .patch(`/api/admin/users/${tenant.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ accountStatus: 'deactivated' }),
      request(app)
        .delete(`/api/admin/properties/${removablePropertyId}`)
        .set('Authorization', `Bearer ${tenantToken}`),
      request(app)
        .delete(`/api/admin/users/${deletableUser.id}`)
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

  it('validates management resource IDs and account status payloads', async () => {
    const [invalidUserId, invalidStatus, invalidPropertyId] = await Promise.all([
      request(app)
        .patch('/api/admin/users/not-a-number/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ accountStatus: 'active' }),
      request(app)
        .patch(`/api/admin/users/${tenant.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ accountStatus: 'suspended' }),
      request(app)
        .delete('/api/admin/properties/0')
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    assert.equal(invalidUserId.status, 400);
    assert.equal(
      invalidUserId.body.details.userId,
      'User ID must be a positive integer.',
    );
    assert.equal(invalidStatus.status, 400);
    assert.equal(
      invalidStatus.body.details.accountStatus,
      'Account status must be active or deactivated.',
    );
    assert.equal(invalidPropertyId.status, 400);
    assert.equal(
      invalidPropertyId.body.details.propertyId,
      'Property ID must be a positive integer.',
    );
  });

  it('reports dependency counts used to protect historical platform data', async () => {
    const [usersResponse, propertiesResponse] = await Promise.all([
      request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .get('/api/admin/properties')
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    const returnedOwner = usersResponse.body.data.users.find(
      (user) => user.id === owner.id,
    );
    const returnedTenant = usersResponse.body.data.users.find(
      (user) => user.id === tenant.id,
    );
    const protectedProperty = propertiesResponse.body.data.properties.find(
      (property) => property.id === protectedPropertyId,
    );
    const removableProperty = propertiesResponse.body.data.properties.find(
      (property) => property.id === removablePropertyId,
    );

    assert.equal(returnedOwner.propertyCount, 2);
    assert.equal(returnedOwner.rentalRequestCount, 1);
    assert.equal(returnedTenant.propertyCount, 0);
    assert.equal(returnedTenant.rentalRequestCount, 1);
    assert.equal(protectedProperty.rentalRequestCount, 1);
    assert.equal(removableProperty.rentalRequestCount, 0);
  });

  it('deactivates and reactivates a user with immediate token revocation', async () => {
    const deactivateResponse = await request(app)
      .patch(`/api/admin/users/${tenant.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ accountStatus: 'deactivated' });

    assert.equal(deactivateResponse.status, 200);
    assert.equal(deactivateResponse.body.data.user.accountStatus, 'deactivated');
    const [[deactivatedUser]] = await pool.execute(
      'SELECT account_status AS accountStatus FROM users WHERE id = ?',
      [tenant.id],
    );
    assert.equal(deactivatedUser.accountStatus, 'deactivated');

    const revokedResponse = await request(app)
      .get('/api/rental-requests/my-requests')
      .set('Authorization', `Bearer ${tenantToken}`);
    assert.equal(revokedResponse.status, 401);
    assert.equal(revokedResponse.body.message, 'Your account is not active.');

    const reactivateResponse = await request(app)
      .patch(`/api/admin/users/${tenant.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ accountStatus: 'active' });
    assert.equal(reactivateResponse.status, 200);
    assert.equal(reactivateResponse.body.data.user.accountStatus, 'active');

    const restoredResponse = await request(app)
      .get('/api/rental-requests/my-requests')
      .set('Authorization', `Bearer ${tenantToken}`);
    assert.equal(restoredResponse.status, 200);
  });

  it('protects the current administrator from self-deactivation and self-deletion', async () => {
    const [statusResponse, deleteResponse] = await Promise.all([
      request(app)
        .patch(`/api/admin/users/${admin.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ accountStatus: 'deactivated' }),
      request(app)
        .delete(`/api/admin/users/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    assert.equal(statusResponse.status, 409);
    assert.equal(
      statusResponse.body.message,
      'You cannot change the status of your own administrator account.',
    );
    assert.equal(deleteResponse.status, 409);
    assert.equal(
      deleteResponse.body.message,
      'You cannot delete your own administrator account.',
    );
  });

  it('deletes eligible users and preserves users with property or rental history', async () => {
    const protectedResponse = await request(app)
      .delete(`/api/admin/users/${tenant.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(protectedResponse.status, 409);
    assert.equal(
      protectedResponse.body.message,
      'This user cannot be deleted because they have property or rental history. Deactivate the account instead.',
    );

    const deleteResponse = await request(app)
      .delete(`/api/admin/users/${deletableUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.data.userId, deletableUser.id);

    const [[deletedUserCount]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM users WHERE id = ?',
      [deletableUser.id],
    );
    assert.equal(Number(deletedUserCount.count), 0);
  });

  it('removes eligible listings and preserves properties with rental history', async () => {
    const protectedResponse = await request(app)
      .delete(`/api/admin/properties/${protectedPropertyId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(protectedResponse.status, 409);
    assert.equal(
      protectedResponse.body.message,
      'This property cannot be deleted because it has rental history.',
    );

    const deleteResponse = await request(app)
      .delete(`/api/admin/properties/${removablePropertyId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.data.propertyId, removablePropertyId);

    const [databaseRows] = await pool.execute(
      'SELECT id FROM properties WHERE id = ?',
      [removablePropertyId],
    );
    assert.equal(databaseRows.length, 0);

    const adminListResponse = await request(app)
      .get('/api/admin/properties')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(
      adminListResponse.body.data.properties.some(
        (property) => property.id === removablePropertyId,
      ),
      false,
    );
  });
});
