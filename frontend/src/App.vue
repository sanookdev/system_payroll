<template>
  <v-app>
    <router-view />
    <v-snackbar
      v-model="ui.snackbar.show"
      :color="ui.snackbar.color"
      :timeout="3500"
      location="top right"
    >
      {{ ui.snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { useUiStore } from './stores/ui';
const ui = useUiStore();
</script>
