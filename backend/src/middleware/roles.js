/**
 * จำกัดสิทธิ์ตาม role — ใช้ต่อจาก requireAuth
 * ตัวอย่าง: router.post('/', requireAuth, requireRole('source','superadmin'), handler)
 */
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    return next();
  };
}
