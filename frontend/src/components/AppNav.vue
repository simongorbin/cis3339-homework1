<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="brand-mark">SMS</span><span>Student Management</span></div>
    <nav class="nav-links" aria-label="Primary navigation">
      <RouterLink to="/">Students</RouterLink>
      <RouterLink to="/courses">Courses</RouterLink>
      <RouterLink to="/enrollments">Enrollments</RouterLink>
    </nav>
  </header>
</template>
