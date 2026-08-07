<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">จัดการบัญชีผู้ใช้</h1>
        <p class="text-medium-emphasis mb-0">สร้าง/แก้ไขบัญชีและกำหนดสิทธิ์ 4 ระดับ (ข้อ 5.1)</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">เพิ่มบัญชี</v-btn>
    </div>

    <v-card>
      <v-data-table :headers="headers" :items="users" :loading="loading" item-value="id" density="comfortable">
        <template #[`item.role`]="{ item }">
          <v-chip size="small" :color="roleColor(item.role)" label>{{ item.roleLabel }}</v-chip>
        </template>
        <template #[`item.active`]="{ item }">
          <v-icon :icon="item.active ? 'mdi-check-circle' : 'mdi-close-circle'" :color="item.active ? 'success' : 'error'" />
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn size="small" icon="mdi-pencil" variant="text" @click="openEdit(item)" />
          <v-btn v-if="item.active" size="small" icon="mdi-account-off" variant="text" color="error" @click="deactivate(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>{{ editing ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.username" label="Username" :disabled="editing" />
          <v-text-field v-model="form.name" label="ชื่อ-สกุล" />
          <v-select v-model="form.role" :items="roles" item-title="label" item-value="value" label="สิทธิ์ (role)" />
          <v-select v-model="form.empCode" :items="employees" item-title="fullname" item-value="empCode" label="ผูกกับบุคลากร" clearable />
          <v-text-field v-model="form.password" :label="editing ? 'รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่าน'" type="password" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api, { errMsg } from '../services/api';
import { useUiStore } from '../stores/ui';

const ui = useUiStore();
const users = ref([]);
const employees = ref([]);
const roles = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editing = ref(false);
const form = ref({});

const headers = [
  { title: 'Username', key: 'username' },
  { title: 'ชื่อ-สกุล', key: 'name' },
  { title: 'สิทธิ์', key: 'role' },
  { title: 'รหัสบุคลากร', key: 'empCode' },
  { title: 'ใช้งาน', key: 'active', align: 'center' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const roleColor = (r) => ({ superadmin: 'error', treasury: 'primary', source: 'info', user: 'secondary' }[r] || 'grey');

async function load() {
  loading.value = true;
  try {
    const [u, m, e] = await Promise.all([
      api.get('/users'),
      api.get('/meta'),
      api.get('/employees'),
    ]);
    users.value = u.data.items;
    roles.value = m.data.roles;
    employees.value = e.data.items;
  } catch (err) {
    ui.error(errMsg(err));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = false;
  form.value = { username: '', name: '', role: 'user', empCode: null, password: '' };
  dialog.value = true;
}
function openEdit(item) {
  editing.value = true;
  form.value = { ...item, password: '' };
  dialog.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      const body = { name: form.value.name, role: form.value.role, empCode: form.value.empCode };
      if (form.value.password) body.password = form.value.password;
      await api.patch(`/users/${form.value.id}`, body);
    } else {
      await api.post('/users', form.value);
    }
    ui.success('บันทึกบัญชีแล้ว');
    dialog.value = false;
    await load();
  } catch (e) {
    ui.error(errMsg(e));
  } finally {
    saving.value = false;
  }
}

async function deactivate(item) {
  try {
    await api.delete(`/users/${item.id}`);
    ui.success('ปิดใช้งานบัญชีแล้ว');
    await load();
  } catch (e) {
    ui.error(errMsg(e));
  }
}

onMounted(load);
</script>
