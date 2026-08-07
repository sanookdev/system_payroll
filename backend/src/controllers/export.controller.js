import { STATUS, CATEGORY } from '../config/constants.js';
import { httpError } from '../middleware/errorHandler.js';
import { buildBankExport, buildTemplate } from '../services/excel.service.js';
import * as batchRepo from '../repositories/batch.repo.js';
import * as recordRepo from '../repositories/record.repo.js';

/**
 * GET /api/export/bank/:batchId — Export excel รูปแบบส่งธนาคาร (ข้อ 3.4)
 * ส่งออกได้เฉพาะรายการที่ "ยืนยันแล้ว"
 */
export async function exportBank(req, res, next) {
  try {
    const batchId = Number(req.params.batchId);
    const batch = await batchRepo.findById(batchId);
    if (!batch) throw httpError(404, 'ไม่พบชุดข้อมูล');
    if (batch.category !== CATEGORY.INCOME) {
      throw httpError(400, 'ส่งออกไฟล์ธนาคารได้เฉพาะชุดข้อมูลรายได้');
    }
    const records = (await recordRepo.findByBatch(batchId)).filter(
      (r) => r.status === STATUS.CONFIRMED,
    );
    if (records.length === 0) {
      throw httpError(422, 'ไม่มีรายการที่ยืนยันแล้วสำหรับส่งออก');
    }
    const buffer = buildBankExport(records);
    sendXlsx(res, buffer, `bank_transfer_${batch.month}_${batchId}.xlsx`);
  } catch (err) {
    next(err);
  }
}

/** GET /api/export/template?category=income|deduction */
export function exportTemplate(req, res) {
  const category = req.query.category === CATEGORY.DEDUCTION ? CATEGORY.DEDUCTION : CATEGORY.INCOME;
  const buffer = buildTemplate(category);
  sendXlsx(res, buffer, `template_${category}.xlsx`);
}

function sendXlsx(res, buffer, filename) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}
