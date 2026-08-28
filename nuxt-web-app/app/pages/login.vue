<script setup lang="ts">
// Layout minimal (sans TopBar/SideBar) : le layout par défaut fetch /api/user/flux sans
// condition d'auth, ce qui affichait tout le shell derrière ce message avant la redirection.
definePageMeta({ layout: "auth" });
useHead({ title: "Connexion" });

const route = useRoute();
const { signIn } = useAuth();

onMounted(() => {
  signIn("keycloak", {
    callbackUrl: (route.query.callbackUrl as string) || "/",
  });
});
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen text-sm text-gray-500"
  >
    Redirection vers la connexion...
  </div>
</template>
