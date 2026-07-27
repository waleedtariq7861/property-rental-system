import pool from '../config/database.js';

const PUBLIC_PROPERTY_FIELDS = `
  id,
  owner_id AS ownerId,
  title,
  description,
  price,
  city,
  address,
  bedrooms,
  bathrooms,
  property_type AS propertyType,
  image_url AS imageUrl,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export async function findAllAvailableProperties() {
  const [rows] = await pool.execute(
    `
      SELECT ${PUBLIC_PROPERTY_FIELDS}
      FROM properties
      WHERE approval_status = ?
        AND availability_status = ?
      ORDER BY created_at DESC, id DESC
    `,
    ['approved', 'available'],
  );

  return rows;
}

export async function findAvailablePropertyById(propertyId) {
  const [rows] = await pool.execute(
    `
      SELECT ${PUBLIC_PROPERTY_FIELDS}
      FROM properties
      WHERE id = ?
        AND approval_status = ?
        AND availability_status = ?
      LIMIT 1
    `,
    [propertyId, 'approved', 'available'],
  );

  return rows[0] || null;
}
