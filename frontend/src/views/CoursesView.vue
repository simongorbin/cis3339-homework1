<script setup>
import { onMounted, reactive, ref } from 'vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import { apiRequest } from '../api'

const form = reactive({ id: '', name: '' })
const courses = ref([])
const loading = ref(false)
const message = ref('')
const error = ref('')

function clearFeedback() {
  message.value = ''
  error.value = ''
}

async function loadCourses() {
  loading.value = true
  clearFeedback()
  try {
    const data = await apiRequest('/courses')
    courses.value = Array.isArray(data) ? data : (data.courses || [])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function addCourse() {
  clearFeedback()
  if (!form.id.trim() || !form.name.trim()) {
    error.value = 'Course ID and course name are required.'
    return
  }

  loading.value = true
  try {
    await apiRequest('/courses', { method: 'POST', body: JSON.stringify(form) })
    message.value = 'Course added successfully.'
    Object.assign(form, { id: '', name: '' })
    await loadCourses()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function deleteCourse(course) {
  if (!window.confirm(`Delete ${course.name}? Its enrollments will also be removed.`)) return

  clearFeedback()
  loading.value = true
  try {
    await apiRequest(`/courses/${encodeURIComponent(course.id)}`, { method: 'DELETE' })
    message.value = 'Course deleted successfully.'
    await loadCourses()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadCourses)
</script>

<template>
  <section>
    <div class="page-heading"><div><p class="eyebrow">Catalog</p><h1>Courses</h1></div></div>
    <FeedbackMessage :message="message" :error="error" />

    <div class="grid-2">
      <form class="card" @submit.prevent="addCourse">
        <h2>Add Course</h2>
        <div class="field"><label for="course-id">Course ID</label><input id="course-id" v-model="form.id" required placeholder="CIS 3339" /></div>
        <div class="field"><label for="course-name">Course name</label><input id="course-name" v-model="form.name" required placeholder="Enterprise Applications Development" /></div>
        <button class="primary" type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Add Course' }}</button>
      </form>

      <div class="card table-card">
        <div class="card-heading"><h2>Course List</h2><button class="text-button" type="button" @click="loadCourses">Refresh</button></div>
        <div v-if="loading" class="empty-state">Loading courses...</div>
        <div v-else-if="!courses.length" class="empty-state">No courses found.</div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th>Course ID</th><th>Name</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody><tr v-for="course in courses" :key="course.id || course._id"><td>{{ course.id }}</td><td>{{ course.name }}</td><td><button class="danger-button" type="button" @click="deleteCourse(course)">Delete</button></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
