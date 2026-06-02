<script setup lang="ts"></script>

<template>
  <div class="min-h-screen flex flex-col">
    <TopBar />

    <div class="flex flex-1 overflow-hidden">
      <SideBar />

      <main class="flex-1 overflow-y-auto p-6">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Layout-specific styles can be added here */
</style>
