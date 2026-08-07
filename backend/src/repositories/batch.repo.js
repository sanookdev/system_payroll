import { query, queryOne } from '../db/pool.js';

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    typeId: row.type_id,
    typeName: row.type_name,
    month: row.month,
    department: row.department,
    status: row.status,
    fileName: row.file_name,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    note: row.note,
    // มาจาก aggregate (ถ้ามี)
    recordCount: row.record_count != null ? Number(row.record_count) : undefined,
    confirmedCount: row.confirmed_count != null ? Number(row.confirmed_count) : undefined,
    totalAmount: row.total_amount != null ? Number(row.total_amount) : undefined,
  };
}

const WITH_COUNTS = `
  SELECT b.*,
    COUNT(r.id) AS record_count,
    COALESCE(SUM(r.status = 'confirmed'), 0) AS confirmed_count,
    COALESCE(SUM(r.net), 0) AS total_amount
  FROM batches b
  LEFT JOIN records r ON r.batch_id = b.id
`;

export async function list(filters = {}) {
  const where = [];
  const params = [];
  const add = (col, val) => {
    if (val != null && val !== '') {
      where.push(`b.${col} = ?`);
      params.push(val);
    }
  };
  add('category', filters.category);
  add('month', filters.month);
  add('department', filters.department);
  add('status', filters.status);
  add('type_id', filters.typeId);

  const sql = `${WITH_COUNTS}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY b.id
    ORDER BY b.id DESC`;
  const rows = await query(sql, params);
  return rows.map(map);
}

export async function findById(id) {
  const row = await queryOne(`${WITH_COUNTS} WHERE b.id = ? GROUP BY b.id`, [id]);
  return map(row);
}

export async function create(b) {
  const res = await query(
    `INSERT INTO batches
      (category, type_id, type_name, month, department, status, file_name, uploaded_by, uploaded_at, confirmed_by, confirmed_at, note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.category, b.typeId ?? null, b.typeName ?? '', b.month, b.department ?? '',
      b.status ?? 'pending', b.fileName ?? '', b.uploadedBy ?? '',
      b.uploadedAt ?? new Date(), b.confirmedBy ?? null, b.confirmedAt ?? null, b.note ?? '',
    ],
  );
  return res.insertId;
}

export async function markCancelled(id, note) {
  await query('UPDATE batches SET status = ?, note = ? WHERE id = ?', ['cancelled', note ?? '', id]);
}

export async function markConfirmed(id, confirmedBy) {
  await query(
    'UPDATE batches SET status = ?, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?',
    ['confirmed', confirmedBy, id],
  );
}
