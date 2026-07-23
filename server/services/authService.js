import pool from '../config/database.js';

const PUBLIC_USER_FIELDS = `
  id,
  full_name AS fullName,
  email,
  phone,
  role,
  account_status AS accountStatus,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        full_name AS fullName,
        email,
        phone,
        password_hash AS passwordHash,
        role,
        account_status AS accountStatus,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return rows[0] || null;
}

export async function createUser({ fullName, email, phone, passwordHash, role }) {
  const [result] = await pool.execute(
    `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        role
      ) VALUES (?, ?, ?, ?, ?)
    `,
    [fullName, email, phone, passwordHash, role],
  );

  return result.insertId;
}

export async function findPublicUserById(id) {
  const [rows] = await pool.execute(
    `
      SELECT ${PUBLIC_USER_FIELDS}
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
