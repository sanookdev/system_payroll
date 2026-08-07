<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">สวัสดี, {{ auth.user?.name }}</h1>
    <p class="text-medium-emphasis mb-6">
      <v-chip size="small" color="primary" label class="me-2">{{ auth.user?.roleLabel }}</v-chip>
      ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการเงินรายได้บุคลากร
    </p>

    <v-row>
      <v-col v-for="card in cards" :key="card.to" cols="12" sm="6" md="4">
        <v-card :to="card.to" hover height="100%">
          <v-card-text class="d-flex align-center">
            <v-avatar :color="card.color" size="52" class="me-4">
              <v-icon :icon="card.icon" color="white" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ card.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ card.desc }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert
      v-if="auth.isUser"
      type="info"
      variant="tonal"
      class="mt-6"
      icon="mdi-shield-check"
    >
      ข้อมูลรายได้/รายการหักจะแสดง<strong>เฉพาะที่ผ่านการยืนยันจากงานคลังและพัสดุแล้วเท่านั้น</strong>
      (ตามข้อกำหนด 4.2)
    </v-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const all = [
  { title: 'สลิปเงินได้ของฉัน', desc: 'ดูรายได้/รายการหักรายเดือน', icon: 'mdi-receipt-text', color: 'secondary', to: '/payslip', roles: ['user', 'superadmin'] },
  { title: 'เอกสารยืนยันรายได้', desc: 'พิมพ์เพื่อใช้ด้านภาษี', icon: 'mdi-file-certificate', color: 'info', to: '/income-certificate', roles: ['user', 'superadmin'] },
  { title: 'นำเข้าข้อมูล', desc: 'Upload excel รายได้/รายการหัก', icon: 'mdi-upload', color: 'info', to: '/upload', roles: ['source', 'superadmin'] },
  { title: 'ตรวจสอบชุดข้อมูล', desc: 'ตรวจสอบ แก้ไข ยืนยัน', icon: 'mdi-clipboard-check', color: 'primary', to: '/batches', roles: ['treasury', 'source', 'superadmin'] },
  { title: 'ภาพรวมระบบ', desc: 'สรุปยอด + ย้อนหลัง', icon: 'mdi-chart-box', color: 'success', to: '/overview', roles: ['treasury', 'superadmin'] },
  { title: 'จัดการบัญชีผู้ใช้', desc: 'สร้าง/แก้ไขสิทธิ์', icon: 'mdi-account-group', color: 'error', to: '/users', roles: ['superadmin'] },
];

const cards = computed(() => all.filter((c) => c.roles.includes(auth.role)));
</script>
