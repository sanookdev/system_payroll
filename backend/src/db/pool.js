import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

/**
 * MySQL connection pool (mysql2/promise)
 * -------------------------------------------------------------
 * ทุก repository เข้าถึง DB ผ่าน pool นี้จุดเดียว
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
  decimalNumbers: true, // คืน DECIMAL เป็น number ไม่ใช่ string
});

/** helper: query แล้วคืนเฉพาะ rows */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** helper: query แถวเดียว (คืน null ถ้าไม่พบ) */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/** ปิด pool (ใช้ตอน shutdown / script จบ) */
export async function closePool() {
  await pool.end();
}
