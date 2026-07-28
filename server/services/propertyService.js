import pool from '../config/database.js';

const PUBLIC_PROPERTY_FIELDS = `
  p.id,
  p.owner_id AS ownerId,
  u.full_name AS ownerName,
  p.title,
  p.description,
  p.price,
  p.city,
  p.address,
  p.bedrooms,
  p.bathrooms,
  p.property_type AS propertyType,
  p.image_url AS imageUrl,
  p.created_at AS createdAt,
  p.updated_at AS updatedAt
`;

const SORT_CLAUSES = Object.freeze({
  newest: 'p.created_at DESC, p.id DESC',
  oldest: 'p.created_at ASC, p.id ASC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
});

function buildAvailablePropertyFilters(query) {
  const conditions = [
    'p.approval_status = ?',
    'p.availability_status = ?',
  ];
  const parameters = ['approved', 'available'];

  if (query.search) {
    conditions.push(`
      (
        LOCATE(LOWER(?), LOWER(p.title)) > 0
        OR LOCATE(LOWER(?), LOWER(p.city)) > 0
        OR LOCATE(LOWER(?), LOWER(p.address)) > 0
      )
    `);
    parameters.push(query.search, query.search, query.search);
  }

  if (query.city) {
    conditions.push('LOWER(p.city) = LOWER(?)');
    parameters.push(query.city);
  }

  if (query.propertyType) {
    conditions.push('p.property_type = ?');
    parameters.push(query.propertyType);
  }

  if (query.minPrice !== undefined) {
    conditions.push('p.price >= ?');
    parameters.push(query.minPrice);
  }

  if (query.maxPrice !== undefined) {
    conditions.push('p.price <= ?');
    parameters.push(query.maxPrice);
  }

  if (query.bedrooms !== undefined) {
    conditions.push('p.bedrooms = ?');
    parameters.push(query.bedrooms);
  }

  return {
    whereClause: conditions.join(' AND '),
    parameters,
  };
}

export async function findAllAvailableProperties(query) {
  const { whereClause, parameters } = buildAvailablePropertyFilters(query);
  const offset = (query.page - 1) * query.limit;
  const fromClause = `
    FROM properties p
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE ${whereClause}
  `;

  const [[rows], [countRows]] = await Promise.all([
    pool.query(
      `
        SELECT ${PUBLIC_PROPERTY_FIELDS}
        ${fromClause}
        ORDER BY ${SORT_CLAUSES[query.sort]}
        LIMIT ? OFFSET ?
      `,
      [...parameters, query.limit, offset],
    ),
    pool.execute(
      `
        SELECT COUNT(*) AS totalCount
        ${fromClause}
      `,
      parameters,
    ),
  ]);

  const totalCount = countRows[0].totalCount;

  return {
    properties: rows,
    totalCount,
    currentPage: query.page,
    totalPages: Math.ceil(totalCount / query.limit),
  };
}

export async function findAvailablePropertyById(propertyId) {
  const [rows] = await pool.execute(
    `
      SELECT ${PUBLIC_PROPERTY_FIELDS}
      FROM properties p
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = ?
        AND p.approval_status = ?
        AND p.availability_status = ?
      LIMIT 1
    `,
    [propertyId, 'approved', 'available'],
  );

  return rows[0] || null;
}
