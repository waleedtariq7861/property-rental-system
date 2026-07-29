import pool from '../config/database.js';

export const RECENT_PROPERTY_WINDOW_DAYS = 7;

const OWNER_PROPERTY_FIELDS = `
  p.id,
  p.owner_id AS ownerId,
  p.title,
  p.price,
  p.city,
  p.property_type AS propertyType,
  p.image_url AS imageUrl,
  p.availability_status AS availabilityStatus,
  p.approval_status AS approvalStatus,
  CASE
    WHEN p.approval_status = 'pending' THEN 'pending'
    WHEN p.approval_status = 'rejected' THEN 'rejected'
    WHEN p.availability_status = 'available' THEN 'active'
    ELSE p.availability_status
  END AS currentStatus,
  p.created_at AS createdAt,
  p.updated_at AS updatedAt
`;

export async function findOwnerDashboard(ownerId) {
  const [[statisticsRows], [properties]] = await Promise.all([
    pool.execute(
      `
        SELECT
          COUNT(*) AS totalProperties,
          COALESCE(
            SUM(
              approval_status = 'approved'
              AND availability_status = 'available'
            ),
            0
          ) AS activeListings,
          COALESCE(
            SUM(
              created_at >= CURRENT_TIMESTAMP - INTERVAL ${RECENT_PROPERTY_WINDOW_DAYS} DAY
            ),
            0
          ) AS recentlyAddedProperties
        FROM properties
        WHERE owner_id = ?
      `,
      [ownerId],
    ),
    pool.execute(
      `
        SELECT ${OWNER_PROPERTY_FIELDS}
        FROM properties p
        WHERE p.owner_id = ?
        ORDER BY p.created_at DESC, p.id DESC
      `,
      [ownerId],
    ),
  ]);

  const statistics = statisticsRows[0];

  return {
    statistics: {
      totalProperties: Number(statistics.totalProperties),
      activeListings: Number(statistics.activeListings),
      recentlyAddedProperties: Number(statistics.recentlyAddedProperties),
    },
    properties,
  };
}
