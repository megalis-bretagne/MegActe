<script setup lang="ts">
definePageMeta({ layout: "auth" });
useHead({ title: "Accès refusé" });

const { handleSignOut, loading } = useKeycloakSignOut();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div
      class="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center"
    >
      <div
        class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center"
      >
        <i class="pi pi-lock text-2xl text-red-500" />
      </div>
      <h1 class="text-lg font-semibold text-gray-900 mb-2">Accès refusé</h1>
      <p class="text-sm text-gray-500 mb-6">
        Ce compte n'a pas accès à Megactes. Contacte ton administrateur si tu
        penses que c'est une erreur.
      </p>
      <Button
        label="Se déconnecter"
        severity="secondary"
        class="w-full"
        :loading="loading"
        @click="handleSignOut"
      />
    </div>
  </div>
</template>
