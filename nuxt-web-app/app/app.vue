<script setup lang="ts">
import { onMounted } from "vue";

const { initUserFromAuth, initPastellUser, user } = useUserContext();

// Initialize user from auth when app mounts
onMounted(async () => {
  await initUserFromAuth();
  // Only fetch Pastell user if we have a token from auth
  if (user.value?.token) {
    await initPastellUser();
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
