import bcrypt from 'bcryptjs';
import { ROLES, ROLE_LABELS } from '../config/constants.js';
import { httpError } from '../middleware/errorHandler.js';
import * as userRepo from '../repositories/user.repo.js';

/** ตัด passwordHash ออกก่อนส่งกลับ */
function publicUser(u) {
  if (!u) return u;
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role,
    empCode: u.empCode,
    name: u.name,
    active: u.active,
  };
}

/** GET /api/users (ข้อ 5.1) */
export async function listUsers(req, res, next) {
  try {
    const items = await userRepo.list();
    res.json({ items: items.map(publicUser) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users */
export async function createUser(req, res, next) {
  try {
    const { username, password, role, name, empCode } = req.body || {};
    if (!username || !password || !role) {
      throw httpError(400, 'กรุณากรอก username, password และ role');
    }
    if (!Object.values(ROLES).includes(role)) throw httpError(400, 'role ไม่ถูกต้อง');
    if (await userRepo.existsUsername(username)) throw httpError(409, 'username นี้ถูกใช้แล้ว');

    const user = await userRepo.create({
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      empCode: empCode ? Number(empCode) : null,
      name: name || username,
    });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/:id */
export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await userRepo.findById(id);
    if (!existing) throw httpError(404, 'ไม่พบบัญชี');

    const { role, name, empCode, active, password } = req.body || {};
    if (role && !Object.values(ROLES).includes(role)) throw httpError(400, 'role ไม่ถูกต้อง');

    const fields = {};
    if (role) fields.role = role;
    if (name != null) fields.name = name;
    if (empCode != null) fields.empCode = Number(empCode);
    if (active != null) fields.active = Boolean(active);
    if (password) fields.passwordHash = bcrypt.hashSync(password, 10);

    const user = await userRepo.update(id, fields);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/users/:id — ปิดใช้งาน (soft) */
export async function deactivateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await userRepo.findById(id);
    if (!existing) throw httpError(404, 'ไม่พบบัญชี');
    if (existing.id === (req.user.sub ?? req.user.id)) {
      throw httpError(400, 'ไม่สามารถปิดใช้งานบัญชีตนเองได้');
    }
    const user = await userRepo.update(id, { active: false });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
