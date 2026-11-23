<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="topbar">
    <RouterLink class="brand brand-link" to="/" aria-label="Student Management System home">
      <span class="brand-mark" aria-hidden="true">SMS</span>
      <span>Student Management</span>
    </RouterLink>
    <nav class="nav-links" aria-label="Primary navigation">
      <RouterLink to="/" :aria-current="$route.path === '/' ? 'page' : undefined">Students</RouterLink>
      <RouterLink to="/courses" :aria-current="$route.path === '/courses' ? 'page' : undefined">Courses</RouterLink>
      <RouterLink to="/enrollments" :aria-current="$route.path === '/enrollments' ? 'page' : undefined">Enrollments</RouterLink>
    </nav>
  </header>
</template>
