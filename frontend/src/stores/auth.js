import { defineStore } from 'pinia';
import api from '../services/api';

const TOKEN_KEY = 'payroll_token';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    role: (s) => s.user?.role || null,
    isSuperAdmin: (s) => s.user?.role === 'superadmin',
    isTreasury: (s) => s.user?.role === 'treasury',
    isSource: (s) => s.user?.role === 'source',
    isUser: (s) => s.user?.role === 'user',
    // admin ทั่วไป (เห็นเมนูภาพรวม)
    isAdmin: (s) => ['treasury', 'superadmin'].includes(s.user?.role),
  },
  actions: {
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.user;
    },
    async restore() {
      if (!this.token) {
        this.ready = true;
        return null;
      }
      try {
        const { data } = await api.get('/auth/me');
        this.user = data.user;
      } catch {
        this.logout();
      } finally {
        this.ready = true;
      }
      return this.user;
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});
