import pool from '../config/database.js';
import ApiError from '../utils/ApiError.js';

const RECENT_ITEM_LIMIT = 5;

const ADMIN_USER_FIELDS = `
  u.id,
  u.full_name AS fullName,
  u.email,
  u.phone,
  u.role,
  u.account_status AS accountStatus,
  u.created_at AS createdAt,
  u.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM properties owned_property WHERE owned_property.owner_id = u.id) AS propertyCount,
  (
    SELECT COUNT(*)
    FROM rental_requests user_request
    WHERE user_request.tenant_id = u.id OR user_request.owner_id = u.id
  ) AS rentalRequestCount
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
  p.updated_at AS updatedAt,
  (
    SELECT COUNT(*)
    FROM rental_requests property_request
    WHERE property_request.property_id = p.id
  ) AS rentalRequestCount
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
    recentUsers: recentUsers.map(normalizeUserRecord),
    recentProperties: recentProperties.map(normalizePropertyRecord),
    recentRequests,
  };
}

function normalizeUserRecord(user) {
  return {
    ...user,
    propertyCount: Number(user.propertyCount),
    rentalRequestCount: Number(user.rentalRequestCount),
  };
}

function normalizePropertyRecord(property) {
  return {
    ...property,
    rentalRequestCount: Number(property.rentalRequestCount),
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

  return users.map(normalizeUserRecord);
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

  return properties.map(normalizePropertyRecord);
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

async function findAdminUserById(connection, userId) {
  const [users] = await connection.execute(
    `
      SELECT ${ADMIN_USER_FIELDS}
      FROM users u
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId],
  );

  return users[0] ? normalizeUserRecord(users[0]) : null;
}

export async function updateUserStatusForAdmin(
  currentAdminId,
  userId,
  accountStatus,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      `
        SELECT id, account_status AS accountStatus
        FROM users
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [userId],
    );
    const user = users[0];

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (Number(user.id) === Number(currentAdminId)) {
      throw new ApiError(
        409,
        'You cannot change the status of your own administrator account.',
      );
    }

    if (user.accountStatus === accountStatus) {
      throw new ApiError(409, `This account is already ${accountStatus}.`);
    }

    await connection.execute(
      'UPDATE users SET account_status = ? WHERE id = ?',
      [accountStatus, userId],
    );
    const updatedUser = await findAdminUserById(connection, userId);

    await connection.commit();
    return updatedUser;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteUserForAdmin(currentAdminId, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      `
        SELECT id, role
        FROM users
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [userId],
    );
    const user = users[0];

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (Number(user.id) === Number(currentAdminId)) {
      throw new ApiError(409, 'You cannot delete your own administrator account.');
    }

    const [[dependencies]] = await connection.execute(
      `
        SELECT
          (SELECT COUNT(*) FROM properties WHERE owner_id = ?) AS propertyCount,
          (
            SELECT COUNT(*)
            FROM rental_requests
            WHERE tenant_id = ? OR owner_id = ?
          ) AS rentalRequestCount
      `,
      [userId, userId, userId],
    );

    if (
      Number(dependencies.propertyCount) > 0 ||
      Number(dependencies.rentalRequestCount) > 0
    ) {
      throw new ApiError(
        409,
        'This user cannot be deleted because they have property or rental history. Deactivate the account instead.',
      );
    }

    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [
      userId,
    ]);

    if (result.affectedRows !== 1) {
      throw new ApiError(404, 'User not found.');
    }

    await connection.commit();
    return { id: userId, role: user.role };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePropertyForAdmin(propertyId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [properties] = await connection.execute(
      `
        SELECT id, title
        FROM properties
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [propertyId],
    );
    const property = properties[0];

    if (!property) {
      throw new ApiError(404, 'Property not found.');
    }

    const [[dependencies]] = await connection.execute(
      'SELECT COUNT(*) AS rentalRequestCount FROM rental_requests WHERE property_id = ?',
      [propertyId],
    );

    if (Number(dependencies.rentalRequestCount) > 0) {
      throw new ApiError(
        409,
        'This property cannot be deleted because it has rental history.',
      );
    }

    const [result] = await connection.execute(
      'DELETE FROM properties WHERE id = ?',
      [propertyId],
    );

    if (result.affectedRows !== 1) {
      throw new ApiError(404, 'Property not found.');
    }

    await connection.commit();
    return { id: propertyId, title: property.title };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
