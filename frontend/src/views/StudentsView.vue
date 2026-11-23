<script setup>
import { onMounted, reactive, ref } from 'vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import { apiRequest } from '../api'

const form = reactive({ name: '', id: '', phone: '', zip: '' })
const searchName = ref('')
const students = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')

function clearFeedback() {
  message.value = ''
  error.value = ''
}

async function loadStudents() {
  loading.value = true
  clearFeedback()
  try {
    const data = await apiRequest('/students')
    students.value = Array.isArray(data) ? data : (data.students || [])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function addStudent() {
  clearFeedback()
  if (!form.name.trim() || !String(form.id).trim() || !form.phone.trim() || !form.zip.trim()) {
    error.value = 'Name, student ID, phone, and ZIP code are required.'
    return
  }
  loading.value = true
  try {
    await apiRequest('/add-student', { method: 'POST', body: JSON.stringify(form) })
    message.value = 'Student added successfully.'
    Object.assign(form, { name: '', id: '', phone: '', zip: '' })
    await loadStudents()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function searchStudent() {
  clearFeedback()
  if (!searchName.value.trim()) {
    error.value = 'Enter a student name to search.'
    return
  }
  loading.value = true
  try {
    const data = await apiRequest('/find-student', {
      method: 'POST',
      body: JSON.stringify({ name: searchName.value.trim() })
    })
    students.value = Array.isArray(data) ? data : [data]
  } catch (err) {
    students.value = []
    error.value = err.status === 404 ? 'Student not found.' : err.message
  } finally {
    loading.value = false
  }
}

async function deleteStudent(student) {
  if (!window.confirm(`Delete ${student.name}?`)) return
  loading.value = true
  clearFeedback()
  try {
    await apiRequest('/delete-student', {
      method: 'POST',
      body: JSON.stringify({ id: student.id })
    })
    message.value = 'Student deleted successfully.'
    await loadStudents()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadStudents)
</script>

<template>
  <section>
    <div class="page-heading"><div><p class="eyebrow">Directory</p><h1>Students</h1></div></div>
    <FeedbackMessage :message="message" :error="error" />

    <div class="grid-2">
      <form class="card" @submit.prevent="addStudent">
        <h2>Add Student</h2>
        <div class="field"><label for="name">Name</label><input id="name" v-model="form.name" required autocomplete="name" /></div>
        <div class="field"><label for="student-id">Student ID</label><input id="student-id" v-model="form.id" required inputmode="numeric" /></div>
        <div class="field"><label for="phone">Phone</label><input id="phone" v-model="form.phone" required autocomplete="tel" /></div>
        <div class="field"><label for="zip">ZIP code</label><input id="zip" v-model="form.zip" required autocomplete="postal-code" maxlength="10" /></div>
        <button class="primary" type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Add Student' }}</button>
      </form>

      <div class="card">
        <h2>Search Students</h2>
        <form class="search-row" @submit.prevent="searchStudent">
          <label class="sr-only" for="search-name">Student name</label>
          <input id="search-name" v-model="searchName" placeholder="Search by name" />
          <button type="submit" :disabled="loading">Search</button>
        </form>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-heading"><h2>Student Records</h2><button class="text-button" type="button" @click="loadStudents">Refresh</button></div>
      <div v-if="loading" class="empty-state">Loading students...</div>
      <div v-else-if="!students.length" class="empty-state">No students found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Student ID</th><th>Phone</th><th>ZIP</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody><tr v-for="student in students" :key="student.id || student._id">
            <td>{{ student.name }}</td><td>{{ student.id }}</td><td>{{ student.phone }}</td><td>{{ student.zip }}</td>
            <td><button class="danger-button" type="button" @click="deleteStudent(student)">Delete</button></td>
          </tr></tbody>
        </table>
      </div>
    </div>
  </section>
</template>
