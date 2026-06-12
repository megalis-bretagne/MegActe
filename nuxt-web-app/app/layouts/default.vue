<script setup lang="ts">
const { selectedFlux } = useUserContext();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <TopBar />
    <div class="flex flex-1 overflow-hidden">
      <SideBar
        :selected-flux="selectedFlux"
        @select-flux="selectedFlux = $event"
      />
      <main class="flex-1 overflow-y-auto p-6">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>
