import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
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
const ownerEmail = `property.owner.${testId}@rentease.test`;
let ownerId;
let olderPropertyId;
let newerPropertyId;
let hiddenPropertyId;

describe('Property listing API', { concurrency: false }, () => {
  before(async () => {
    const [ownerResult] = await pool.execute(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `,
      [
        'Property API Test Owner',
        ownerEmail,
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'owner',
      ],
    );

    ownerId = ownerResult.insertId;
    const olderCreatedAt = new Date(Date.now() - 60_000);
    const newerCreatedAt = new Date();

    const [olderResult] = await pool.execute(
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
        `Older API Apartment ${testId}`,
        'An older public fixture used to verify property ordering.',
        'apartment',
        74000,
        'Islamabad',
        'G-11',
        'Street 12, G-11, Islamabad',
        2,
        2,
        'available',
        'approved',
        'https://example.test/older-apartment.jpg',
        olderCreatedAt,
      ],
    );
    olderPropertyId = olderResult.insertId;

    const [newerResult] = await pool.execute(
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
        `Newer API Villa ${testId}`,
        'A newer public fixture used to verify single-property retrieval.',
        'villa',
        280000,
        'Lahore',
        'DHA Phase 5',
        'Block B, DHA Phase 5, Lahore',
        5,
        5.5,
        'available',
        'approved',
        'https://example.test/newer-villa.jpg',
        newerCreatedAt,
      ],
    );
    newerPropertyId = newerResult.insertId;

    const [hiddenResult] = await pool.execute(
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
        ownerId,
        `Unavailable API House ${testId}`,
        'This fixture must not appear in public property responses.',
        'house',
        95000,
        'Rawalpindi',
        'Bahria Town',
        'Phase 4, Bahria Town, Rawalpindi',
        3,
        3,
        'rented',
        'approved',
      ],
    );
    hiddenPropertyId = hiddenResult.insertId;
  });

  after(async () => {
    if (ownerId) {
      await pool.execute('DELETE FROM properties WHERE owner_id = ?', [ownerId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [ownerId]);
    }

    await pool.end();
  });

  it('returns available approved properties with newest entries first', async () => {
    const response = await request(app).get('/api/properties');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Properties retrieved successfully.');
    assert.ok(Array.isArray(response.body.data.properties));
    assert.equal(response.body.data.count, response.body.data.properties.length);
    assert.ok(response.body.data.totalCount >= response.body.data.count);
    assert.equal(response.body.data.currentPage, 1);
    assert.ok(response.body.data.totalPages >= 1);

    const propertyIds = response.body.data.properties.map((property) => property.id);
    const newerIndex = propertyIds.indexOf(newerPropertyId);
    const olderIndex = propertyIds.indexOf(olderPropertyId);

    assert.ok(newerIndex >= 0);
    assert.ok(olderIndex >= 0);
    assert.ok(newerIndex < olderIndex);
    assert.equal(propertyIds.includes(hiddenPropertyId), false);
  });

  it('returns one available property with public listing fields', async () => {
    const response = await request(app).get(`/api/properties/${newerPropertyId}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.property.id, newerPropertyId);
    assert.equal(response.body.data.property.ownerId, ownerId);
    assert.equal(response.body.data.property.propertyType, 'villa');
    assert.equal(response.body.data.property.price, 280000);
    assert.equal(response.body.data.property.city, 'Lahore');
    assert.equal(response.body.data.property.ownerName, 'Property API Test Owner');
    assert.equal(typeof response.body.data.property.imageUrl, 'string');
  });

  it('searches title, city, and address without case sensitivity', async () => {
    const [titleResponse, cityResponse, addressResponse] = await Promise.all([
      request(app)
        .get('/api/properties')
        .query({ search: `older api apartment ${testId}`.toUpperCase() }),
      request(app).get('/api/properties').query({ search: 'lAhOrE' }),
      request(app).get('/api/properties').query({ search: 'block b, dha phase 5' }),
    ]);

    assert.equal(titleResponse.status, 200);
    assert.deepEqual(
      titleResponse.body.data.properties.map((property) => property.id),
      [olderPropertyId],
    );
    assert.equal(
      cityResponse.body.data.properties.some(
        (property) => property.id === newerPropertyId,
      ),
      true,
    );
    assert.equal(
      addressResponse.body.data.properties.some(
        (property) => property.id === newerPropertyId,
      ),
      true,
    );
  });

  it('combines property filters correctly', async () => {
    const response = await request(app).get('/api/properties').query({
      search: `Newer API Villa ${testId}`,
      city: 'lahore',
      propertyType: 'VILLA',
      minPrice: '200000',
      maxPrice: '300000',
      bedrooms: '5',
      sort: 'price_asc',
      page: '1',
      limit: '5',
    });

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.data.properties.map((property) => property.id),
      [newerPropertyId],
    );
    assert.equal(response.body.data.totalCount, 1);
    assert.equal(response.body.data.currentPage, 1);
    assert.equal(response.body.data.totalPages, 1);
  });

  it('sorts and paginates while preserving the active search', async () => {
    const firstPage = await request(app).get('/api/properties').query({
      search: testId,
      sort: 'price_asc',
      page: '1',
      limit: '1',
    });
    const secondPage = await request(app).get('/api/properties').query({
      search: testId,
      sort: 'price_asc',
      page: '2',
      limit: '1',
    });

    assert.equal(firstPage.status, 200);
    assert.equal(firstPage.body.data.properties[0].id, olderPropertyId);
    assert.equal(firstPage.body.data.count, 1);
    assert.equal(firstPage.body.data.totalCount, 2);
    assert.equal(firstPage.body.data.currentPage, 1);
    assert.equal(firstPage.body.data.totalPages, 2);
    assert.equal(secondPage.status, 200);
    assert.equal(secondPage.body.data.properties[0].id, newerPropertyId);
    assert.equal(secondPage.body.data.currentPage, 2);
  });

  it('rejects invalid property query parameters', async () => {
    const response = await request(app).get('/api/properties').query({
      propertyType: 'castle',
      minPrice: '500',
      maxPrice: '100',
      bedrooms: '2.5',
      sort: 'popular',
      page: '0',
      limit: '61',
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, 'Validation failed');
    assert.ok(response.body.details.propertyType);
    assert.ok(response.body.details.priceRange);
    assert.ok(response.body.details.bedrooms);
    assert.ok(response.body.details.sort);
    assert.ok(response.body.details.page);
    assert.ok(response.body.details.limit);
  });

  it('returns 404 for a property that is not publicly available', async () => {
    const response = await request(app).get(`/api/properties/${hiddenPropertyId}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Property not found.');
  });

  it('returns 404 when a property does not exist', async () => {
    const response = await request(app).get(
      `/api/properties/${Number(newerPropertyId) + 1_000_000}`,
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Property not found.');
  });

  it('rejects an invalid property ID', async () => {
    const response = await request(app).get('/api/properties/not-a-number');

    assert.equal(response.status, 400);
    assert.equal(response.body.message, 'Validation failed');
    assert.equal(
      response.body.details.id,
      'Property ID must be a positive integer.',
    );
  });
});
