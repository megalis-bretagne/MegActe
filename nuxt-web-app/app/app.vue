<script setup lang="ts">
import { onMounted } from "vue";

const { initUserFromAuth } = useUserContext();

onMounted(async () => {
  await initUserFromAuth();

  //const { initAppLogger } = useAppLogger();

  //initAppLogger(process.env.LOGGER_PREFIX);
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
