import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { vuetify } from './plugins/vuetify';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(vuetify);

// กู้คืน session จาก token ที่เก็บไว้ ก่อน mount router
const auth = useAuthStore();
auth
  .restore()
  .catch(() => {})
  .finally(() => {
    app.use(router);
    app.mount('#app');
  });
