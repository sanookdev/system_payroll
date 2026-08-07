<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">สลิปเงินได้ของฉัน</h1>
        <p class="text-medium-emphasis mb-0">แสดงเฉพาะข้อมูลที่งานคลังและพัสดุยืนยันแล้ว</p>
      </div>
      <v-select
        v-model="month"
        :items="monthItems"
        item-title="label"
        item-value="value"
        label="เลือกเดือน"
        style="max-width: 220px"
        hide-details
        density="comfortable"
        @update:model-value="load"
      />
    </div>

    <v-row>
      <v-col cols="12" sm="4">
        <v-card color="success" variant="tonal">
          <v-card-text>
            <div class="text-caption">รายได้รวม</div>
            <div class="text-h5 font-weight-bold">{{ baht(data.summary.totalIncome) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card color="error" variant="tonal">
          <v-card-text>
            <div class="text-caption">รายการหักรวม</div>
            <div class="text-h5 font-weight-bold">{{ baht(data.summary.totalDeduction) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card color="primary" variant="tonal">
          <v-card-text>
            <div class="text-caption">คงเหลือสุทธิ</div>
            <div class="text-h5 font-weight-bold">{{ baht(data.summary.netPay) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-success">
            <v-icon icon="mdi-plus-circle" class="me-2" />รายได้
          </v-card-title>
          <v-divider />
          <v-table density="comfortable">
            <thead>
              <tr><th>ประเภท</th><th class="text-end">จำนวน</th><th class="text-end">ภาษี</th><th class="text-end">สุทธิ</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in data.income" :key="r.id">
                <td>{{ r.typeName }}</td>
                <td class="text-end">{{ baht(r.amount) }}</td>
                <td class="text-end">{{ baht(r.tax) }}</td>
                <td class="text-end font-weight-bold">{{ baht(r.net) }}</td>
              </tr>
              <tr v-if="!data.income.length"><td colspan="4" class="text-center text-medium-emphasis">ไม่มีข้อมูล</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-error">
            <v-icon icon="mdi-minus-circle" class="me-2" />รายการหัก
          </v-card-title>
          <v-divider />
          <v-table density="comfortable">
            <thead>
              <tr><th>ประเภท</th><th class="text-end">จำนวน</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in data.deduction" :key="r.id">
                <td>{{ r.typeName }}</td>
                <td class="text-end font-weight-bold">{{ baht(r.net) }}</td>
              </tr>
              <tr v-if="!data.deduction.length"><td colspan="2" class="text-center text-medium-emphasis">ไม่มีข้อมูล</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';
import { baht, monthLabel } from '../utils/format';

const ui = useUiStore();
const month = ref(null);
const months = ref([]);
const data = ref({ income: [], deduction: [], summary: { totalIncome: 0, totalDeduction: 0, netPay: 0 } });

const monthItems = computed(() => [
  { value: null, label: 'ทั้งหมด' },
  ...months.value.map((m) => ({ value: m, label: monthLabel(m) })),
]);

async function loadMonths() {
  const { data: d } = await api.get('/me/months');
  months.value = d.months;
  if (d.months.length) month.value = d.months[0];
}

async function load() {
  try {
    const params = month.value ? { month: month.value } : {};
    const { data: d } = await api.get('/me/payslip', { params });
    data.value = d;
  } catch (e) {
    ui.error(errMsg(e));
  }
}

onMounted(async () => {
  await loadMonths();
  await load();
});
</script>
