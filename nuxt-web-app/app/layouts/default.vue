<script setup lang="ts"></script>
<template>
  <div class="h-screen flex flex-col">
    <TopBar />
    <div class="flex flex-1 overflow-hidden">
      <SideBar />
      <main class="flex-1 overflow-y-auto p-6">
        <NuxtRouteAnnouncer />
        <slot />
      </main>
    </div>
  </div>
</template>
