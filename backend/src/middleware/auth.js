import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * ตรวจสอบ Bearer token ทุก request (เทียบ Phase B ในเอกสาร)
 * — verify token และแนบ req.user
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'ไม่พบ token — กรุณาเข้าสู่ระบบ' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload; // { sub, username, role, empCode, name }
    return next();
  } catch {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      empCode: user.empCode,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}
