import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

import { login, me } from '../controllers/auth.controller.js';
import { getMeta, listEmployees } from '../controllers/meta.controller.js';
import {
  listBatches,
  getBatch,
  uploadBatch,
  updateRecord,
  cancelBatch,
  confirmBatch,
} from '../controllers/batches.controller.js';
import {
  myPayslip,
  myMonths,
  incomeCertificate,
  overview,
} from '../controllers/payroll.controller.js';
import { exportBank, exportTemplate } from '../controllers/export.controller.js';
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/users.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ---- Auth ----
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);

// ---- Meta / อ้างอิง ----
router.get('/meta', requireAuth, getMeta);
router.get('/employees', requireAuth, listEmployees);

// ---- Batches (นำเข้า → ตรวจสอบ → ยืนยัน) ----
router.get('/batches', requireAuth, requireRole(ROLES.TREASURY, ROLES.SOURCE, ROLES.SUPER_ADMIN), listBatches);
router.get('/batches/:id', requireAuth, requireRole(ROLES.TREASURY, ROLES.SOURCE, ROLES.SUPER_ADMIN), getBatch);
router.post('/batches/upload', requireAuth, requireRole(ROLES.SOURCE, ROLES.SUPER_ADMIN), upload.single('file'), uploadBatch);
router.patch('/batches/records/:id', requireAuth, requireRole(ROLES.TREASURY, ROLES.SUPER_ADMIN), updateRecord);
router.post('/batches/:id/cancel', requireAuth, requireRole(ROLES.TREASURY, ROLES.SUPER_ADMIN), cancelBatch);
router.post('/batches/:id/confirm', requireAuth, requireRole(ROLES.TREASURY, ROLES.SUPER_ADMIN), confirmBatch);

// ---- ผู้ใช้ (บุคลากร) ดูข้อมูลของตน ----
router.get('/me/payslip', requireAuth, myPayslip);
router.get('/me/months', requireAuth, myMonths);
router.get('/me/income-certificate', requireAuth, incomeCertificate);

// ---- ภาพรวม (admin/superadmin) ----
router.get('/overview', requireAuth, requireRole(ROLES.TREASURY, ROLES.SUPER_ADMIN), overview);

// ---- Export ----
router.get('/export/template', requireAuth, requireRole(ROLES.SOURCE, ROLES.SUPER_ADMIN), exportTemplate);
router.get('/export/bank/:batchId', requireAuth, requireRole(ROLES.TREASURY, ROLES.SUPER_ADMIN), exportBank);

// ---- จัดการบัญชี (Super Admin, ข้อ 5.1) ----
router.get('/users', requireAuth, requireRole(ROLES.SUPER_ADMIN), listUsers);
router.post('/users', requireAuth, requireRole(ROLES.SUPER_ADMIN), createUser);
router.patch('/users/:id', requireAuth, requireRole(ROLES.SUPER_ADMIN), updateUser);
router.delete('/users/:id', requireAuth, requireRole(ROLES.SUPER_ADMIN), deactivateUser);

export default router;
