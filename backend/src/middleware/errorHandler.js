export function notFound(req, res) {
  res.status(404).json({ message: `ไม่พบเส้นทาง ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ message: err.message || 'เกิดข้อผิดพลาดภายในระบบ' });
}

/** helper สร้าง error ที่มี status */
export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
