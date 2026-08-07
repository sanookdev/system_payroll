import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

// ธีมอิงจากเอกสารออกแบบ (เขียวเข้ม + ทองเป็น accent)
const payrollLight = {
  dark: false,
  colors: {
    background: '#FBFAF8',
    surface: '#FFFFFF',
    primary: '#0F5E5A',
    secondary: '#B7862F',
    accent: '#B7862F',
    error: '#A23A2E',
    info: '#5B7C99',
    success: '#2F7D4F',
    warning: '#B7862F',
  },
};

const payrollDark = {
  dark: true,
  colors: {
    background: '#14171B',
    surface: '#1B1F24',
    primary: '#56B7B0',
    secondary: '#D9A94A',
    accent: '#D9A94A',
    error: '#E08A7E',
    info: '#8FB0CC',
    success: '#6FBF8F',
    warning: '#D9A94A',
  },
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'payrollLight',
    themes: { payrollLight, payrollDark },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VCard: { rounded: 'lg' },
    VBtn: { rounded: 'lg', class: 'text-none' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  },
});
