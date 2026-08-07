import { query, queryOne } from '../db/pool.js';

/** map แบบมี passwordHash (สำหรับตรวจ login) */
function mapFull(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    empCode: row.emp_code,
    name: row.name,
    active: !!row.active,
  };
}

export async function findByUsername(username) {
  return mapFull(await queryOne('SELECT * FROM users WHERE username = ?', [username]));
}

export async function findById(id) {
  return mapFull(await queryOne('SELECT * FROM users WHERE id = ?', [id]));
}

export async function list() {
  const rows = await query('SELECT * FROM users ORDER BY id');
  return rows.map(mapFull);
}

export async function existsUsername(username) {
  const row = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
  return !!row;
}

export async function create({ username, passwordHash, role, empCode, name }) {
  const res = await query(
    'INSERT INTO users (username, password_hash, role, emp_code, name, active) VALUES (?,?,?,?,?,1)',
    [username, passwordHash, role, empCode ?? null, name ?? username],
  );
  return findById(res.insertId);
}

export async function update(id, fields) {
  const map = {
    role: 'role',
    name: 'name',
    empCode: 'emp_code',
    active: 'active',
    passwordHash: 'password_hash',
  };
  const sets = [];
  const params = [];
  for (const [key, col] of Object.entries(map)) {
    if (key in fields && fields[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(key === 'active' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (sets.length) {
    params.push(id);
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  }
  return findById(id);
}
