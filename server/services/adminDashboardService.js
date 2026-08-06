import pool from '../config/database.js';

const RECENT_ITEM_LIMIT = 5;

const ADMIN_USER_FIELDS = `
  u.id,
  u.full_name AS fullName,
  u.email,
  u.phone,
  u.role,
  u.account_status AS accountStatus,
  u.created_at AS createdAt,
  u.updated_at AS updatedAt
`;

const ADMIN_PROPERTY_FIELDS = `
  p.id,
  p.owner_id AS ownerId,
  owner.full_name AS ownerName,
  owner.email AS ownerEmail,
  p.title,
  p.description,
  p.property_type AS propertyType,
  p.property_category AS propertyCategory,
  p.price,
  p.security_deposit AS securityDeposit,
  p.city,
  p.area,
  p.address,
  p.bedrooms,
  p.bathrooms,
  p.property_size AS propertySize,
  p.size_unit AS sizeUnit,
  p.furnished_status AS furnishedStatus,
  p.parking_available AS parkingAvailable,
  p.availability_status AS availabilityStatus,
  p.approval_status AS approvalStatus,
  p.image_url AS imageUrl,
  p.contact_number AS contactNumber,
  p.created_at AS createdAt,
  p.updated_at AS updatedAt
`;

const ADMIN_RENTAL_REQUEST_FIELDS = `
  rr.id,
  rr.property_id AS propertyId,
  rr.tenant_id AS tenantId,
  rr.owner_id AS ownerId,
  rr.status,
  rr.message,
  rr.created_at AS createdAt,
  rr.updated_at AS updatedAt,
  p.title AS propertyTitle,
  p.city AS propertyCity,
  p.price AS propertyPrice,
  p.property_type AS propertyType,
  tenant.full_name AS tenantName,
  tenant.email AS tenantEmail,
  owner.full_name AS ownerName,
  owner.email AS ownerEmail
`;

export async function findAdminDashboard() {
  const [[statisticsRows], [recentUsers], [recentProperties], [recentRequests]] =
    await Promise.all([
      pool.execute(
        `
          SELECT
            (SELECT COUNT(*) FROM users) AS totalUsers,
            (SELECT COUNT(*) FROM users WHERE role = 'owner') AS totalOwners,
            (SELECT COUNT(*) FROM users WHERE role = 'tenant') AS totalTenants,
            (SELECT COUNT(*) FROM properties) AS totalProperties,
            (SELECT COUNT(*) FROM rental_requests) AS totalRentalRequests
        `,
      ),
      pool.execute(
        `
          SELECT ${ADMIN_USER_FIELDS}
          FROM users u
          ORDER BY u.created_at DESC, u.id DESC
          LIMIT ${RECENT_ITEM_LIMIT}
        `,
      ),
      pool.execute(
        `
          SELECT ${ADMIN_PROPERTY_FIELDS}
          FROM properties p
          INNER JOIN users owner ON owner.id = p.owner_id
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ${RECENT_ITEM_LIMIT}
        `,
      ),
      pool.execute(
        `
          SELECT ${ADMIN_RENTAL_REQUEST_FIELDS}
          FROM rental_requests rr
          INNER JOIN properties p ON p.id = rr.property_id
          INNER JOIN users tenant ON tenant.id = rr.tenant_id
          INNER JOIN users owner ON owner.id = rr.owner_id
          ORDER BY rr.created_at DESC, rr.id DESC
          LIMIT ${RECENT_ITEM_LIMIT}
        `,
      ),
    ]);
  const statistics = statisticsRows[0];

  return {
    statistics: {
      totalUsers: Number(statistics.totalUsers),
      totalOwners: Number(statistics.totalOwners),
      totalTenants: Number(statistics.totalTenants),
      totalProperties: Number(statistics.totalProperties),
      totalRentalRequests: Number(statistics.totalRentalRequests),
    },
    recentUsers,
    recentProperties,
    recentRequests,
  };
}

export async function findAllUsersForAdmin() {
  const [users] = await pool.execute(
    `
      SELECT ${ADMIN_USER_FIELDS}
      FROM users u
      ORDER BY u.created_at DESC, u.id DESC
    `,
  );

  return users;
}

export async function findAllPropertiesForAdmin() {
  const [properties] = await pool.execute(
    `
      SELECT ${ADMIN_PROPERTY_FIELDS}
      FROM properties p
      INNER JOIN users owner ON owner.id = p.owner_id
      ORDER BY p.created_at DESC, p.id DESC
    `,
  );

  return properties;
}

export async function findAllRentalRequestsForAdmin() {
  const [rentalRequests] = await pool.execute(
    `
      SELECT ${ADMIN_RENTAL_REQUEST_FIELDS}
      FROM rental_requests rr
      INNER JOIN properties p ON p.id = rr.property_id
      INNER JOIN users tenant ON tenant.id = rr.tenant_id
      INNER JOIN users owner ON owner.id = rr.owner_id
      ORDER BY rr.created_at DESC, rr.id DESC
    `,
  );

  return rentalRequests;
}
