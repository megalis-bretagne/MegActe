<script setup lang="ts">

import { onMounted } from "vue";

const { initUserFromAuth } = useUserContext();

onMounted(async () => {
  await initUserFromAuth();

});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
