<script setup>
import { onMounted, ref } from 'vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'
import { apiRequest } from '../api'

const students = ref([])
const courses = ref([])
const roster = ref([])
const studentId = ref('')
const courseId = ref('')
const rosterCourseId = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

function clearFeedback() {
  message.value = ''
  error.value = ''
}

async function loadSelections() {
  loading.value = true
  clearFeedback()
  try {
    const [studentData, courseData] = await Promise.all([apiRequest('/students'), apiRequest('/courses')])
    students.value = Array.isArray(studentData) ? studentData : (studentData.students || [])
    courses.value = Array.isArray(courseData) ? courseData : (courseData.courses || [])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function enroll() {
  clearFeedback()
  if (!studentId.value || !courseId.value) {
    error.value = 'Select both a student and a course.'
    return
  }

  loading.value = true
  try {
    await apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ studentId: studentId.value, courseId: courseId.value })
    })
    message.value = 'Enrollment added successfully.'

    if (rosterCourseId.value === courseId.value) {
      await loadRoster()
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadRoster() {
  clearFeedback()
  if (!rosterCourseId.value) {
    error.value = 'Select a course to view its roster.'
    roster.value = []
    return
  }

  loading.value = true
  try {
    const data = await apiRequest(`/courses/${encodeURIComponent(rosterCourseId.value)}/students`)
    roster.value = Array.isArray(data) ? data : (data.students || [])
  } catch (err) {
    roster.value = []
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadSelections)
</script>

<template>
  <section>
    <div class="page-heading"><div><p class="eyebrow">Registration</p><h1>Enrollments</h1></div></div>
    <FeedbackMessage :message="message" :error="error" />

    <div class="grid-2">
      <form class="card" @submit.prevent="enroll">
        <h2>Create Enrollment</h2>
        <div class="field">
          <label for="student-select">Student</label>
          <select id="student-select" v-model="studentId" required>
            <option value="">Select a student</option>
            <option v-for="student in students" :key="student.id || student._id" :value="student.id">{{ student.name }} ({{ student.id }})</option>
          </select>
        </div>
        <div class="field">
          <label for="course-select">Course</label>
          <select id="course-select" v-model="courseId" required>
            <option value="">Select a course</option>
            <option v-for="course in courses" :key="course.id || course._id" :value="course.id">{{ course.id }} — {{ course.name }}</option>
          </select>
        </div>
        <button class="primary" type="submit" :disabled="loading || !students.length || !courses.length">Enroll Student</button>
        <p v-if="!students.length || !courses.length" class="empty-state">Add at least one student and one course before enrolling.</p>
      </form>

      <div class="card">
        <h2>Course Roster</h2>
        <form class="search-row" @submit.prevent="loadRoster">
          <label class="sr-only" for="roster-course">Course</label>
          <select id="roster-course" v-model="rosterCourseId">
            <option value="">Select a course</option>
            <option v-for="course in courses" :key="course.id || course._id" :value="course.id">{{ course.id }} — {{ course.name }}</option>
          </select>
          <button type="submit" :disabled="loading || !courses.length">View Roster</button>
        </form>

        <div v-if="loading" class="empty-state">Loading roster...</div>
        <div v-else-if="!roster.length" class="empty-state">No enrolled students to show.</div>
        <ul v-else class="roster-list">
          <li v-for="student in roster" :key="student.id || student._id"><strong>{{ student.name }}</strong><span>{{ student.id }}</span></li>
        </ul>
      </div>
    </div>
  </section>
</template>
