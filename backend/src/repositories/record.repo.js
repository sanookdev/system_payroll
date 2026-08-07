import { pool, query, queryOne } from '../db/pool.js';

function map(row) {
  if (!row) return null;
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
  };
}

export async function findByBatch(batchId) {
  const rows = await query('SELECT * FROM records WHERE batch_id = ? ORDER BY id', [batchId]);
  return rows.map(map);
}

export async function findById(id) {
  return map(await queryOne('SELECT * FROM records WHERE id = ?', [id]));
}

/** insert หลายรายการในครั้งเดียว (ตอน upload) */
export async function bulkCreate(batchId, rows) {
  if (!rows.length) return 0;
  const values = rows.map((r) => [
    batchId, r.idCard, r.empCode ?? null, r.fullname ?? '', r.position ?? '',
    r.amount ?? 0, r.tax ?? 0, r.net ?? 0, r.bankName ?? '', r.accNum ?? '', r.status ?? 'pending',
  ]);
  const [res] = await pool.query(
    `INSERT INTO records
      (batch_id, id_card, emp_code, fullname, position, amount, tax, net, bank_name, acc_num, status)
     VALUES ?`,
    [values],
  );
  return res.affectedRows;
}

export async function updateFields(id, fields) {
  const cols = {
    fullname: 'fullname',
    position: 'position',
    amount: 'amount',
    tax: 'tax',
    net: 'net',
    bankName: 'bank_name',
    accNum: 'acc_num',
  };
  const sets = [];
  const params = [];
  for (const [key, col] of Object.entries(cols)) {
    if (key in fields && fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(fields[key]);
    }
  }
  if (sets.length) {
    params.push(id);
    await query(`UPDATE records SET ${sets.join(', ')} WHERE id = ?`, params);
  }
  return findById(id);
}

/** ยืนยันทั้งชุด (เฉพาะที่ยังไม่ยกเลิก) */
export async function confirmByBatch(batchId) {
  const res = await query(
    "UPDATE records SET status = 'confirmed' WHERE batch_id = ? AND status <> 'cancelled'",
    [batchId],
  );
  return res.affectedRows;
}

/** ยืนยันเฉพาะบางรายการ */
export async function confirmByIds(batchId, ids) {
  if (!ids.length) return 0;
  const res = await query(
    `UPDATE records SET status = 'confirmed' WHERE batch_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
    [batchId, ...ids],
  );
  return res.affectedRows;
}

export async function setStatusByBatch(batchId, status) {
  await query('UPDATE records SET status = ? WHERE batch_id = ?', [status, batchId]);
}

/** นับรายการทั้งหมด/ที่ยืนยันแล้วของ batch */
export async function countByBatch(batchId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'confirmed'), 0) AS confirmed
     FROM records WHERE batch_id = ?`,
    [batchId],
  );
  return { total: Number(row.total), confirmed: Number(row.confirmed) };
}

export { map as mapRecord };
