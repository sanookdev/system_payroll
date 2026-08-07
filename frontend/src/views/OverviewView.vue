<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">ภาพรวมระบบ</h1>
    <p class="text-medium-emphasis mb-4">สรุปยอดข้อมูลที่ยืนยันแล้ว + ค้นหาย้อนหลัง (ข้อ 4.5)</p>

    <v-card class="mb-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field v-model="filters.month" label="เดือน" type="month" clearable hide-details @update:model-value="load" />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select v-model="filters.category" :items="categoryOptions" item-title="label" item-value="value" label="หมวด" clearable hide-details @update:model-value="load" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col v-for="s in statCards" :key="s.label" cols="6" md="3">
        <v-card :color="s.color" variant="tonal">
          <v-card-text>
            <div class="text-caption">{{ s.label }}</div>
            <div class="text-h5 font-weight-bold">{{ s.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" sm="4">
        <v-card color="success" variant="tonal">
          <v-card-text>
            <div class="text-caption">รายได้รวม (ยืนยันแล้ว)</div>
            <div class="text-h5 font-weight-bold">{{ baht(data.totals.totalIncome) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card color="error" variant="tonal">
          <v-card-text>
            <div class="text-caption">รายการหักรวม</div>
            <div class="text-h5 font-weight-bold">{{ baht(data.totals.totalDeduction) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card color="info" variant="tonal">
          <v-card-text>
            <div class="text-caption">จำนวนบุคลากร</div>
            <div class="text-h5 font-weight-bold">{{ data.totals.headcount }} คน</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-4">
      <v-card-title>สรุปตามประเภท</v-card-title>
      <v-divider />
      <v-table>
        <thead>
          <tr><th>หมวด</th><th>ประเภท</th><th class="text-end">จำนวนรายการ</th><th class="text-end">ยอดสุทธิ (บาท)</th></tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in data.byType" :key="i">
            <td><v-chip size="x-small" label :color="t.category === 'income' ? 'success' : 'info'">{{ t.category === 'income' ? 'รายได้' : 'รายการหัก' }}</v-chip></td>
            <td>{{ t.typeName }}</td>
            <td class="text-end">{{ t.count }}</td>
            <td class="text-end font-weight-bold">{{ baht(t.total) }}</td>
          </tr>
          <tr v-if="!data.byType.length"><td colspan="4" class="text-center text-medium-emphasis pa-4">ไม่มีข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';
import { baht } from '../utils/format';

const ui = useUiStore();
const filters = ref({ month: null, category: null });
const data = ref({
  stats: { totalBatches: 0, pending: 0, confirmed: 0, cancelled: 0, totalRecords: 0 },
  totals: { totalIncome: 0, totalDeduction: 0, headcount: 0 },
  byType: [],
});

const categoryOptions = [
  { value: 'income', label: 'รายได้' },
  { value: 'deduction', label: 'รายการหัก' },
];

const statCards = computed(() => [
  { label: 'ชุดข้อมูลทั้งหมด', value: data.value.stats.totalBatches, color: 'primary' },
  { label: 'รอตรวจสอบ', value: data.value.stats.pending, color: 'warning' },
  { label: 'ยืนยันแล้ว', value: data.value.stats.confirmed, color: 'success' },
  { label: 'ยกเลิก', value: data.value.stats.cancelled, color: 'error' },
]);

async function load() {
  try {
    const params = {};
    if (filters.value.month) params.month = filters.value.month;
    if (filters.value.category) params.category = filters.value.category;
    const { data: d } = await api.get('/overview', { params });
    data.value = d;
  } catch (e) {
    ui.error(errMsg(e));
  }
}

onMounted(load);
</script>
