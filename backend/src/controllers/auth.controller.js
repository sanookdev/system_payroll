import { authenticate, getEmployeeMasterData } from '../services/pmis.service.js';
import { signToken } from '../middleware/auth.js';
import { ROLE_LABELS } from '../config/constants.js';
import { httpError } from '../middleware/errorHandler.js';

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw httpError(400, 'กรุณากรอก username และ password');
    }
    const user = await authenticate(username, password);
    if (!user) {
      throw httpError(401, 'username / password ไม่ถูกต้อง');
    }
    const token = signToken(user);
    const profile = await buildProfile(user);
    res.json({ token, user: profile });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me — ดึงข้อมูล session ปัจจุบัน (verify + profile) */
export async function me(req, res, next) {
  try {
    const profile = await buildProfile(req.user);
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
}

async function buildProfile(user) {
  const emp = await getEmployeeMasterData(user.empCode);
  return {
    id: user.sub ?? user.id,
    username: user.username,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    name: user.name,
    empCode: user.empCode,
    profile: emp
      ? {
          idCard: emp.idCard,
          prefix: emp.prefix,
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullname: `${emp.prefix}${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          department: emp.department,
          bankName: emp.bankName,
          accNum: emp.accNum,
          profileImg: emp.profileImg,
        }
      : null,
  };
}
