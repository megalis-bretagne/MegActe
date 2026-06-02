<script setup lang="ts">
const { initUserFromAuth, initPastellUser, user } = useUserContext();

onMounted(async () => {
  await initUserFromAuth();
  console.log("[app] user après initUserFromAuth:", JSON.stringify(user.value));

  if (user.value?.token) {
    await initPastellUser();
    console.log("[app] user après initPastellUser:", JSON.stringify(user.value));
    console.log("[app] pastell id_e:", user.value?.pastell?.id_e);
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