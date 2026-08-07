<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 no-print">
      <h1 class="text-h5 font-weight-bold">เอกสารยืนยันรายได้</h1>
      <div class="d-flex gap-2">
        <v-btn-toggle v-model="scope" mandatory density="comfortable" color="primary" @update:model-value="load">
          <v-btn value="month">รายเดือน</v-btn>
          <v-btn value="year">สะสมทั้งปี</v-btn>
        </v-btn-toggle>
        <v-select
          v-if="scope === 'month'"
          v-model="month"
          :items="monthItems"
          item-title="label"
          item-value="value"
          label="เดือน"
          style="min-width: 180px"
          hide-details
          density="comfortable"
          @update:model-value="load"
        />
        <v-select
          v-else
          v-model="year"
          :items="yearItems"
          label="ปี (พ.ศ.)"
          style="min-width: 140px"
          hide-details
          density="comfortable"
          @update:model-value="load"
        />
        <v-btn color="primary" prepend-icon="mdi-printer" @click="print">พิมพ์</v-btn>
      </div>
    </div>

    <v-card class="pa-6 print-area" flat variant="outlined">
      <div class="text-center mb-4">
        <div class="text-h6 font-weight-bold">หนังสือรับรองการหักภาษี ณ ที่จ่าย / เงินได้</div>
        <div>คณะแพทยศาสตร์ มหาวิทยาลัยธรรมศาสตร์</div>
      </div>

      <v-row class="mb-2">
        <v-col cols="12" sm="6">
          <div><strong>ชื่อ-สกุล:</strong> {{ cert.employee?.prefix }}{{ cert.employee?.firstName }} {{ cert.employee?.lastName }}</div>
          <div><strong>ตำแหน่ง:</strong> {{ cert.employee?.position }}</div>
          <div><strong>เลขบัตรประชาชน:</strong> {{ cert.employee?.idCard }}</div>
        </v-col>
        <v-col cols="12" sm="6" class="text-sm-end">
          <div><strong>รหัสบุคลากร:</strong> {{ cert.employee?.empCode }}</div>
          <div><strong>รอบข้อมูล:</strong> {{ periodLabel }}</div>
          <div><strong>ออกเอกสารเมื่อ:</strong> {{ dateTime(cert.issuedAt) }}</div>
        </v-col>
      </v-row>

      <v-table density="comfortable" class="mb-4 bordered">
        <thead>
          <tr>
            <th>ประเภทเงินได้</th>
            <th v-if="scope === 'year'">เดือน</th>
            <th class="text-end">จำนวนเงิน</th>
            <th class="text-end">ภาษีหัก ณ ที่จ่าย</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in cert.income" :key="r.id">
            <td>{{ r.typeName }}</td>
            <td v-if="scope === 'year'">{{ monthLabel(r.month) }}</td>
            <td class="text-end">{{ baht(r.amount) }}</td>
            <td class="text-end">{{ baht(r.tax) }}</td>
          </tr>
          <tr v-if="!cert.income.length">
            <td :colspan="scope === 'year' ? 4 : 3" class="text-center text-medium-emphasis">ไม่มีข้อมูล</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-weight-bold">
            <td :colspan="scope === 'year' ? 2 : 1">รวม</td>
            <td class="text-end">{{ baht(cert.totalIncome) }}</td>
            <td class="text-end">{{ baht(cert.totalTax) }}</td>
          </tr>
        </tfoot>
      </v-table>

      <v-row>
        <v-col cols="12" sm="6" offset-sm="6" class="text-center mt-8">
          <div>......................................................</div>
          <div>เจ้าหน้าที่งานคลังและพัสดุ</div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';
import { baht, dateTime, monthLabel } from '../utils/format';

const ui = useUiStore();
const scope = ref('month');
const month = ref(null);
const year = ref(2569);
const months = ref([]);
const cert = ref({ income: [], deduction: [], totalIncome: 0, totalTax: 0, employee: null });

const monthItems = computed(() =>
  months.value.map((m) => ({ value: m, label: monthLabel(m) })),
);
const yearItems = computed(() => {
  const years = new Set(months.value.map((m) => Number(m.split('-')[0]) + 543));
  return [...years].sort().reverse();
});
const periodLabel = computed(() => {
  if (scope.value === 'month') return month.value ? monthLabel(month.value) : '-';
  return `ปี ${year.value}`;
});

async function loadMonths() {
  const { data } = await api.get('/me/months');
  months.value = data.months;
  if (data.months.length) {
    month.value = data.months[0];
    year.value = Number(data.months[0].split('-')[0]) + 543;
  }
}

async function load() {
  try {
    const params = scope.value === 'month' ? { month: month.value } : { year: year.value - 543 };
    const { data } = await api.get('/me/income-certificate', { params });
    cert.value = data;
  } catch (e) {
    ui.error(errMsg(e));
  }
}

function print() {
  window.print();
}

onMounted(async () => {
  await loadMonths();
  await load();
});
</script>

<style scoped>
.bordered :deep(th),
.bordered :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.2);
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    border: none !important;
  }
}
</style>
