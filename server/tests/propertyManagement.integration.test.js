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
const ownerEmail = `management.owner.${testId}@rentease.test`;
const otherOwnerEmail = `management.other.${testId}@rentease.test`;
const tenantEmail = `management.tenant.${testId}@rentease.test`;
const passwordHash =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
let owner;
let otherOwner;
let tenant;
let ownerToken;
let otherOwnerToken;
let tenantToken;
let propertyId;

const validUpdate = {
  title: '  Updated Management Apartment  ',
  propertyType: 'villa',
  description: '  Updated description with better natural light.  ',
  price: '125000',
  city: '  Lahore  ',
  address: '  Block C, DHA Phase 6, Lahore  ',
  bedrooms: '4',
  bathrooms: '3.5',
  area: '2100',
  imageUrl: 'https://example.test/updated-management.jpg',
  propertyStatus: 'available',
  contactNumber: '+92 300 5556677',
};

describe('Owner property management API', { concurrency: false }, () => {
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
        'Management Test Owner',
        ownerEmail,
        passwordHash,
        'owner',
        'Other Management Owner',
        otherOwnerEmail,
        passwordHash,
        'owner',
        'Management Test Tenant',
        tenantEmail,
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
      [ownerEmail, otherOwnerEmail, tenantEmail],
    );
    const usersByEmail = new Map(users.map((user) => [user.email, user]));

    owner = usersByEmail.get(ownerEmail);
    otherOwner = usersByEmail.get(otherOwnerEmail);
    tenant = usersByEmail.get(tenantEmail);
    ownerToken = createAccessToken(owner);
    otherOwnerToken = createAccessToken(otherOwner);
    tenantToken = createAccessToken(tenant);

    const [property] = await pool.execute(
      `
        INSERT INTO properties (
          owner_id,
          title,
          description,
          property_type,
          property_category,
          price,
          city,
          area,
          address,
          bedrooms,
          bathrooms,
          property_size,
          size_unit,
          availability_status,
          approval_status,
          image_url,
          contact_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        owner.id,
        `Management Apartment ${testId}`,
        'Property used to verify owner-only edit and delete operations.',
        'apartment',
        'residential',
        95000,
        'Islamabad',
        'Islamabad',
        'Street 8, F-10, Islamabad',
        2,
        2,
        1200,
        'sq_ft',
        'available',
        'approved',
        'https://example.test/management.jpg',
        '+92 300 1112233',
      ],
    );
    propertyId = property.insertId;
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

  it('rejects management requests without authentication', async () => {
    const [edit, remove] = await Promise.all([
      request(app).put(`/api/properties/${propertyId}`).send(validUpdate),
      request(app).delete(`/api/properties/${propertyId}`),
    ]);

    assert.equal(edit.status, 401);
    assert.equal(remove.status, 401);
  });

  it('rejects tenants and other owners from managing the property', async () => {
    const [tenantEdit, otherOwnerRead, otherOwnerEdit, otherOwnerDelete] =
      await Promise.all([
        request(app)
          .put(`/api/properties/${propertyId}`)
          .set('Authorization', `Bearer ${tenantToken}`)
          .send(validUpdate),
        request(app)
          .get(`/api/properties/${propertyId}/manage`)
          .set('Authorization', `Bearer ${otherOwnerToken}`),
        request(app)
          .put(`/api/properties/${propertyId}`)
          .set('Authorization', `Bearer ${otherOwnerToken}`)
          .send(validUpdate),
        request(app)
          .delete(`/api/properties/${propertyId}`)
          .set('Authorization', `Bearer ${otherOwnerToken}`),
      ]);

    assert.equal(tenantEdit.status, 403);
    assert.equal(otherOwnerRead.status, 403);
    assert.equal(otherOwnerEdit.status, 403);
    assert.equal(otherOwnerDelete.status, 403);
    assert.equal(
      tenantEdit.body.message,
      'You do not have permission to access this resource.',
    );
    assert.equal(
      otherOwnerRead.body.message,
      'You do not have permission to manage this property.',
    );
    assert.equal(otherOwnerEdit.body.message, otherOwnerRead.body.message);
    assert.equal(otherOwnerDelete.body.message, otherOwnerRead.body.message);
  });

  it('returns the complete property to its owner for editing', async () => {
    const response = await request(app)
      .get(`/api/properties/${propertyId}/manage`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.property.id, propertyId);
    assert.equal(response.body.data.property.description, 'Property used to verify owner-only edit and delete operations.');
    assert.equal(response.body.data.property.area, 1200);
    assert.equal(response.body.data.property.contactNumber, '+92 300 1112233');
  });

  it('allows valid zero room counts for commercial properties', async () => {
    const response = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        ...validUpdate,
        propertyType: 'office',
        bedrooms: '0',
        bathrooms: '0',
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.property.propertyType, 'office');
    assert.equal(response.body.data.property.bedrooms, 0);
    assert.equal(response.body.data.property.bathrooms, 0);
  });

  it('preserves the stored area unit while editing a property', async () => {
    await pool.execute(
      'UPDATE properties SET property_size = ?, size_unit = ? WHERE id = ?',
      [10, 'marla', propertyId],
    );

    const response = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ ...validUpdate, area: '12' });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.property.area, 12);
    assert.equal(response.body.data.property.sizeUnit, 'marla');

    await pool.execute(
      'UPDATE properties SET size_unit = ? WHERE id = ?',
      ['sq_ft', propertyId],
    );
  });

  it('validates and updates only the authenticated owner property', async () => {
    const invalidResponse = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ ...validUpdate, price: '-10', imageUrl: 'javascript:alert(1)' });

    assert.equal(invalidResponse.status, 400);
    assert.ok(invalidResponse.body.details.price);
    assert.ok(invalidResponse.body.details.imageUrl);

    const response = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ ...validUpdate, ownerId: otherOwner.id });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Property updated successfully.');
    assert.equal(response.body.data.property.ownerId, owner.id);
    assert.equal(response.body.data.property.title, 'Updated Management Apartment');
    assert.equal(response.body.data.property.propertyType, 'villa');
    assert.equal(response.body.data.property.city, 'Lahore');
    assert.equal(response.body.data.property.area, 2100);
    assert.equal(response.body.data.property.contactNumber, validUpdate.contactNumber);

    const publicResponse = await request(app)
      .get('/api/properties')
      .query({ search: 'Updated Management Apartment' });
    assert.equal(publicResponse.status, 200);
    assert.equal(publicResponse.body.data.totalCount, 1);
    assert.equal(publicResponse.body.data.properties[0].id, propertyId);
  });

  it('deletes the owner property and removes it from dashboard and public listings', async () => {
    const response = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Property deleted successfully.');
    assert.equal(response.body.data.propertyId, propertyId);

    const [dashboard, publicListings] = await Promise.all([
      request(app)
        .get('/api/owner/dashboard')
        .set('Authorization', `Bearer ${ownerToken}`),
      request(app)
        .get('/api/properties')
        .query({ search: 'Updated Management Apartment' }),
    ]);

    assert.equal(dashboard.status, 200);
    assert.equal(
      dashboard.body.data.properties.some((property) => property.id === propertyId),
      false,
    );
    assert.equal(publicListings.status, 200);
    assert.equal(publicListings.body.data.totalCount, 0);
  });
});
