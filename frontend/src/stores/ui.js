import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    snackbar: { show: false, text: '', color: 'success' },
  }),
  actions: {
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color };
    },
    success(text) {
      this.notify(text, 'success');
    },
    error(text) {
      this.notify(text, 'error');
    },
  },
});
