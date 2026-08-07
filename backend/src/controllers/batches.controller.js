import { STATUS, CATEGORY_LABELS } from '../config/constants.js';
import { httpError } from '../middleware/errorHandler.js';
import { parseWorkbook } from '../services/excel.service.js';
import * as batchRepo from '../repositories/batch.repo.js';
import * as recordRepo from '../repositories/record.repo.js';
import * as metaRepo from '../repositories/meta.repo.js';

/** เติม label ให้ batch ที่มี counts จาก repo แล้ว */
function decorate(batch) {
  if (!batch) return batch;
  return {
    ...batch,
    categoryLabel: CATEGORY_LABELS[batch.category],
    recordCount: batch.recordCount ?? 0,
    confirmedCount: batch.confirmedCount ?? 0,
    totalAmount: batch.totalAmount ?? 0,
  };
}

/** GET /api/batches — list + filter (ข้อ 3.1) */
export async function listBatches(req, res, next) {
  try {
    const { category, month, department, status, typeId } = req.query;
    const items = await batchRepo.list({ category, month, department, status, typeId });
    res.json({ items: items.map(decorate) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/batches/:id — batch + records */
export async function getBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const batch = await batchRepo.findById(id);
    if (!batch) throw httpError(404, 'ไม่พบชุดข้อมูล');
    const records = await recordRepo.findByBatch(id);
    res.json({ batch: decorate(batch), records });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/batches/upload — role: source
 * นำเข้าข้อมูลจาก excel เป็น batch สถานะ "รอตรวจสอบ" (ข้อ 2, 2.5)
 */
export async function uploadBatch(req, res, next) {
  try {
    const { category, typeId, month, department } = req.body;
    if (!req.file) throw httpError(400, 'กรุณาแนบไฟล์ excel');
    if (!category || !CATEGORY_LABELS[category]) throw httpError(400, 'category ไม่ถูกต้อง');
    if (!month) throw httpError(400, 'กรุณาระบุเดือน (YYYY-MM)');

    const { rows, errors } = parseWorkbook(req.file.buffer, category);
    if (errors.length && rows.length === 0) {
      throw httpError(422, `ไฟล์ไม่ถูกต้อง: ${errors.join('; ')}`);
    }

    const typeName = await metaRepo.typeName(category, typeId);
    const batchId = await batchRepo.create({
      category,
      typeId: typeId ? Number(typeId) : null,
      typeName,
      month,
      department: department || req.user.name,
      status: STATUS.PENDING,
      fileName: req.file.originalname,
      uploadedBy: req.user.username,
      uploadedAt: new Date(),
    });

    await recordRepo.bulkCreate(
      batchId,
      rows.map((r) => ({ ...r, status: STATUS.PENDING })),
    );

    const batch = await batchRepo.findById(batchId);
    res.status(201).json({ batch: decorate(batch), imported: rows.length, warnings: errors });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/batches/records/:id — แก้ไขบางรายการ (ข้อ 3.2) — role: treasury */
export async function updateRecord(req, res, next) {
  try {
    const id = Number(req.params.id);
    const record = await recordRepo.findById(id);
    if (!record) throw httpError(404, 'ไม่พบรายการ');
    if (record.status === STATUS.CONFIRMED) {
      throw httpError(409, 'รายการนี้ยืนยันแล้ว ไม่สามารถแก้ไขได้');
    }
    const updated = await recordRepo.updateFields(id, req.body || {});
    res.json({ record: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/batches/:id/cancel — ยกเลิกทั้งชุด (ข้อ 3.2) — role: treasury */
export async function cancelBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const batch = await batchRepo.findById(id);
    if (!batch) throw httpError(404, 'ไม่พบชุดข้อมูล');
    if (batch.status === STATUS.CONFIRMED) {
      throw httpError(409, 'ชุดข้อมูลยืนยันแล้ว ไม่สามารถยกเลิกได้');
    }
    await batchRepo.markCancelled(id, req.body?.note ?? batch.note);
    await recordRepo.setStatusByBatch(id, STATUS.CANCELLED);
    const updated = await batchRepo.findById(id);
    res.json({ batch: decorate(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/batches/:id/confirm — ยืนยันความถูกต้อง (ข้อ 3.3) — role: treasury
 * body.recordIds (optional): ยืนยันบางรายการ; ถ้าไม่ส่ง = ยืนยันทั้งชุด
 */
export async function confirmBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const batch = await batchRepo.findById(id);
    if (!batch) throw httpError(404, 'ไม่พบชุดข้อมูล');
    if (batch.status === STATUS.CANCELLED) {
      throw httpError(409, 'ชุดข้อมูลถูกยกเลิกแล้ว');
    }

    const recordIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds.map(Number) : null;
    const confirmed = recordIds
      ? await recordRepo.confirmByIds(id, recordIds)
      : await recordRepo.confirmByBatch(id);

    const { total, confirmed: confirmedCount } = await recordRepo.countByBatch(id);
    const allConfirmed = total > 0 && total === confirmedCount;
    if (allConfirmed) {
      await batchRepo.markConfirmed(id, req.user.username);
    }
    const updated = await batchRepo.findById(id);
    res.json({ batch: decorate(updated), confirmed, allConfirmed });
  } catch (err) {
    next(err);
  }
}
