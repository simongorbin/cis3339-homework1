import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const message = ref('')
  const error = ref('')

  function clearFeedback() {
    message.value = ''
    error.value = ''
  }

  function setMessage(text) {
    error.value = ''
    message.value = text
  }

  function setError(text) {
    message.value = ''
    error.value = text
  }

  return { loading, message, error, clearFeedback, setMessage, setError }
})
