import { query, queryOne } from '../db/pool.js';

function mapJoined(row) {
  return {
    id: row.id,
    batchId: row.batch_id,
    idCard: row.id_card,
    empCode: row.emp_code,
    fullname: row.fullname,
    position: row.position,
    amount: Number(row.amount),
    tax: Number(row.tax),
    net: Number(row.net),
    bankName: row.bank_name,
    accNum: row.acc_num,
    status: row.status,
    category: row.category,
    typeName: row.type_name,
    month: row.month,
    department: row.department,
  };
}

const BASE = `
  SELECT r.*, b.category, b.type_name, b.month, b.department
  FROM records r
  JOIN batches b ON b.id = r.batch_id
  WHERE b.status = 'confirmed' AND r.status = 'confirmed'
`;

/** รายการยืนยันแล้วของบุคลากรคนหนึ่ง (กรอง month หรือ year ได้) */
export async function confirmedForIdCard(idCard, { month, year } = {}) {
  let sql = `${BASE} AND r.id_card = ?`;
  const params = [idCard];
  if (month) {
    sql += ' AND b.month = ?';
    params.push(month);
  } else if (year) {
    sql += ' AND b.month LIKE ?';
    params.push(`${year}-%`);
  }
  sql += ' ORDER BY b.month DESC, b.category';
  const rows = await query(sql, params);
  return rows.map(mapJoined);
}

/** เดือนที่มีข้อมูลยืนยันแล้วของบุคลากร (สำหรับ dropdown ย้อนหลัง) */
export async function monthsForIdCard(idCard) {
  const rows = await query(
    `SELECT DISTINCT b.month
     FROM records r JOIN batches b ON b.id = r.batch_id
     WHERE b.status = 'confirmed' AND r.status = 'confirmed' AND r.id_card = ?
     ORDER BY b.month DESC`,
    [idCard],
  );
  return rows.map((r) => r.month);
}

/** สถิติสถานะของ batch ทั้งหมด (ข้อ 4.5) */
export async function batchStats() {
  const row = await queryOne(
    `SELECT
       COUNT(*) AS total_batches,
       COALESCE(SUM(status = 'pending'), 0)   AS pending,
       COALESCE(SUM(status = 'confirmed'), 0) AS confirmed,
       COALESCE(SUM(status = 'cancelled'), 0) AS cancelled
     FROM batches`,
  );
  const rec = await queryOne('SELECT COUNT(*) AS c FROM records');
  return {
    totalBatches: Number(row.total_batches),
    pending: Number(row.pending),
    confirmed: Number(row.confirmed),
    cancelled: Number(row.cancelled),
    totalRecords: Number(rec.c),
  };
}

/** รายการยืนยันแล้วทั้งระบบ (กรอง month/department/category) — ใช้คำนวณ totals + byType */
export async function confirmedRows({ month, department, category } = {}) {
  let sql = BASE;
  const params = [];
  if (month) {
    sql += ' AND b.month = ?';
    params.push(month);
  }
  if (department) {
    sql += ' AND b.department = ?';
    params.push(department);
  }
  if (category) {
    sql += ' AND b.category = ?';
    params.push(category);
  }
  const rows = await query(sql, params);
  return rows.map(mapJoined);
}
