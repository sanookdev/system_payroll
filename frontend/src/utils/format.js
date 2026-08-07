export function baht(n) {
  const v = Number(n || 0);
  return v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function monthLabel(ym) {
  if (!ym) return '-';
  const [y, m] = ym.split('-');
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  return `${months[Number(m) - 1] || m} ${Number(y) + 543}`;
}

export const STATUS_COLOR = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
};

export const STATUS_LABEL = {
  pending: 'รอตรวจสอบ',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};
