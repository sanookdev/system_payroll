import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool, query, queryOne, closePool } from './pool.js';
import {
  DEFAULT_PASSWORD,
  incomeTypes,
  deductionTypes,
  departments,
  employees,
  users,
  buildBatchesWithRecords,
} from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = path.resolve(__dirname, 'schema.sql');

/** รอ MySQL พร้อมรับ connection (docker อาจ boot ช้ากว่า backend) */
async function waitForDb(retries = 30, delayMs = 2000) {
  for (let i = 1; i <= retries; i += 1) {
    try {
      await query('SELECT 1');
      return;
    } catch (err) {
      if (i === retries) throw err;
      // eslint-disable-next-line no-console
      console.log(`… รอ MySQL (${i}/${retries}) — ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/** สร้างตารางจาก schema.sql (ข้าม CREATE DATABASE / USE เพราะ pool ผูก db แล้ว) */
async function ensureSchema() {
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--.*$/gm, '').trim())
    .filter((s) => s.length > 0)
    .filter((s) => !/^CREATE\s+DATABASE/i.test(s) && !/^USE\s+/i.test(s));

  for (const stmt of statements) {
    await query(stmt);
  }
}

async function isSeeded() {
  const row = await queryOne('SELECT COUNT(*) AS c FROM users');
  return row.c > 0;
}

async function clearAll() {
  await query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['records', 'batches', 'users', 'employees', 'income_types', 'deduction_types', 'departments']) {
    await query(`TRUNCATE TABLE ${t}`);
  }
  await query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seed() {
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  // reference tables
  for (const t of incomeTypes) {
    await query('INSERT INTO income_types (id, topic) VALUES (?, ?)', [t.id, t.topic]);
  }
  for (const t of deductionTypes) {
    await query('INSERT INTO deduction_types (id, topic) VALUES (?, ?)', [t.id, t.topic]);
  }
  for (const d of departments) {
    await query('INSERT INTO departments (id, name) VALUES (?, ?)', [d.id, d.name]);
  }

  // employees
  for (const e of employees) {
    await query(
      `INSERT INTO employees
        (emp_code, id_card, prefix, first_name, last_name, position, department, bank_name, acc_num, profile_img)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [e.empCode, e.idCard, e.prefix, e.firstName, e.lastName, e.position, e.department, e.bankName, e.accNum, e.profileImg],
    );
  }

  // users
  for (const u of users) {
    await query(
      'INSERT INTO users (username, password_hash, role, emp_code, name, active) VALUES (?,?,?,?,?,1)',
      [u.username, hash, u.role, u.empCode, u.name],
    );
  }

  // batches + records
  for (const b of buildBatchesWithRecords()) {
    const res = await query(
      `INSERT INTO batches
        (category, type_id, type_name, month, department, status, file_name, uploaded_by, uploaded_at, confirmed_by, confirmed_at, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [b.category, b.typeId, b.typeName, b.month, b.department, b.status, b.fileName, b.uploadedBy, b.uploadedAt, b.confirmedBy, b.confirmedAt, b.note],
    );
    const batchId = res.insertId;
    for (const r of b.records) {
      await query(
        `INSERT INTO records
          (batch_id, id_card, emp_code, fullname, position, amount, tax, net, bank_name, acc_num, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [batchId, r.idCard, r.empCode, r.fullname, r.position, r.amount, r.tax, r.net, r.bankName, r.accNum, r.status],
      );
    }
  }
}

/**
 * เรียกตอน backend เริ่มทำงาน — รอ DB, สร้าง schema, seed ถ้ายังว่าง
 * @param {{ force?: boolean }} opts
 */
export async function initDb({ force = false } = {}) {
  await waitForDb();
  await ensureSchema();
  if (force) {
    await clearAll();
    await seed();
    // eslint-disable-next-line no-console
    console.log('✔ ล้างและ seed ข้อมูลใหม่แล้ว');
  } else if (!(await isSeeded())) {
    await seed();
    // eslint-disable-next-line no-console
    console.log('✔ seed ข้อมูลตัวอย่างครั้งแรกแล้ว');
  }
}

// รันเป็น CLI: node src/db/init.js [--seed]
const isMain = process.argv[1] && process.argv[1].endsWith('init.js');
if (isMain) {
  const force = process.argv.includes('--seed');
  initDb({ force })
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('เสร็จสิ้น — บัญชี: superadmin / treasury / source_hr / source_social / user / user2 (password123)');
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('init ล้มเหลว:', err);
      process.exitCode = 1;
    })
    .finally(() => closePool());
}
