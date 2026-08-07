<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">นำเข้าข้อมูล (Upload Excel)</h1>
    <p class="text-medium-emphasis mb-6">
      นำเข้ารายได้ / รายการหัก / งบประมาณ / บัญชีธนาคาร — ข้อมูลจะถูกบันทึกเป็นสถานะ
      <v-chip size="x-small" color="warning" label>รอตรวจสอบ</v-chip> เพื่อส่งให้งานคลังและพัสดุตรวจสอบ
    </p>

    <v-row>
      <v-col cols="12" md="7">
        <v-card>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="submit">
              <v-select
                v-model="form.category"
                :items="categories"
                item-title="label"
                item-value="value"
                label="หมวดข้อมูล"
                :rules="[req]"
              />
              <v-select
                v-model="form.typeId"
                :items="typeOptions"
                item-title="topic"
                item-value="id"
                label="ประเภท"
                :rules="[req]"
              />
              <v-text-field
                v-model="form.month"
                label="เดือนข้อมูล"
                type="month"
                :rules="[req]"
              />
              <v-text-field v-model="form.department" label="หน่วยงาน/ต้นทาง" />
              <v-file-input
                v-model="file"
                label="ไฟล์ Excel (.xlsx)"
                accept=".xlsx,.xls"
                prepend-icon="mdi-file-excel"
                variant="outlined"
                density="comfortable"
                :rules="[reqFile]"
                show-size
              />
              <div class="d-flex gap-2 mt-2">
                <v-btn type="submit" color="primary" :loading="loading" prepend-icon="mdi-upload">
                  นำเข้าข้อมูล
                </v-btn>
                <v-btn variant="text" prepend-icon="mdi-download" @click="downloadTemplate">
                  ดาวน์โหลด Template
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <v-alert v-if="result" type="success" variant="tonal" class="mt-4">
          นำเข้าสำเร็จ {{ result.imported }} รายการ — ชุดข้อมูล #{{ result.batch.id }}
          <div v-if="result.warnings?.length" class="mt-2 text-caption">
            คำเตือน: {{ result.warnings.join('; ') }}
          </div>
          <template #append>
            <v-btn size="small" variant="text" :to="`/batches/${result.batch.id}`">ดูรายละเอียด</v-btn>
          </template>
        </v-alert>
      </v-col>

      <v-col cols="12" md="5">
        <v-card variant="tonal" color="info">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-information" class="me-2" />รูปแบบไฟล์
          </v-card-title>
          <v-card-text class="text-body-2">
            <p class="mb-2">คอลัมน์ที่รองรับ (หัวตารางไทย/อังกฤษ):</p>
            <ul class="ms-4">
              <li><code>id_card</code> — เลขบัตรประชาชน (จำเป็น)</li>
              <li><code>fullname</code> — ชื่อ-สกุล</li>
              <li><code>position</code> — ตำแหน่ง</li>
              <li><code>amount</code> — จำนวนเงิน</li>
              <li><code>vat</code> — ภาษี (เฉพาะรายได้)</li>
              <li><code>net</code> — ยอดสุทธิ</li>
              <li><code>name_bank</code>, <code>acc_num</code> — ธนาคาร/บัญชี</li>
            </ul>
            <p class="mt-3 mb-0">
              หากไม่ระบุ <code>net</code> ระบบจะคำนวณ (รายได้ = amount − vat)
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();
const formRef = ref(null);
const file = ref(null);
const loading = ref(false);
const result = ref(null);
const meta = ref({ incomeTypes: [], deductionTypes: [], categories: [] });

const form = ref({
  category: 'income',
  typeId: null,
  month: new Date().toISOString().slice(0, 7),
  department: '',
});

const req = (v) => (!!v || v === 0 ? true : 'จำเป็นต้องกรอก');
const reqFile = (v) => (v ? true : 'กรุณาเลือกไฟล์');

const categories = computed(() => meta.value.categories);
const typeOptions = computed(() =>
  form.value.category === 'deduction' ? meta.value.deductionTypes : meta.value.incomeTypes,
);

onMounted(async () => {
  const { data } = await api.get('/meta');
  meta.value = data;
});

async function submit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  result.value = null;
  try {
    const fd = new FormData();
    const f = Array.isArray(file.value) ? file.value[0] : file.value;
    fd.append('file', f);
    fd.append('category', form.value.category);
    fd.append('typeId', form.value.typeId ?? '');
    fd.append('month', form.value.month);
    fd.append('department', form.value.department);
    const { data } = await api.post('/batches/upload', fd);
    result.value = data;
    ui.success(`นำเข้า ${data.imported} รายการสำเร็จ`);
    file.value = null;
  } catch (e) {
    ui.error(errMsg(e, 'นำเข้าไม่สำเร็จ'));
  } finally {
    loading.value = false;
  }
}

async function downloadTemplate() {
  try {
    const res = await api.get('/export/template', {
      params: { category: form.value.category },
      responseType: 'blob',
    });
    downloadBlob(res.data, `template_${form.value.category}.xlsx`);
  } catch (e) {
    ui.error(errMsg(e));
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
