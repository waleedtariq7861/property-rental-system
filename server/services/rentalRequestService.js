import pool from '../config/database.js';
import ApiError from '../utils/ApiError.js';

const RENTAL_REQUEST_FIELDS = `
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
  p.image_url AS propertyImageUrl,
  u.full_name AS ownerName
`;

const OWNER_RENTAL_REQUEST_FIELDS = `
  rr.id,
  rr.property_id AS propertyId,
  rr.tenant_id AS tenantId,
  rr.owner_id AS ownerId,
  rr.status,
  rr.message,
  rr.created_at AS createdAt,
  rr.updated_at AS updatedAt,
  p.title AS propertyTitle,
  tenant.full_name AS tenantName
`;

async function findRentalRequestById(connection, requestId, tenantId) {
  const [rows] = await connection.execute(
    `
      SELECT ${RENTAL_REQUEST_FIELDS}
      FROM rental_requests rr
      INNER JOIN properties p ON p.id = rr.property_id
      INNER JOIN users u ON u.id = rr.owner_id
      WHERE rr.id = ? AND rr.tenant_id = ?
      LIMIT 1
    `,
    [requestId, tenantId],
  );

  return rows[0] || null;
}

export async function createRentalRequest(tenantId, rentalRequest) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [properties] = await connection.execute(
      `
        SELECT owner_id AS ownerId, availability_status AS availabilityStatus,
          approval_status AS approvalStatus
        FROM properties
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [rentalRequest.propertyId],
    );
    const property = properties[0];

    if (!property) {
      throw new ApiError(404, 'Property not found.');
    }

    if (
      property.availabilityStatus !== 'available' ||
      property.approvalStatus !== 'approved'
    ) {
      throw new ApiError(
        409,
        'This property is not available for rental requests.',
      );
    }

    const [pendingRequests] = await connection.execute(
      `
        SELECT id
        FROM rental_requests
        WHERE tenant_id = ? AND property_id = ? AND status = 'pending'
        LIMIT 1
        FOR UPDATE
      `,
      [tenantId, rentalRequest.propertyId],
    );

    if (pendingRequests.length > 0) {
      throw new ApiError(
        409,
        'You already have a pending rental request for this property.',
      );
    }

    const [result] = await connection.execute(
      `
        INSERT INTO rental_requests (
          property_id,
          tenant_id,
          owner_id,
          message
        ) VALUES (?, ?, ?, ?)
      `,
      [
        rentalRequest.propertyId,
        tenantId,
        property.ownerId,
        rentalRequest.message,
      ],
    );
    const createdRequest = await findRentalRequestById(
      connection,
      result.insertId,
      tenantId,
    );

    await connection.commit();
    return createdRequest;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findTenantRentalRequests(tenantId) {
  const [rows] = await pool.execute(
    `
      SELECT ${RENTAL_REQUEST_FIELDS}
      FROM rental_requests rr
      INNER JOIN properties p ON p.id = rr.property_id
      INNER JOIN users u ON u.id = rr.owner_id
      WHERE rr.tenant_id = ?
      ORDER BY rr.created_at DESC, rr.id DESC
    `,
    [tenantId],
  );

  return rows;
}

async function findOwnerRentalRequestById(connection, requestId, ownerId) {
  const [rows] = await connection.execute(
    `
      SELECT ${OWNER_RENTAL_REQUEST_FIELDS}
      FROM rental_requests rr
      INNER JOIN properties p
        ON p.id = rr.property_id AND p.owner_id = rr.owner_id
      INNER JOIN users tenant ON tenant.id = rr.tenant_id
      WHERE rr.id = ?
        AND rr.owner_id = ?
        AND p.owner_id = ?
      LIMIT 1
    `,
    [requestId, ownerId, ownerId],
  );

  return rows[0] || null;
}

export async function findOwnerRentalRequests(ownerId) {
  const [rows] = await pool.execute(
    `
      SELECT ${OWNER_RENTAL_REQUEST_FIELDS}
      FROM rental_requests rr
      INNER JOIN properties p
        ON p.id = rr.property_id AND p.owner_id = rr.owner_id
      INNER JOIN users tenant ON tenant.id = rr.tenant_id
      WHERE rr.owner_id = ? AND p.owner_id = ?
      ORDER BY rr.created_at DESC, rr.id DESC
    `,
    [ownerId, ownerId],
  );

  return rows;
}

export async function updateOwnerRentalRequestStatus(
  ownerId,
  requestId,
  status,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
        SELECT rr.status
        FROM rental_requests rr
        INNER JOIN properties p
          ON p.id = rr.property_id AND p.owner_id = rr.owner_id
        WHERE rr.id = ?
          AND rr.owner_id = ?
          AND p.owner_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [requestId, ownerId, ownerId],
    );
    const rentalRequest = rows[0];

    if (!rentalRequest) {
      throw new ApiError(404, 'Rental request not found.');
    }

    if (rentalRequest.status !== 'pending') {
      throw new ApiError(
        409,
        'Only pending rental requests can be accepted or rejected.',
      );
    }

    await connection.execute(
      `
        UPDATE rental_requests rr
        INNER JOIN properties p
          ON p.id = rr.property_id AND p.owner_id = rr.owner_id
        SET rr.status = ?
        WHERE rr.id = ?
          AND rr.status = 'pending'
          AND rr.owner_id = ?
          AND p.owner_id = ?
      `,
      [status, requestId, ownerId, ownerId],
    );

    const updatedRequest = await findOwnerRentalRequestById(
      connection,
      requestId,
      ownerId,
    );

    await connection.commit();
    return updatedRequest;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
