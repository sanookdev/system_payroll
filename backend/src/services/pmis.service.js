import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import * as userRepo from '../repositories/user.repo.js';
import * as employeeRepo from '../repositories/employee.repo.js';

/**
 * PMIS / API Authen adapter (เอกสารข้อ 1)
 * -------------------------------------------------------------
 * ระบบ Payroll ไม่เก็บ/ตรวจรหัสผ่านเอง แต่ยืนยันตัวตนผ่าน API กลางของคณะฯ
 * (โปรเจ็ค api_authen_of_med) ด้วย 2 ชั้น: application-key + JWT
 *
 * รองรับ 2 โหมด (คืนรูปแบบเดียวกันเพื่อให้ controller ไม่ต้องรู้โหมด):
 *   - mock : ตรวจกับบัญชีในตาราง users (รันได้โดยไม่ต้องอยู่ใน intranet)
 *   - api  : เรียก POST /api/employee/login จริง (ต้องอยู่ใน intranet คณะฯ)
 */

export async function authenticate(username, password) {
  if (config.auth.mode === 'api') {
    return authenticateViaApi(username, password);
  }
  return authenticateMock(username, password);
}

async function authenticateMock(username, password) {
  const user = await userRepo.findByUsername(username);
  if (!user || !user.active) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    empCode: user.empCode,
    name: user.name,
  };
}

/**
 * โหมดจริง — โครงตามเอกสาร Phase A:
 *   POST /api/employee/login
 *     headers: { 'application-key': <AES secret> }
 *     body:    { username, password: md5(md5(password)) }
 *   -> 200 { access_token, employee } | 401 Unauthorized
 */
async function authenticateViaApi(username, password) {
  const url = `${config.auth.pmisBaseUrl}/api/employee/login`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'application-key': config.auth.applicationKey,
    },
    body: JSON.stringify({ username, password: md5x2(password) }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return {
    id: data.employee?.EMP_CODE ?? username,
    username,
    role: mapRole(data.employee),
    empCode: data.employee?.EMP_CODE,
    name: `${data.employee?.TFNAME ?? ''} ${data.employee?.TLNAME ?? ''}`.trim(),
    pmisToken: data.access_token,
  };
}

function md5x2(password) {
  return password; // TODO: md5(md5(password)) เมื่อเชื่อมต่อ API จริง
}

function mapRole() {
  return 'user'; // TODO: map สิทธิ์จากข้อมูล PMIS/ตารางสิทธิ์ภายใน
}

/** ดึง master data บุคลากร (mock = จากตาราง employees) */
export async function getEmployeeMasterData(empCode) {
  return employeeRepo.findByEmpCode(empCode);
}
