<script setup lang="ts">
console.log("C'est la page app.vue !!");
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-grow container mx-auto p-4">
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </main>
  </div>
</template>
