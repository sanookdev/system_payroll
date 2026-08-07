<template>
  <v-app-bar flat color="primary" density="comfortable">
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-app-bar-title class="font-weight-bold">
      <v-icon icon="mdi-cash-multiple" class="me-2" />
      ระบบเงินรายได้บุคลากร
    </v-app-bar-title>
    <v-spacer />
    <v-btn icon variant="text" @click="toggleTheme">
      <v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
    </v-btn>
    <v-menu>
      <template #activator="{ props }">
        <v-btn variant="text" v-bind="props" class="text-none">
          <v-avatar size="30" color="secondary" class="me-2">
            <span class="text-caption">{{ initials }}</span>
          </v-avatar>
          {{ auth.user?.name }}
          <v-icon icon="mdi-chevron-down" size="small" class="ms-1" />
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item :subtitle="auth.user?.roleLabel" :title="auth.user?.name" />
        <v-divider />
        <v-list-item prepend-icon="mdi-account" title="โปรไฟล์" to="/profile" />
        <v-list-item prepend-icon="mdi-logout" title="ออกจากระบบ" @click="logout" />
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer">
    <v-list nav density="comfortable">
      <template v-for="item in menu" :key="item.to">
        <v-list-item
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          color="primary"
        />
      </template>
    </v-list>
    <template #append>
      <div class="pa-3 text-caption text-medium-emphasis">
        คณะแพทยศาสตร์<br />มหาวิทยาลัยธรรมศาสตร์
      </div>
    </template>
  </v-navigation-drawer>

  <v-main class="bg-background">
    <v-container fluid class="pa-4 pa-md-6" style="max-width: 1280px">
      <router-view />
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const theme = useTheme();
const drawer = ref(true);

const isDark = computed(() => theme.global.name.value === 'payrollDark');
function toggleTheme() {
  theme.global.name.value = isDark.value ? 'payrollLight' : 'payrollDark';
}

const initials = computed(() => (auth.user?.name || '?').trim().charAt(0));

// เมนูตาม role
const allItems = [
  { title: 'แดชบอร์ด', icon: 'mdi-view-dashboard', to: '/dashboard', roles: ['*'] },
  { title: 'สลิปเงินได้ของฉัน', icon: 'mdi-receipt-text', to: '/payslip', roles: ['user', 'superadmin'] },
  { title: 'เอกสารยืนยันรายได้', icon: 'mdi-file-certificate', to: '/income-certificate', roles: ['user', 'superadmin'] },
  { title: 'นำเข้าข้อมูล (Upload)', icon: 'mdi-upload', to: '/upload', roles: ['source', 'superadmin'] },
  { title: 'ตรวจสอบชุดข้อมูล', icon: 'mdi-clipboard-check', to: '/batches', roles: ['treasury', 'source', 'superadmin'] },
  { title: 'ภาพรวมระบบ', icon: 'mdi-chart-box', to: '/overview', roles: ['treasury', 'superadmin'] },
  { title: 'จัดการบัญชีผู้ใช้', icon: 'mdi-account-group', to: '/users', roles: ['superadmin'] },
  { title: 'โปรไฟล์', icon: 'mdi-account', to: '/profile', roles: ['*'] },
];
const menu = computed(() =>
  allItems.filter((i) => i.roles.includes('*') || i.roles.includes(auth.role)),
);

function logout() {
  auth.logout();
  router.push('/login');
}
</script>
