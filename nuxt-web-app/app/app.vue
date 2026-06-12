<script setup lang="ts">
import { onMounted } from "vue";
import { useUserContext } from "./composables/useUserContext";

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
