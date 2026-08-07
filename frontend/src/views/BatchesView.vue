<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">ตรวจสอบชุดข้อมูล</h1>
    <p class="text-medium-emphasis mb-4">ค้นหาและตรวจสอบข้อมูลตามประเภท / เดือน / หน่วยงาน (ข้อ 3.1)</p>

    <v-card class="mb-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.category"
              :items="categoryOptions"
              item-title="label"
              item-value="value"
              label="หมวด"
              clearable
              hide-details
              @update:model-value="load"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.month"
              label="เดือน"
              type="month"
              clearable
              hide-details
              @update:model-value="load"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="สถานะ"
              clearable
              hide-details
              @update:model-value="load"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="search"
              label="ค้นหา (หน่วยงาน/ไฟล์/ประเภท)"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        item-value="id"
        density="comfortable"
        @click:row="(_, { item }) => open(item)"
      >
        <template #[`item.category`]="{ item }">
          <v-chip size="small" label :color="item.category === 'income' ? 'success' : 'info'">
            {{ item.categoryLabel }}
          </v-chip>
        </template>
        <template #[`item.month`]="{ item }">{{ monthLabel(item.month) }}</template>
        <template #[`item.totalAmount`]="{ item }">{{ baht(item.totalAmount) }}</template>
        <template #[`item.status`]="{ item }">
          <v-chip size="small" :color="STATUS_COLOR[item.status]" label>
            {{ STATUS_LABEL[item.status] }}
          </v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn size="small" variant="text" color="primary" :to="`/batches/${item.id}`">
            เปิด <v-icon icon="mdi-chevron-right" end />
          </v-btn>
        </template>
        <template #no-data>
          <div class="pa-6 text-medium-emphasis">ไม่พบชุดข้อมูล</div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';
import { baht, monthLabel, STATUS_COLOR, STATUS_LABEL } from '../utils/format';

const router = useRouter();
const ui = useUiStore();
const loading = ref(false);
const items = ref([]);
const search = ref('');
const filters = ref({ category: null, month: null, status: null });

const categoryOptions = [
  { value: 'income', label: 'รายได้' },
  { value: 'deduction', label: 'รายการหัก' },
  { value: 'budget', label: 'แหล่งงบประมาณ' },
  { value: 'bank', label: 'บัญชีธนาคาร' },
];
const statusOptions = [
  { value: 'pending', label: 'รอตรวจสอบ' },
  { value: 'confirmed', label: 'ยืนยันแล้ว' },
  { value: 'cancelled', label: 'ยกเลิก' },
];

const headers = [
  { title: '#', key: 'id', width: 60 },
  { title: 'หมวด', key: 'category' },
  { title: 'ประเภท', key: 'typeName' },
  { title: 'เดือน', key: 'month' },
  { title: 'หน่วยงาน', key: 'department' },
  { title: 'รายการ', key: 'recordCount', align: 'end' },
  { title: 'ยอดสุทธิ (บาท)', key: 'totalAmount', align: 'end' },
  { title: 'สถานะ', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const filteredItems = computed(() => {
  const q = (search.value || '').toLowerCase();
  if (!q) return items.value;
  return items.value.filter((b) =>
    [b.department, b.fileName, b.typeName].some((f) => (f || '').toLowerCase().includes(q)),
  );
});

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.month) params.month = filters.value.month;
    if (filters.value.status) params.status = filters.value.status;
    const { data } = await api.get('/batches', { params });
    items.value = data.items;
  } catch (e) {
    ui.error(errMsg(e));
  } finally {
    loading.value = false;
  }
}

function open(item) {
  router.push(`/batches/${item.id}`);
}

onMounted(load);
</script>
