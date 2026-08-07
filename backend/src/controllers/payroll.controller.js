import { CATEGORY } from '../config/constants.js';
import { getEmployeeMasterData } from '../services/pmis.service.js';
import * as reportRepo from '../repositories/report.repo.js';

/**
 * GET /api/me/payslip?month=YYYY-MM
 * รายได้/รายการหักของตนเอง — เฉพาะที่ "ยืนยันแล้ว" (ข้อ 4.2, 4.3)
 */
export async function myPayslip(req, res, next) {
  try {
    const emp = await getEmployeeMasterData(req.user.empCode);
    const { month } = req.query;
    const rows = emp ? await reportRepo.confirmedForIdCard(emp.idCard, { month }) : [];

    const income = rows.filter((r) => r.category === CATEGORY.INCOME);
    const deduction = rows.filter((r) => r.category === CATEGORY.DEDUCTION);
    const totalIncome = income.reduce((s, r) => s + r.net, 0);
    const totalDeduction = deduction.reduce((s, r) => s + r.net, 0);

    res.json({
      month: month || 'ทั้งหมด',
      income,
      deduction,
      summary: { totalIncome, totalDeduction, netPay: totalIncome - totalDeduction },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/me/months — เดือนที่มีข้อมูลยืนยันแล้วของตน */
export async function myMonths(req, res, next) {
  try {
    const emp = await getEmployeeMasterData(req.user.empCode);
    const months = emp ? await reportRepo.monthsForIdCard(emp.idCard) : [];
    res.json({ months });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/me/income-certificate?year=YYYY | ?month=YYYY-MM
 * ข้อมูลพิมพ์เอกสารยืนยันรายได้ (ข้อ 4.4)
 */
export async function incomeCertificate(req, res, next) {
  try {
    const emp = await getEmployeeMasterData(req.user.empCode);
    const { year, month } = req.query;
    const rows = emp ? await reportRepo.confirmedForIdCard(emp.idCard, { month, year }) : [];

    const income = rows.filter((r) => r.category === CATEGORY.INCOME);
    const deduction = rows.filter((r) => r.category === CATEGORY.DEDUCTION);

    res.json({
      employee: emp,
      period: month || year || 'ทั้งหมด',
      scope: month ? 'month' : 'year',
      totalIncome: income.reduce((s, r) => s + r.amount, 0),
      totalTax: income.reduce((s, r) => s + r.tax, 0),
      totalDeduction: deduction.reduce((s, r) => s + r.net, 0),
      income,
      deduction,
      issuedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/overview — ภาพรวมสำหรับ admin/superadmin (ข้อ 4.5) */
export async function overview(req, res, next) {
  try {
    const { month, department, category } = req.query;
    const [stats, rows] = await Promise.all([
      reportRepo.batchStats(),
      reportRepo.confirmedRows({ month, department, category }),
    ]);

    const income = rows.filter((r) => r.category === CATEGORY.INCOME);
    const deduction = rows.filter((r) => r.category === CATEGORY.DEDUCTION);

    const byType = {};
    for (const r of rows) {
      const key = `${r.category}::${r.typeName}`;
      if (!byType[key]) byType[key] = { category: r.category, typeName: r.typeName, count: 0, total: 0 };
      byType[key].count += 1;
      byType[key].total += r.net;
    }

    res.json({
      stats,
      totals: {
        totalIncome: income.reduce((s, r) => s + r.net, 0),
        totalDeduction: deduction.reduce((s, r) => s + r.net, 0),
        headcount: new Set(rows.map((r) => r.idCard)).size,
      },
      byType: Object.values(byType).sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
}
