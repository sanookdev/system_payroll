/**
 * ข้อมูลตัวอย่าง (demo) สำหรับ seed ลง MySQL
 * รหัสผ่านเริ่มต้นของทุกบัญชี = "password123"
 */

export const DEFAULT_PASSWORD = 'password123';

// ประเภทรายได้ (อ้างจาก upload_type ในระบบเดิม)
export const incomeTypes = [
  'เงินเดือน',
  'ค่าที่ปรึกษาคณบดี',
  'ค่าสมนาคุณผู้บริหาร',
  'ค่าตอบแทนภาระงานสอน',
  'ค่าตอบแทนแพทย์ผู้เชี่ยวชาญเฉพาะทาง',
  'ค่า พ.ต.ส.',
  'เงินรางวัลประจำปี',
  'ค่าตอบแทนผู้ปฏิบัติงานนอกเวลา',
].map((topic, i) => ({ id: i + 1, topic }));

// ประเภทรายการหัก
export const deductionTypes = [
  'ภาษี ณ ที่จ่าย',
  'ประกันสังคม',
  'กองทุนสำรองเลี้ยงชีพ',
  'กยศ. / กรอ.',
  'สหกรณ์ออมทรัพย์',
].map((topic, i) => ({ id: i + 1, topic }));

export const departments = [
  { id: 1, name: 'งานบริหารทรัพยากรมนุษย์' },
  { id: 2, name: 'งานบริการสังคม' },
  { id: 3, name: 'งานคลังและพัสดุ' },
];

// บุคลากร (master data)
export const employees = [
  { empCode: 1001, idCard: '1130200162419', prefix: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี', position: 'นักวิชาการเงินและบัญชี', department: 'งานคลังและพัสดุ', bankName: 'ทหารไทยธนชาต', accNum: '050-2-66261-2', profileImg: '' },
  { empCode: 1002, idCard: '1100501101621', prefix: 'นางสาว', firstName: 'ปิยะดา', lastName: 'สุขสมบูรณ์', position: 'นักทรัพยากรบุคคล', department: 'งานบริหารทรัพยากรมนุษย์', bankName: 'ทหารไทยธนชาต', accNum: '215-2-93550-4', profileImg: '' },
  { empCode: 1003, idCard: '1179900317740', prefix: 'นาย', firstName: 'อนุชา', lastName: 'พัฒนกิจ', position: 'เจ้าหน้าที่บริหารงานทั่วไป', department: 'งานบริการสังคม', bankName: 'ทหารไทยธนชาต', accNum: '050-2-64688-8', profileImg: '' },
  { empCode: 1004, idCard: '1710400042411', prefix: 'นางสาว', firstName: 'วริศรา', lastName: 'ทองแท้', position: 'ผู้ช่วยศาสตราจารย์', department: 'ภาควิชาอายุรศาสตร์', bankName: 'ทหารไทยธนชาต', accNum: '050-2-53160-1', profileImg: '' },
  { empCode: 1005, idCard: '1669900248751', prefix: 'นาย', firstName: 'ธนภัทร', lastName: 'ศรีสุข', position: 'อาจารย์', department: 'ภาควิชาศัลยศาสตร์', bankName: 'ทหารไทยธนชาต', accNum: '314-7-01725-9', profileImg: '' },
  { empCode: 1006, idCard: '1104200067738', prefix: 'นางสาว', firstName: 'กมลชนก', lastName: 'เจริญพร', position: 'พยาบาลวิชาชีพ', department: 'ฝ่ายการพยาบาล', bankName: 'ทหารไทยธนชาต', accNum: '215-7-42364-7', profileImg: '' },
  { empCode: 1007, idCard: '1390400071474', prefix: 'นาย', firstName: 'ณัฐวุฒิ', lastName: 'มั่นคง', position: 'นักวิชาการคอมพิวเตอร์', department: 'งานเทคโนโลยีสารสนเทศ', bankName: 'ทหารไทยธนชาต', accNum: '215-7-38044-1', profileImg: '' },
  { empCode: 1000, idCard: '1000000000001', prefix: 'นาง', firstName: 'สุภาพร', lastName: 'บริหารดี', position: 'ผู้ดูแลระบบ', department: 'งานเทคโนโลยีสารสนเทศ', bankName: 'ทหารไทยธนชาต', accNum: '050-2-00000-0', profileImg: '' },
];

// บัญชีผู้ใช้ (passwordHash เติมตอน seed)
export const users = [
  { username: 'superadmin', role: 'superadmin', empCode: 1000, name: 'สุภาพร บริหารดี' },
  { username: 'treasury', role: 'treasury', empCode: 1001, name: 'สมชาย ใจดี' },
  { username: 'source_hr', role: 'source', empCode: 1002, name: 'ปิยะดา สุขสมบูรณ์' },
  { username: 'source_social', role: 'source', empCode: 1003, name: 'อนุชา พัฒนกิจ' },
  { username: 'user', role: 'user', empCode: 1004, name: 'วริศรา ทองแท้' },
  { username: 'user2', role: 'user', empCode: 1005, name: 'ธนภัทร ศรีสุข' },
];

const money = (n) => Number(n.toFixed(2));

function incomeRecord(emp, amount, status) {
  const tax = money(amount * 0.05);
  return {
    idCard: emp.idCard, empCode: emp.empCode,
    fullname: `${emp.prefix}${emp.firstName} ${emp.lastName}`, position: emp.position,
    amount: money(amount), tax, net: money(amount - tax),
    bankName: emp.bankName, accNum: emp.accNum, status,
  };
}
function deductionRecord(emp, amount, status) {
  return {
    idCard: emp.idCard, empCode: emp.empCode,
    fullname: `${emp.prefix}${emp.firstName} ${emp.lastName}`, position: emp.position,
    amount: money(amount), tax: 0, net: money(amount),
    bankName: emp.bankName, accNum: emp.accNum, status,
  };
}

/** คืน batches (แต่ละอันมี records ฝังไว้) สำหรับ insert */
export function buildBatchesWithRecords() {
  const targets = employees.filter((e) => e.empCode >= 1004);
  return [
    {
      category: 'income', typeId: 1, typeName: 'เงินเดือน', month: '2026-07',
      department: 'งานบริหารทรัพยากรมนุษย์', status: 'confirmed', fileName: 'salary_2026-07.xlsx',
      uploadedBy: 'source_hr', uploadedAt: '2026-07-25 10:00:00',
      confirmedBy: 'treasury', confirmedAt: '2026-07-26 09:30:00', note: '',
      records: targets.map((emp, i) => incomeRecord(emp, 25000 + i * 1500, 'confirmed')),
    },
    {
      category: 'deduction', typeId: 2, typeName: 'ประกันสังคม', month: '2026-07',
      department: 'งานบริหารทรัพยากรมนุษย์', status: 'confirmed', fileName: 'social_2026-07.xlsx',
      uploadedBy: 'source_hr', uploadedAt: '2026-07-25 10:05:00',
      confirmedBy: 'treasury', confirmedAt: '2026-07-26 09:31:00', note: '',
      records: targets.map((emp) => deductionRecord(emp, 750, 'confirmed')),
    },
    {
      category: 'income', typeId: 4, typeName: 'ค่าตอบแทนภาระงานสอน', month: '2026-08',
      department: 'งานบริการสังคม', status: 'pending', fileName: 'teaching_2026-08.xlsx',
      uploadedBy: 'source_social', uploadedAt: '2026-08-05 11:00:00',
      confirmedBy: null, confirmedAt: null, note: '',
      records: targets.map((emp, i) => incomeRecord(emp, 8000 + i * 500, 'pending')),
    },
  ];
}
