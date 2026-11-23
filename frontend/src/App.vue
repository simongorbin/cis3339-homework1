<script setup>
import AppNav from './components/AppNav.vue'
</script>

<template>
  <div class="app-shell">
    <AppNav />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
