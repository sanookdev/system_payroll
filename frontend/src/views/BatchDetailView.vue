<template>
  <div v-if="batch">
    <div class="d-flex align-center mb-1">
      <v-btn icon variant="text" to="/batches"><v-icon icon="mdi-arrow-left" /></v-btn>
      <h1 class="text-h5 font-weight-bold">ชุดข้อมูล #{{ batch.id }}</h1>
      <v-chip class="ms-3" :color="STATUS_COLOR[batch.status]" label>
        {{ STATUS_LABEL[batch.status] }}
      </v-chip>
    </div>

    <v-row class="mb-2">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-row dense>
              <v-col v-for="info in infoRows" :key="info.label" cols="6" md="3">
                <div class="text-caption text-medium-emphasis">{{ info.label }}</div>
                <div class="font-weight-medium">{{ info.value }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal" height="100%">
          <v-card-text>
            <div class="text-caption">ยอดสุทธิรวม</div>
            <div class="text-h5 font-weight-bold">{{ baht(batch.totalAmount) }} บาท</div>
            <div class="text-caption mt-2">
              ยืนยันแล้ว {{ batch.confirmedCount }}/{{ batch.recordCount }} รายการ
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- แถบเครื่องมือ (เฉพาะคลังและพัสดุ/superadmin) -->
    <v-card v-if="canManage" class="mb-3">
      <v-card-text class="d-flex flex-wrap align-center gap-2">
        <v-btn
          color="success"
          prepend-icon="mdi-check-all"
          :disabled="batch.status === 'cancelled' || pendingCount === 0"
          @click="confirm(null)"
        >
          ยืนยันทั้งชุด
        </v-btn>
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-check"
          :disabled="selected.length === 0"
          @click="confirm(selected)"
        >
          ยืนยันที่เลือก ({{ selected.length }})
        </v-btn>
        <v-divider vertical class="mx-2" />
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-cancel"
          :disabled="batch.status !== 'pending'"
          @click="cancelDialog = true"
        >
          ยกเลิกทั้งชุด
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="batch.category === 'income'"
          color="primary"
          prepend-icon="mdi-bank-transfer"
          :disabled="batch.confirmedCount === 0"
          @click="exportBank"
        >
          Export ส่งธนาคาร
        </v-btn>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="batch.status === 'cancelled'"
      type="error"
      variant="tonal"
      class="mb-3"
      icon="mdi-cancel"
    >
      ชุดข้อมูลนี้ถูกยกเลิก — หน่วยงานต้นทางต้องแก้ไขและ upload ไฟล์ใหม่
      <span v-if="batch.note">({{ batch.note }})</span>
    </v-alert>

    <v-card>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="records"
        item-value="id"
        :show-select="canManage && batch.status === 'pending'"
        density="comfortable"
      >
        <template #[`item.amount`]="{ item }">{{ baht(item.amount) }}</template>
        <template #[`item.tax`]="{ item }">{{ baht(item.tax) }}</template>
        <template #[`item.net`]="{ item }">
          <span class="font-weight-bold">{{ baht(item.net) }}</span>
        </template>
        <template #[`item.status`]="{ item }">
          <v-chip size="x-small" :color="STATUS_COLOR[item.status]" label>
            {{ STATUS_LABEL[item.status] }}
          </v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            v-if="canManage && item.status === 'pending'"
            size="small"
            icon="mdi-pencil"
            variant="text"
            @click="editRecord(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog แก้ไขรายการ -->
    <v-dialog v-model="editDialog" max-width="520">
      <v-card>
        <v-card-title>แก้ไขรายการ</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.fullname" label="ชื่อ-สกุล" />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="editForm.amount" label="จำนวนเงิน" type="number" @update:model-value="recalc" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="editForm.tax" label="ภาษี" type="number" @update:model-value="recalc" /></v-col>
          </v-row>
          <v-text-field v-model.number="editForm.net" label="ยอดสุทธิ" type="number" />
          <v-row dense>
            <v-col cols="7"><v-text-field v-model="editForm.bankName" label="ธนาคาร" /></v-col>
            <v-col cols="5"><v-text-field v-model="editForm.accNum" label="เลขที่บัญชี" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveRecord">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ยกเลิกทั้งชุด -->
    <v-dialog v-model="cancelDialog" max-width="480">
      <v-card>
        <v-card-title>ยกเลิกทั้งชุด</v-card-title>
        <v-card-text>
          <p class="mb-3">ยืนยันการยกเลิกชุดข้อมูล #{{ batch.id }}? หน่วยงานต้นทางต้อง upload ใหม่</p>
          <v-textarea v-model="cancelNote" label="หมายเหตุ (เหตุผล)" rows="2" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">ปิด</v-btn>
          <v-btn color="error" :loading="saving" @click="doCancel">ยืนยันการยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api, { errMsg } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { baht, dateTime, monthLabel, STATUS_COLOR, STATUS_LABEL } from '../utils/format';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

const batch = ref(null);
const records = ref([]);
const selected = ref([]);
const saving = ref(false);

const editDialog = ref(false);
const editForm = ref({});
const cancelDialog = ref(false);
const cancelNote = ref('');

const canManage = computed(() => ['treasury', 'superadmin'].includes(auth.role));
const pendingCount = computed(() => records.value.filter((r) => r.status === 'pending').length);

const headers = [
  { title: 'เลขบัตร ปชช.', key: 'idCard' },
  { title: 'ชื่อ-สกุล', key: 'fullname' },
  { title: 'จำนวนเงิน', key: 'amount', align: 'end' },
  { title: 'ภาษี', key: 'tax', align: 'end' },
  { title: 'สุทธิ', key: 'net', align: 'end' },
  { title: 'ธนาคาร', key: 'bankName' },
  { title: 'บัญชี', key: 'accNum' },
  { title: 'สถานะ', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const infoRows = computed(() => [
  { label: 'หมวด', value: batch.value.categoryLabel },
  { label: 'ประเภท', value: batch.value.typeName || '-' },
  { label: 'เดือน', value: monthLabel(batch.value.month) },
  { label: 'หน่วยงาน', value: batch.value.department },
  { label: 'ไฟล์', value: batch.value.fileName },
  { label: 'นำเข้าโดย', value: batch.value.uploadedBy },
  { label: 'เวลานำเข้า', value: dateTime(batch.value.uploadedAt) },
  { label: 'ยืนยันโดย', value: batch.value.confirmedBy || '-' },
]);

async function load() {
  const { data } = await api.get(`/batches/${route.params.id}`);
  batch.value = data.batch;
  records.value = data.records;
  selected.value = [];
}

async function confirm(ids) {
  saving.value = true;
  try {
    const body = ids && ids.length ? { recordIds: ids } : {};
    const { data } = await api.post(`/batches/${batch.value.id}/confirm`, body);
    ui.success(`ยืนยัน ${data.confirmed} รายการสำเร็จ`);
    await load();
  } catch (e) {
    ui.error(errMsg(e));
  } finally {
    saving.value = false;
  }
}

function editRecord(item) {
  editForm.value = { ...item };
  editDialog.value = true;
}
function recalc() {
  const amt = Number(editForm.value.amount || 0);
  const tax = Number(editForm.value.tax || 0);
  if (batch.value.category === 'income') editForm.value.net = amt - tax;
}
async function saveRecord() {
  saving.value = true;
  try {
    await api.patch(`/batches/records/${editForm.value.id}`, {
      fullname: editForm.value.fullname,
      amount: Number(editForm.value.amount),
      tax: Number(editForm.value.tax),
      net: Number(editForm.value.net),
      bankName: editForm.value.bankName,
      accNum: editForm.value.accNum,
    });
    ui.success('บันทึกการแก้ไขแล้ว');
    editDialog.value = false;
    await load();
  } catch (e) {
    ui.error(errMsg(e));
  } finally {
    saving.value = false;
  }
}

async function doCancel() {
  saving.value = true;
  try {
    await api.post(`/batches/${batch.value.id}/cancel`, { note: cancelNote.value });
    ui.success('ยกเลิกชุดข้อมูลแล้ว');
    cancelDialog.value = false;
    await load();
  } catch (e) {
    ui.error(errMsg(e));
  } finally {
    saving.value = false;
  }
}

async function exportBank() {
  try {
    const res = await api.get(`/export/bank/${batch.value.id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_transfer_${batch.value.month}_${batch.value.id}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ui.success('ดาวน์โหลดไฟล์ส่งธนาคารแล้ว');
  } catch (e) {
    ui.error(errMsg(e));
  }
}

onMounted(load);
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
