import pool from '../config/database.js';

export async function checkDatabaseHealth() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    return { connected: true };
  } catch (error) {
    return { connected: false, error };
  } finally {
    connection?.release();
  }
}
