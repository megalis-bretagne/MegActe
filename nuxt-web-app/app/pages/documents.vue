<script setup lang="ts">
// User initialization is handled by middleware/init-user.global.ts
useHead({ title: "Documents" });
</script>

<template>
  <div class="p-6 h-full">
    <DocumentList />
  </div>
</template>
