import {
  ROLES,
  ROLE_LABELS,
  STATUS,
  STATUS_LABELS,
  CATEGORY,
  CATEGORY_LABELS,
} from '../config/constants.js';
import * as metaRepo from '../repositories/meta.repo.js';
import * as employeeRepo from '../repositories/employee.repo.js';

/** GET /api/meta — รายการอ้างอิงสำหรับ dropdown */
export async function getMeta(req, res, next) {
  try {
    const [incomeTypes, deductionTypes, departments] = await Promise.all([
      metaRepo.incomeTypes(),
      metaRepo.deductionTypes(),
      metaRepo.departments(),
    ]);
    res.json({
      incomeTypes,
      deductionTypes,
      departments,
      roles: Object.values(ROLES).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
      statuses: Object.values(STATUS).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
      categories: Object.values(CATEGORY).map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/employees — รายชื่อบุคลากร (ผูกกับบัญชีผู้ใช้) */
export async function listEmployees(req, res, next) {
  try {
    const items = (await employeeRepo.list()).map((e) => ({
      empCode: e.empCode,
      idCard: e.idCard,
      fullname: `${e.prefix}${e.firstName} ${e.lastName}`,
      position: e.position,
      department: e.department,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}
