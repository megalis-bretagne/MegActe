<script setup>
import { onMounted } from "vue";

// Authenticated user composable
const { user, initUserFromAuth, initPastellUser } = useUserContext();

// Initialize user from auth when component mounts
onMounted(() => {
  initUserFromAuth();
  initPastellUser();
});
</script>

<template>
  <div>Welcome {{ user?.name }} ({{ user?.email }}) to MegActe!</div>
</template>
