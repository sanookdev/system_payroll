<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">โปรไฟล์บุคลากร</h1>
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <v-avatar size="96" color="primary" class="mb-3">
              <v-img v-if="p?.profileImg" :src="p.profileImg" />
              <span v-else class="text-h4">{{ initials }}</span>
            </v-avatar>
            <div class="text-h6 font-weight-bold">{{ p?.fullname || auth.user?.name }}</div>
            <div class="text-medium-emphasis">{{ p?.position }}</div>
            <v-chip color="primary" size="small" label class="mt-2">{{ auth.user?.roleLabel }}</v-chip>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>ข้อมูลจากระบบ PMIS</v-card-title>
          <v-card-subtitle>ดึงสดจากระบบทะเบียนบุคลากร (master data — ไม่แก้ไขในระบบ Payroll)</v-card-subtitle>
          <v-divider />
          <v-list>
            <v-list-item v-for="row in rows" :key="row.label">
              <template #prepend>
                <v-icon :icon="row.icon" class="me-3 text-medium-emphasis" />
              </template>
              <v-list-item-subtitle>{{ row.label }}</v-list-item-subtitle>
              <v-list-item-title class="font-weight-medium">{{ row.value || '-' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const p = computed(() => auth.user?.profile);
const initials = computed(() => (auth.user?.name || '?').trim().charAt(0));

const rows = computed(() => [
  { label: 'รหัสบุคลากร', value: auth.user?.empCode, icon: 'mdi-badge-account' },
  { label: 'เลขบัตรประชาชน', value: p.value?.idCard, icon: 'mdi-card-account-details' },
  { label: 'ตำแหน่ง', value: p.value?.position, icon: 'mdi-briefcase' },
  { label: 'หน่วยงาน', value: p.value?.department, icon: 'mdi-office-building' },
  { label: 'ธนาคาร', value: p.value?.bankName, icon: 'mdi-bank' },
  { label: 'เลขที่บัญชี', value: p.value?.accNum, icon: 'mdi-numeric' },
]);
</script>
