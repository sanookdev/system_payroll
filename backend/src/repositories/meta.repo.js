import { query, queryOne } from '../db/pool.js';

export async function incomeTypes() {
  return query('SELECT id, topic FROM income_types ORDER BY id');
}

export async function deductionTypes() {
  return query('SELECT id, topic FROM deduction_types ORDER BY id');
}

export async function departments() {
  return query('SELECT id, name FROM departments ORDER BY id');
}

/** คืน topic ของประเภทตามหมวด/id (ใช้ตอน upload) */
export async function typeName(category, typeId) {
  if (!typeId) return '';
  const table = category === 'deduction' ? 'deduction_types' : 'income_types';
  const row = await queryOne(`SELECT topic FROM ${table} WHERE id = ?`, [typeId]);
  return row?.topic || '';
}
