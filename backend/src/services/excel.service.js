import * as XLSX from 'xlsx';
import { CATEGORY } from '../config/constants.js';

/**
 * แปลงไฟล์ excel ที่ upload เป็น record ในระบบ (เอกสารข้อ 2.5)
 * รองรับหัวคอลัมน์ทั้งไทย/อังกฤษแบบยืดหยุ่น
 */
const COLUMN_ALIASES = {
  idCard: ['id_card', 'idcard', 'เลขบัตรประชาชน', 'เลขประจำตัวประชาชน', 'บัตรประชาชน'],
  fullname: ['fullname', 'name', 'ชื่อ-สกุล', 'ชื่อ', 'ชื่อสกุล', 'ชื่อ-นามสกุล'],
  position: ['position', 'ตำแหน่ง'],
  amount: ['amount', 'จำนวนเงิน', 'รายได้', 'ยอด', 'เงิน'],
  tax: ['vat', 'tax', 'ภาษี', 'ภาษีหักณที่จ่าย'],
  net: ['net', 'total', 'สุทธิ', 'รายรับสุทธิ', 'ยอดสุทธิ'],
  bankName: ['name_bank', 'bank', 'ธนาคาร'],
  accNum: ['acc_num', 'account', 'เลขที่บัญชี', 'เลขบัญชี', 'บัญชี'],
};

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/\s|_|-/g, '');
}

function buildHeaderMap(row) {
  const map = {};
  for (const rawHeader of Object.keys(row)) {
    const norm = normalizeKey(rawHeader);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((a) => normalizeKey(a) === norm)) {
        map[field] = rawHeader;
        break;
      }
    }
  }
  return map;
}

function toNumber(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Buffer} buffer   เนื้อไฟล์ excel
 * @param {string} category income | deduction | budget | bank
 * @returns {{rows: object[], errors: string[]}}
 */
export function parseWorkbook(buffer, category) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const errors = [];
  const rows = [];

  if (json.length === 0) {
    errors.push('ไฟล์ไม่มีข้อมูล');
    return { rows, errors };
  }

  const headerMap = buildHeaderMap(json[0]);
  if (!headerMap.idCard) {
    errors.push('ไม่พบคอลัมน์ "เลขบัตรประชาชน" (id_card)');
  }

  json.forEach((raw, idx) => {
    const line = idx + 2; // +1 header, +1 index base
    const idCard = String(raw[headerMap.idCard] ?? '').trim();
    if (!idCard) {
      errors.push(`แถวที่ ${line}: ไม่มีเลขบัตรประชาชน`);
      return;
    }
    const amount = toNumber(raw[headerMap.amount]);
    const tax = category === CATEGORY.INCOME ? toNumber(raw[headerMap.tax]) : 0;
    const netRaw = toNumber(raw[headerMap.net]);
    const net = netRaw || (category === CATEGORY.INCOME ? amount - tax : amount);

    rows.push({
      idCard,
      fullname: String(raw[headerMap.fullname] ?? '').trim(),
      position: String(raw[headerMap.position] ?? '').trim(),
      amount,
      tax,
      net,
      bankName: String(raw[headerMap.bankName] ?? '').trim(),
      accNum: String(raw[headerMap.accNum] ?? '').trim(),
    });
  });

  return { rows, errors };
}

/**
 * สร้างไฟล์ excel รูปแบบส่งธนาคาร (เอกสารข้อ 3.4)
 * @param {object[]} records รายการที่ยืนยันแล้ว
 * @returns {Buffer}
 */
export function buildBankExport(records) {
  const data = records.map((r, i) => ({
    ลำดับ: i + 1,
    'เลขที่บัญชี': r.accNum,
    ธนาคาร: r.bankName,
    'ชื่อ-สกุล': r.fullname,
    'เลขบัตรประชาชน': r.idCard,
    จำนวนเงิน: r.net,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BankTransfer');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/** สร้าง template ว่างสำหรับให้หน่วยงานต้นทางกรอก */
export function buildTemplate(category) {
  const headers =
    category === CATEGORY.DEDUCTION
      ? { id_card: '', fullname: '', position: '', amount: '', acc_num: '', name_bank: '' }
      : { id_card: '', fullname: '', position: '', amount: '', vat: '', net: '', acc_num: '', name_bank: '' };
  const ws = XLSX.utils.json_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
