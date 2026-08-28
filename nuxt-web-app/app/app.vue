<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Megactes` : "Megactes"),
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
