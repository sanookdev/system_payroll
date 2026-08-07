<template>
  <v-app>
    <v-main class="bg-background d-flex align-center">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <div class="text-center mb-6">
              <v-icon icon="mdi-cash-multiple" size="52" color="primary" />
              <h1 class="text-h5 font-weight-bold mt-2">ระบบบริหารจัดการเงินรายได้บุคลากร</h1>
              <p class="text-medium-emphasis">คณะแพทยศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
            </div>

            <v-card elevation="3" class="pa-2">
              <v-card-text>
                <v-form @submit.prevent="submit">
                  <v-text-field
                    v-model="username"
                    label="Username"
                    prepend-inner-icon="mdi-account"
                    autofocus
                    required
                  />
                  <v-text-field
                    v-model="password"
                    label="Password"
                    prepend-inner-icon="mdi-lock"
                    :type="show ? 'text' : 'password'"
                    :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="show = !show"
                    required
                  />
                  <v-alert v-if="error" type="error" density="compact" class="mb-3" :text="error" />
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading"
                  >
                    เข้าสู่ระบบ
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>

            <v-card variant="tonal" class="mt-4" color="secondary">
              <v-card-text class="text-caption">
                <div class="font-weight-bold mb-1">
                  <v-icon icon="mdi-information" size="small" /> บัญชีทดสอบ (รหัสผ่าน: password123)
                </div>
                <div
                  v-for="d in demoAccounts"
                  :key="d.u"
                  class="d-flex justify-space-between demo-row"
                  @click="fill(d.u)"
                >
                  <code>{{ d.u }}</code>
                  <span>{{ d.label }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { errMsg } from '../services/api';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const show = ref(false);
const loading = ref(false);
const error = ref('');

const demoAccounts = [
  { u: 'superadmin', label: 'Super Admin' },
  { u: 'treasury', label: 'คลังและพัสดุ' },
  { u: 'source_hr', label: 'หน่วยงานต้นทาง' },
  { u: 'user', label: 'บุคลากร' },
];

function fill(u) {
  username.value = u;
  password.value = 'password123';
}

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(username.value, password.value);
    router.push(route.query.redirect || '/dashboard');
  } catch (e) {
    error.value = errMsg(e, 'เข้าสู่ระบบไม่สำเร็จ');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.demo-row {
  cursor: pointer;
  padding: 2px 0;
  border-radius: 4px;
}
.demo-row:hover {
  opacity: 0.8;
}
</style>
