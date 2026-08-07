import { query, queryOne } from '../db/pool.js';

function map(row) {
  if (!row) return null;
  return {
    empCode: row.emp_code,
    idCard: row.id_card,
    prefix: row.prefix,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.position,
    department: row.department,
    bankName: row.bank_name,
    accNum: row.acc_num,
    profileImg: row.profile_img,
  };
}

export async function findByEmpCode(empCode) {
  return map(await queryOne('SELECT * FROM employees WHERE emp_code = ?', [empCode]));
}

export async function findByIdCard(idCard) {
  return map(await queryOne('SELECT * FROM employees WHERE id_card = ?', [idCard]));
}

export async function list() {
  const rows = await query('SELECT * FROM employees ORDER BY emp_code');
  return rows.map(map);
}
