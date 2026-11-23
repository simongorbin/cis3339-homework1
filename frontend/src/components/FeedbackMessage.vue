<script setup>
defineProps({
  message: { type: String, default: '' },
  error: { type: String, default: '' }
})
</script>

<template>
  <div v-if="message" class="feedback success" role="status">{{ message }}</div>
  <div v-if="error" class="feedback danger" role="alert">{{ error }}</div>
</template>
