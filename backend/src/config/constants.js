// ===== สิทธิ์การใช้งาน 4 ระดับ (เอกสารข้อ 5) =====
export const ROLES = {
  SUPER_ADMIN: 'superadmin', // เข้าถึง/แก้ไขทุกส่วน + จัดการบัญชี (5.1.1)
  TREASURY: 'treasury', // Admin งานคลังและพัสดุ — ตรวจสอบ/ยืนยัน/export (ข้อ 3)
  SOURCE: 'source', // Admin หน่วยงานต้นทาง — upload ข้อมูล (ข้อ 2)
  USER: 'user', // บุคลากร — ดูข้อมูลของตน (ข้อ 4)
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  treasury: 'Admin — งานคลังและพัสดุ',
  source: 'Admin — หน่วยงานต้นทาง',
  user: 'User (บุคลากร)',
};

// ===== สถานะข้อมูล (main flow) =====
export const STATUS = {
  PENDING: 'pending', // รอตรวจสอบ
  CONFIRMED: 'confirmed', // ยืนยันแล้ว (User มองเห็นได้ — ข้อ 4.2)
  CANCELLED: 'cancelled', // ยกเลิกทั้งชุด ให้ upload ใหม่ (ข้อ 3.2)
};

export const STATUS_LABELS = {
  pending: 'รอตรวจสอบ',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

// ===== หมวดของการนำเข้า (ข้อ 2) =====
export const CATEGORY = {
  INCOME: 'income', // รายได้ (2.2)
  DEDUCTION: 'deduction', // รายการหัก (2.3)
  BUDGET: 'budget', // แหล่งงบประมาณ (2.1)
  BANK: 'bank', // บัญชีธนาคาร (2.4)
};

export const CATEGORY_LABELS = {
  income: 'รายได้',
  deduction: 'รายการหัก',
  budget: 'แหล่งงบประมาณ',
  bank: 'บัญชีธนาคาร',
};
