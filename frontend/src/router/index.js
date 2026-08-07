import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue') },

      // บุคลากร
      { path: 'payslip', name: 'payslip', component: () => import('../views/PayslipView.vue'), meta: { roles: ['user', 'superadmin'] } },
      { path: 'income-certificate', name: 'income-certificate', component: () => import('../views/IncomeCertificateView.vue'), meta: { roles: ['user', 'superadmin'] } },

      // หน่วยงานต้นทาง
      { path: 'upload', name: 'upload', component: () => import('../views/UploadView.vue'), meta: { roles: ['source', 'superadmin'] } },

      // คลังและพัสดุ / source (ดูชุดข้อมูล)
      { path: 'batches', name: 'batches', component: () => import('../views/BatchesView.vue'), meta: { roles: ['treasury', 'source', 'superadmin'] } },
      { path: 'batches/:id', name: 'batch-detail', component: () => import('../views/BatchDetailView.vue'), meta: { roles: ['treasury', 'source', 'superadmin'] } },

      // ภาพรวม (admin)
      { path: 'overview', name: 'overview', component: () => import('../views/OverviewView.vue'), meta: { roles: ['treasury', 'superadmin'] } },

      // จัดการบัญชี (superadmin)
      { path: 'users', name: 'users', component: () => import('../views/UsersView.vue'), meta: { roles: ['superadmin'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' };
    return true;
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
