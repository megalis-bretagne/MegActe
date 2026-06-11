<script setup lang="ts">
const { initUserFromAuth, initPastellUser, user } = useUserContext();

onMounted(async () => {
  await initUserFromAuth();

  if (user.value?.token) {
    // Fire-and-forget : pas de await, la page réagit via computed dès que pastellReady passe à true
    initPastellUser();
  } else {
    console.warn("[app] pas de token, initPastellUser ignoré");
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
