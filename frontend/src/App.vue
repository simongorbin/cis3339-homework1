<script setup>
import AppNav from './components/AppNav.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="app-shell">
    <AppNav />
    <main id="main-content" class="main-content" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>
