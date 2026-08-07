import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// แนบ Bearer token ทุก request (เทียบ Phase B ในเอกสาร)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('payroll_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// token หมดอายุ/ไม่ถูกต้อง -> เคลียร์ session
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('payroll_token');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

/** helper: ดึงข้อความ error จาก axios */
export function errMsg(err, fallback = 'เกิดข้อผิดพลาด') {
  return err?.response?.data?.message || err?.message || fallback;
}
