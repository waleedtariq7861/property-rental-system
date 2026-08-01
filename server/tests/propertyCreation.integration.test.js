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
const ownerEmail = `creation.owner.${testId}@rentease.test`;
const tenantEmail = `creation.tenant.${testId}@rentease.test`;
const passwordHash =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
let owner;
let tenant;
let ownerToken;
let tenantToken;
let createdPropertyId;

const validPayload = {
  title: '  Day 4 Garden Apartment  ',
  propertyType: 'apartment',
  description:
    '  A bright apartment with a private terrace and convenient city access.  ',
  price: '97500.50',
  city: '  Islamabad  ',
  address: '  Street 10, F-10/2, Islamabad  ',
  bedrooms: '3',
  bathrooms: '2.5',
  area: '1450.75',
  imageUrl: 'https://example.test/day-4-property.jpg',
  propertyStatus: 'available',
  contactNumber: '+92 300 7654321',
};

describe('Property creation API', { concurrency: false }, () => {
  before(async () => {
    await pool.execute(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES
          (?, ?, ?, ?),
          (?, ?, ?, ?)
      `,
      [
        'Day 4 Property Owner',
        ownerEmail,
        passwordHash,
        'owner',
        'Day 4 Tenant',
        tenantEmail,
        passwordHash,
        'tenant',
      ],
    );

    const [createdUsers] = await pool.execute(
      `
        SELECT id, full_name AS fullName, email, role
        FROM users
        WHERE email IN (?, ?)
      `,
      [ownerEmail, tenantEmail],
    );
    const usersByEmail = new Map(
      createdUsers.map((user) => [user.email, user]),
    );

    owner = usersByEmail.get(ownerEmail);
    tenant = usersByEmail.get(tenantEmail);
    ownerToken = createAccessToken(owner);
    tenantToken = createAccessToken(tenant);
  });

  after(async () => {
    if (owner?.id) {
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [owner.id]);
      await pool.execute(
        'DELETE FROM users WHERE id IN (?, ?)',
        [owner.id, tenant.id],
      );
    }

    await pool.end();
  });

  it('rejects creation without a JWT', async () => {
    const response = await request(app)
      .post('/api/properties')
      .send(validPayload);

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Authentication token is required.');
    assert.equal(response.body.data, null);
  });

  it('rejects a tenant from creating a property', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send(validPayload);

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.equal(
      response.body.message,
      'You do not have permission to access this resource.',
    );
  });

  it('returns clear field errors for an invalid property', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: '   ',
        propertyType: 'castle',
        description: '',
        price: '-1',
        city: '',
        address: '',
        bedrooms: '-1',
        bathrooms: '2.55',
        area: '-25',
        imageUrl: 'javascript:alert(1)',
        propertyStatus: 'hidden',
        contactNumber: 'phone-me',
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Validation failed');
    assert.ok(response.body.details.title);
    assert.ok(response.body.details.propertyType);
    assert.ok(response.body.details.description);
    assert.ok(response.body.details.price);
    assert.ok(response.body.details.city);
    assert.ok(response.body.details.address);
    assert.ok(response.body.details.bedrooms);
    assert.ok(response.body.details.bathrooms);
    assert.ok(response.body.details.area);
    assert.ok(response.body.details.imageUrl);
    assert.ok(response.body.details.propertyStatus);
    assert.ok(response.body.details.contactNumber);
  });

  it('creates a trimmed property for the authenticated owner', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        ...validPayload,
        ownerId: tenant.id,
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Property created successfully.');
    assert.equal(response.body.data.property.ownerId, owner.id);
    assert.equal(response.body.data.property.title, 'Day 4 Garden Apartment');
    assert.equal(response.body.data.property.city, 'Islamabad');
    assert.equal(response.body.data.property.propertyType, 'apartment');
    assert.equal(response.body.data.property.price, 97500.5);
    assert.equal(response.body.data.property.area, 1450.75);
    assert.equal(response.body.data.property.sizeUnit, 'sq_ft');
    assert.equal(response.body.data.property.propertyStatus, 'available');
    assert.equal(
      response.body.data.property.contactNumber,
      validPayload.contactNumber,
    );

    createdPropertyId = response.body.data.property.id;
    const [rows] = await pool.execute(
      `
        SELECT
          owner_id AS ownerId,
          title,
          city,
          area AS locationArea,
          property_size AS propertySize,
          size_unit AS sizeUnit,
          availability_status AS availabilityStatus,
          approval_status AS approvalStatus,
          contact_number AS contactNumber,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM properties
        WHERE id = ?
      `,
      [createdPropertyId],
    );

    assert.equal(rows[0].ownerId, owner.id);
    assert.equal(rows[0].title, 'Day 4 Garden Apartment');
    assert.equal(rows[0].city, 'Islamabad');
    assert.equal(rows[0].locationArea, 'Islamabad');
    assert.equal(rows[0].propertySize, 1450.75);
    assert.equal(rows[0].sizeUnit, 'sq_ft');
    assert.equal(rows[0].availabilityStatus, 'available');
    assert.equal(rows[0].approvalStatus, 'approved');
    assert.equal(rows[0].contactNumber, validPayload.contactNumber);
    assert.ok(rows[0].createdAt);
    assert.ok(rows[0].updatedAt);
  });

  it('shows the new property in the owner dashboard immediately', async () => {
    const response = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.statistics.totalProperties, 1);
    assert.equal(response.body.data.statistics.activeListings, 1);
    assert.equal(response.body.data.statistics.recentlyAddedProperties, 1);
    assert.equal(response.body.data.properties[0].id, createdPropertyId);
  });

  it('shows the available new property in public listings immediately', async () => {
    const response = await request(app)
      .get('/api/properties')
      .query({ search: 'Day 4 Garden Apartment' });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.totalCount, 1);
    assert.equal(response.body.data.properties[0].id, createdPropertyId);
    assert.equal(
      response.body.data.properties[0].contactNumber,
      validPayload.contactNumber,
    );
  });
});
